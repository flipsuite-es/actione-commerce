import { createSupabaseServer } from "@/lib/supabase/server";
import type {
  Category,
  Coupon,
  Notification,
  Order,
  Page,
  Product,
  Ticket,
  TicketMessage,
} from "@/lib/types";

/** Lecturas del panel (usuario autenticado → RLS permite ver todo). */

export async function getAllProducts(): Promise<Product[]> {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("sort", { ascending: true })
    .order("created_at", { ascending: false });
  return (data as Product[]) ?? [];
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createSupabaseServer();
  const { data } = await supabase.from("products").select("*").eq("id", id).single();
  return (data as Product) ?? null;
}

export async function getAllCategories(): Promise<Category[]> {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort", { ascending: true });
  return (data as Category[]) ?? [];
}

export async function getAllOrders(): Promise<Order[]> {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Order[]) ?? [];
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = createSupabaseServer();
  const { data } = await supabase.from("orders").select("*").eq("id", id).single();
  return (data as Order) ?? null;
}

export async function getAllCoupons(): Promise<Coupon[]> {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Coupon[]) ?? [];
}

export async function getAllPages(): Promise<Page[]> {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("pages")
    .select("*")
    .order("sort", { ascending: true });
  return (data as Page[]) ?? [];
}

export async function getPageByIdAdmin(id: string): Promise<Page | null> {
  const supabase = createSupabaseServer();
  const { data } = await supabase.from("pages").select("*").eq("id", id).single();
  return (data as Page) ?? null;
}

/* ---------------- Soporte / Tickets ---------------- */

export async function getAllTickets(): Promise<Ticket[]> {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .order("last_message_at", { ascending: false });
  return (data as Ticket[]) ?? [];
}

export async function getTicketWithMessages(
  id: string,
): Promise<{ ticket: Ticket; messages: TicketMessage[] } | null> {
  const supabase = createSupabaseServer();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();
  if (!ticket) return null;
  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });
  return { ticket: ticket as Ticket, messages: (messages as TicketMessage[]) ?? [] };
}

/* ---------------- Notificaciones ---------------- */

export async function getNotifications(
  limit = 20,
): Promise<{ items: Notification[]; unread: number }> {
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    const items = (data as Notification[]) ?? [];
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false);
    return { items, unread: count ?? items.filter((n) => !n.read).length };
  } catch {
    return { items: [], unread: 0 };
  }
}
