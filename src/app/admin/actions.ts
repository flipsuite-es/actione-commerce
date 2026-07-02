"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { BUCKET } from "@/lib/storage";
import { slugify } from "@/lib/format";

async function requireAdmin() {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

function num(v: FormDataEntryValue | null): number {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function refreshStore() {
  revalidatePath("/");
  revalidatePath("/tienda");
}

export async function signOut() {
  const supabase = createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ---------------- Productos ---------------- */

export async function saveProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const slug =
    String(formData.get("slug") || "").trim() || slugify(name) || `p-${Date.now()}`;
  const images = JSON.parse(String(formData.get("images") || "[]")) as string[];

  const record = {
    name,
    slug,
    description: String(formData.get("description") || ""),
    price: num(formData.get("price")),
    compare_at_price: formData.get("compare_at_price") ? num(formData.get("compare_at_price")) : null,
    stock: Math.round(num(formData.get("stock"))),
    sku: String(formData.get("sku") || "") || null,
    material: String(formData.get("material") || "") || null,
    category_id: String(formData.get("category_id") || "") || null,
    images,
    status: String(formData.get("status") || "draft"),
    featured: formData.get("featured") === "on",
    sort: Math.round(num(formData.get("sort"))),
  };

  if (id) {
    const { error } = await supabase.from("products").update(record).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("products").insert(record);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/productos");
  refreshStore();
  redirect("/admin/productos");
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/productos");
  refreshStore();
}

export async function duplicateProduct(id: string) {
  const supabase = await requireAdmin();
  const { data } = await supabase.from("products").select("*").eq("id", id).single();
  if (!data) return;
  const { id: _id, created_at, updated_at, ...rest } = data as any;
  await supabase.from("products").insert({
    ...rest,
    name: `${rest.name} (copia)`,
    slug: `${rest.slug}-${Date.now().toString(36)}`,
    status: "draft",
  });
  revalidatePath("/admin/productos");
}

export async function adjustStock(id: string, delta: number) {
  const supabase = await requireAdmin();
  const { data } = await supabase.from("products").select("stock").eq("id", id).single();
  const current = (data?.stock as number) ?? 0;
  const { error } = await supabase
    .from("products")
    .update({ stock: Math.max(0, current + delta) })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/productos");
  refreshStore();
}

export async function toggleProduct(id: string, field: "featured" | "status") {
  const supabase = await requireAdmin();
  const { data } = await supabase.from("products").select("featured,status").eq("id", id).single();
  if (!data) return;
  const patch =
    field === "featured"
      ? { featured: !data.featured }
      : { status: data.status === "active" ? "draft" : "active" };
  await supabase.from("products").update(patch).eq("id", id);
  revalidatePath("/admin/productos");
  refreshStore();
}

export async function uploadImage(formData: FormData): Promise<string> {
  const supabase = await requireAdmin();
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Sin archivo");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/* ---------------- Categorías ---------------- */

export async function saveCategory(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const record = { name, slug: slugify(name), sort: Math.round(num(formData.get("sort"))) };
  if (id) await supabase.from("categories").update(record).eq("id", id);
  else await supabase.from("categories").insert(record);
  revalidatePath("/admin/categorias");
  refreshStore();
}

export async function deleteCategory(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/categorias");
  refreshStore();
}

export async function moveCategory(id: string, dir: -1 | 1) {
  const supabase = await requireAdmin();
  const { data } = await supabase.from("categories").select("sort").eq("id", id).single();
  const sort = (data?.sort as number) ?? 0;
  await supabase.from("categories").update({ sort: sort + dir }).eq("id", id);
  revalidatePath("/admin/categorias");
  refreshStore();
}

/* ---------------- Pedidos ---------------- */

export async function updateOrder(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const base: any = { status: String(formData.get("status") || "pending") };
  // Campos que dependen de la migración 002 → intento por separado.
  const extra = {
    ...base,
    tracking: String(formData.get("tracking") || "") || null,
    note: String(formData.get("note") || "") || null,
  };
  const { error } = await supabase.from("orders").update(extra).eq("id", id);
  if (error) {
    // Si aún no está la migración (tracking), guarda al menos el estado.
    await supabase.from("orders").update(base).eq("id", id);
  }
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
}

/* ---------------- Cupones ---------------- */

export async function saveCoupon(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  const record = {
    code: String(formData.get("code") || "").trim().toUpperCase(),
    kind: String(formData.get("kind") || "percent"),
    value: num(formData.get("value")),
    min_subtotal: num(formData.get("min_subtotal")),
    active: formData.get("active") === "on",
  };
  if (!record.code) return;
  if (id) await supabase.from("coupons").update(record).eq("id", id);
  else await supabase.from("coupons").insert(record);
  revalidatePath("/admin/cupones");
}

export async function deleteCoupon(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("coupons").delete().eq("id", id);
  revalidatePath("/admin/cupones");
}

/* ---------------- Páginas ---------------- */

export async function savePage(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const record = {
    title,
    slug: String(formData.get("slug") || "").trim() || slugify(title),
    body: String(formData.get("body") || ""),
    published: formData.get("published") === "on",
    sort: Math.round(num(formData.get("sort"))),
  };
  if (id) await supabase.from("pages").update(record).eq("id", id);
  else await supabase.from("pages").insert(record);
  revalidatePath("/admin/paginas");
  redirect("/admin/paginas");
}

export async function deletePage(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("pages").delete().eq("id", id);
  revalidatePath("/admin/paginas");
}

/* ---------------- Ajustes ---------------- */

export async function saveSettings(formData: FormData) {
  const supabase = await requireAdmin();
  const base = {
    shop_name: String(formData.get("shop_name") || "Oucy Studios"),
    tagline: String(formData.get("tagline") || ""),
    announcement: String(formData.get("announcement") || ""),
    prelaunch_enabled: formData.get("prelaunch_enabled") === "on",
    access_code: String(formData.get("access_code") || "oucy2026"),
    free_ship_threshold: num(formData.get("free_ship_threshold")),
    shipping_flat: num(formData.get("shipping_flat")),
  };
  const { error } = await supabase.from("settings").update(base).eq("id", 1);
  if (error) throw new Error(error.message);

  // Contenido (migración 002) — se guarda aparte para no romper si aún no existe.
  const content = {
    instagram_url: String(formData.get("instagram_url") || ""),
    tiktok_url: String(formData.get("tiktok_url") || ""),
    whatsapp_url: String(formData.get("whatsapp_url") || ""),
    contact_email: String(formData.get("contact_email") || ""),
    hero_subtitle: String(formData.get("hero_subtitle") || ""),
    story_text: String(formData.get("story_text") || ""),
  };
  await supabase.from("settings").update(content).eq("id", 1);

  revalidatePath("/admin/ajustes");
  refreshStore();
}

/* ---------------- Soporte / Tickets ---------------- */

export async function replyTicket(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!id || !body) return;
  const { error } = await supabase
    .from("ticket_messages")
    .insert({ ticket_id: id, author: "admin", body });
  if (error) throw new Error(error.message);
  await supabase
    .from("tickets")
    .update({ status: "answered", last_message_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/soporte");
  revalidatePath(`/admin/soporte/${id}`);
}

export async function updateTicketMeta(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase
    .from("tickets")
    .update({
      status: String(formData.get("status") || "open"),
      priority: String(formData.get("priority") || "normal"),
    })
    .eq("id", id);
  revalidatePath("/admin/soporte");
  revalidatePath(`/admin/soporte/${id}`);
}

export async function deleteTicket(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("tickets").delete().eq("id", id);
  revalidatePath("/admin/soporte");
  redirect("/admin/soporte");
}
