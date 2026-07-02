"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import type { CartItem } from "@/lib/types";

export async function createOrder(payload: {
  items: CartItem[];
  name: string;
  email: string;
  phone?: string;
  note?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { items, name, email, phone, note } = payload;
  if (!items?.length) return { ok: false, error: "La cesta está vacía." };
  if (!email || !name) return { ok: false, error: "Falta nombre o correo." };

  const settings = await getSettings();
  const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);
  const shipping =
    subtotal >= settings.free_ship_threshold ? 0 : settings.shipping_flat;
  const total = subtotal + shipping;

  try {
    const supabase = createSupabaseServer();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        name,
        email,
        phone: phone ?? null,
        note: note ?? null,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
        })),
        subtotal,
        shipping,
        total,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data.id as string };
  } catch {
    return { ok: false, error: "No se pudo registrar el pedido." };
  }
}
