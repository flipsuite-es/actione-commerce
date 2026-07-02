"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import type { TicketThread } from "@/lib/types";

/** Abre un ticket de soporte (cliente anónimo). Devuelve la referencia. */
export async function openTicket(input: {
  name: string;
  email: string;
  subject: string;
  orderRef?: string;
  body: string;
}): Promise<{ ok: boolean; ref?: string; error?: string }> {
  const name = input.name?.trim();
  const email = input.email?.trim();
  const subject = input.subject?.trim();
  const body = input.body?.trim();
  if (!name || !email || !subject || !body)
    return { ok: false, error: "Completa nombre, correo, asunto y mensaje." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { ok: false, error: "El correo no parece válido." };

  try {
    const supabase = createSupabaseServer();
    const { data, error } = await supabase.rpc("open_ticket", {
      p_name: name,
      p_email: email,
      p_subject: subject,
      p_order_ref: input.orderRef?.trim() || null,
      p_body: body,
    });
    if (error) return { ok: false, error: "No se pudo abrir el ticket. Inténtalo de nuevo." };
    return { ok: true, ref: data as string };
  } catch {
    return { ok: false, error: "No se pudo abrir el ticket. Inténtalo de nuevo." };
  }
}

/** Consulta el hilo de un ticket con su referencia + correo. */
export async function fetchTicketThread(
  ref: string,
  email: string,
): Promise<{ ok: boolean; thread?: TicketThread; error?: string }> {
  if (!ref?.trim() || !email?.trim())
    return { ok: false, error: "Indica la referencia y tu correo." };
  try {
    const supabase = createSupabaseServer();
    const { data, error } = await supabase.rpc("ticket_thread", {
      p_ref: ref.trim(),
      p_email: email.trim(),
    });
    if (error || !data)
      return { ok: false, error: "No encontramos ningún ticket con esos datos." };
    return { ok: true, thread: data as TicketThread };
  } catch {
    return { ok: false, error: "No se pudo consultar el ticket." };
  }
}

/** Añade una respuesta del cliente a su propio ticket. */
export async function replyToTicket(
  ref: string,
  email: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!body?.trim()) return { ok: false, error: "Escribe un mensaje." };
  try {
    const supabase = createSupabaseServer();
    const { data, error } = await supabase.rpc("reply_ticket", {
      p_ref: ref.trim(),
      p_email: email.trim(),
      p_body: body.trim(),
    });
    if (error || !data)
      return { ok: false, error: "No se pudo enviar tu respuesta." };
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo enviar tu respuesta." };
  }
}
