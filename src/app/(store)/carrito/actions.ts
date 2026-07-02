"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import type { CartItem, Coupon } from "@/lib/types";

async function findCoupon(code: string): Promise<Coupon | null> {
  if (!code) return null;
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .eq("active", true)
      .single();
    return (data as Coupon) ?? null;
  } catch {
    return null;
  }
}

function discountFor(coupon: Coupon | null, subtotal: number): number {
  if (!coupon) return 0;
  if (subtotal < (coupon.min_subtotal || 0)) return 0;
  const d =
    coupon.kind === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  return Math.min(subtotal, Math.max(0, Math.round(d * 100) / 100));
}

export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<{ ok: boolean; discount: number; code?: string; message: string }> {
  const coupon = await findCoupon(code);
  if (!coupon) return { ok: false, discount: 0, message: "Cupón no válido." };
  if (subtotal < (coupon.min_subtotal || 0))
    return {
      ok: false,
      discount: 0,
      message: `Mínimo ${coupon.min_subtotal} € para este cupón.`,
    };
  return {
    ok: true,
    discount: discountFor(coupon, subtotal),
    code: coupon.code,
    message: "Cupón aplicado ✦",
  };
}

export async function createOrder(payload: {
  items: CartItem[];
  name: string;
  email: string;
  phone?: string;
  note?: string;
  couponCode?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { items, name, email, phone, note, couponCode } = payload;
  if (!items?.length) return { ok: false, error: "La cesta está vacía." };
  if (!email || !name) return { ok: false, error: "Falta nombre o correo." };

  const settings = await getSettings();
  const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);
  const shipping = subtotal >= settings.free_ship_threshold ? 0 : settings.shipping_flat;
  const coupon = couponCode ? await findCoupon(couponCode) : null;
  const discount = discountFor(coupon, subtotal);
  const total = Math.max(0, subtotal + shipping - discount);

  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const record: any = {
      name,
      email,
      phone: phone ?? null,
      note: note ?? null,
      items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      subtotal,
      shipping,
      total,
      status: "pending",
      user_id: user?.id ?? null,
    };
    if (coupon) {
      record.discount = discount;
      record.coupon_code = coupon.code;
    }
    let res = await supabase.from("orders").insert(record).select("id").single();
    if (res.error && record.discount !== undefined) {
      delete record.discount;
      delete record.coupon_code;
      res = await supabase.from("orders").insert(record).select("id").single();
    }
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, id: res.data.id as string };
  } catch {
    return { ok: false, error: "No se pudo registrar el pedido." };
  }
}
