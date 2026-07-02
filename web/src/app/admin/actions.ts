"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin, BUCKET } from "@/lib/supabase/admin";
import { slugify } from "@/lib/format";

export async function signOut() {
  const supabase = createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

async function requireUser() {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return user;
}

function num(v: FormDataEntryValue | null): number {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export async function saveProduct(formData: FormData) {
  await requireUser();
  const admin = createSupabaseAdmin();

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
    compare_at_price: formData.get("compare_at_price")
      ? num(formData.get("compare_at_price"))
      : null,
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
    const { error } = await admin.from("products").update(record).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("products").insert(record);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
  redirect("/admin/productos");
}

export async function deleteProduct(id: string) {
  await requireUser();
  const admin = createSupabaseAdmin();
  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
}

export async function adjustStock(id: string, delta: number) {
  await requireUser();
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("products").select("stock").eq("id", id).single();
  const current = (data?.stock as number) ?? 0;
  const { error } = await admin
    .from("products")
    .update({ stock: Math.max(0, current + delta) })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/productos");
}

export async function uploadImage(formData: FormData): Promise<string> {
  await requireUser();
  const admin = createSupabaseAdmin();
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Sin archivo");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);
  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function saveSettings(formData: FormData) {
  await requireUser();
  const admin = createSupabaseAdmin();
  const record = {
    shop_name: String(formData.get("shop_name") || "Oucy Studios"),
    tagline: String(formData.get("tagline") || ""),
    announcement: String(formData.get("announcement") || ""),
    prelaunch_enabled: formData.get("prelaunch_enabled") === "on",
    access_code: String(formData.get("access_code") || "oucy2026"),
    free_ship_threshold: num(formData.get("free_ship_threshold")),
    shipping_flat: num(formData.get("shipping_flat")),
  };
  const { error } = await admin.from("settings").update(record).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/ajustes");
  revalidatePath("/");
}

export async function saveCategory(formData: FormData) {
  await requireUser();
  const admin = createSupabaseAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const { error } = await admin
    .from("categories")
    .insert({ name, slug: slugify(name), sort: Math.round(num(formData.get("sort"))) });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/productos");
}
