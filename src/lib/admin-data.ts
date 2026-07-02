import { createSupabaseServer } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto";
import type {
  Category,
  Coupon,
  Notification,
  Order,
  Page,
  Product,
  Review,
  Subscriber,
  Supplier,
  Ticket,
  TicketMessage,
  VaultEntry,
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

/* ---------------- Copiloto: resumen del estado de la tienda ---------------- */

/** Foto compacta del backoffice para dar contexto al copiloto de IA.
 *  Solo lectura y resumida (cuentas + listas cortas) para acotar tokens. */
export async function getStoreSnapshot() {
  const [products, orders, tickets, reviews, subscribers, suppliers] = await Promise.all([
    getAllProducts().catch(() => []),
    getAllOrders().catch(() => []),
    getAllTickets().catch(() => []),
    getAllReviews().catch(() => []),
    getSubscribers().catch(() => []),
    getAllSuppliers().catch(() => []),
  ]);
  const supplierName = new Map(suppliers.map((s) => [s.id, s.name]));
  const paid = orders.filter((o) => o.status === "paid" || o.status === "shipped");
  const revenue = paid.reduce((n, o) => n + Number(o.total || 0), 0);

  return {
    products: {
      total: products.length,
      activos: products.filter((p) => p.status === "active").length,
      borradores: products.filter((p) => p.status === "draft").length,
      sinStock: products.filter((p) => p.stock <= 0).length,
      sinProveedor: products.filter((p) => !p.supplier_id).length,
      sinPrecio: products.filter((p) => !p.price).length,
      stockBajo: products
        .filter((p) => p.stock <= 3)
        .slice(0, 30)
        .map((p) => ({
          nombre: p.name,
          stock: p.stock,
          proveedor: p.supplier_id ? supplierName.get(p.supplier_id) ?? null : null,
        })),
    },
    pedidos: {
      total: orders.length,
      pendientes: orders.filter((o) => o.status === "pending").length,
      pagadosOenviados: paid.length,
      ingresosEUR: Math.round(revenue * 100) / 100,
      recientes: orders.slice(0, 8).map((o) => ({
        ref: o.id.slice(0, 8),
        estado: o.status,
        total: o.total,
        cliente: o.name || o.email,
      })),
    },
    soporte: {
      abiertosOpendientes: tickets.filter(
        (t) => t.status === "open" || t.status === "pending",
      ).length,
      recientes: tickets.slice(0, 8).map((t) => ({
        asunto: t.subject,
        estado: t.status,
        cliente: t.name,
      })),
    },
    resenas: { porAprobar: reviews.filter((r) => !r.approved).length },
    suscriptores: subscribers.length,
    proveedores: suppliers.map((s) => ({
      nombre: s.name,
      contacto: s.contact_name,
      email: s.email,
      plazoDias: s.lead_time_days,
      activo: s.active,
    })),
  };
}

/* ---------------- Proveedores ---------------- */

export async function getAllSuppliers(): Promise<Supplier[]> {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true });
  return (data as Supplier[]) ?? [];
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const supabase = createSupabaseServer();
  const { data } = await supabase.from("suppliers").select("*").eq("id", id).single();
  return (data as Supplier) ?? null;
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

/* ---------------- Reseñas ---------------- */

export interface ReviewWithProduct extends Review {
  product?: { name: string; slug: string } | null;
}

export async function getAllReviews(): Promise<ReviewWithProduct[]> {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("reviews")
    .select("*, product:products(name, slug)")
    .order("created_at", { ascending: false });
  return (data as ReviewWithProduct[]) ?? [];
}

/* ---------------- Suscriptores ---------------- */

export async function getSubscribers(): Promise<Subscriber[]> {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Subscriber[]) ?? [];
}

/* ---------------- Bóveda de contraseñas ---------------- */

export async function getVaultEntries(): Promise<VaultEntry[]> {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("vault_entries")
    .select("*")
    .order("title", { ascending: true });
  return ((data as any[]) ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url,
    username: r.username,
    password: decryptSecret(r.secret_enc || ""),
    notes: r.notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}
