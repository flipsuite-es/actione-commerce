"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import type { OrderStatusResult } from "@/lib/types";

/** Consulta el estado de un pedido por referencia (8 primeros del id) + correo. */
export async function fetchOrderStatus(
  ref: string,
  email: string,
): Promise<{ ok: boolean; order?: OrderStatusResult; error?: string }> {
  if (!ref?.trim() || !email?.trim())
    return { ok: false, error: "Indica la referencia y tu correo." };
  try {
    const supabase = createSupabaseServer();
    const { data, error } = await supabase.rpc("order_status", {
      p_ref: ref.trim(),
      p_email: email.trim(),
    });
    if (error || !data)
      return { ok: false, error: "No encontramos ningún pedido con esos datos." };
    return { ok: true, order: data as OrderStatusResult };
  } catch {
    return { ok: false, error: "No se pudo consultar el pedido." };
  }
}

/** Alta de correo en el newsletter (o muro). Dedup por email en la DB. */
export async function subscribe(
  email: string,
  source = "newsletter",
): Promise<{ ok: boolean; error?: string }> {
  const e = email?.trim();
  if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
    return { ok: false, error: "Correo no válido." };
  try {
    const supabase = createSupabaseServer();
    const { data, error } = await supabase.rpc("subscribe_email", {
      p_email: e,
      p_source: source,
    });
    if (error || !data) return { ok: false, error: "No se pudo suscribir." };
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo suscribir." };
  }
}

/** Enviar una reseña de producto (queda pendiente de moderación). */
export async function submitReview(input: {
  productId: string;
  name: string;
  rating: number;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const name = input.name?.trim();
  const rating = Math.round(Number(input.rating));
  if (!name) return { ok: false, error: "Indica tu nombre." };
  if (!(rating >= 1 && rating <= 5))
    return { ok: false, error: "Elige una valoración de 1 a 5 estrellas." };
  try {
    const supabase = createSupabaseServer();
    const { data, error } = await supabase.rpc("submit_review", {
      p_product_id: input.productId,
      p_name: name,
      p_rating: rating,
      p_body: input.body?.trim() || "",
    });
    if (error || !data) return { ok: false, error: "No se pudo enviar la reseña." };
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo enviar la reseña." };
  }
}
