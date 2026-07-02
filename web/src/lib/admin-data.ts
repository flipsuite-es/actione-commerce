import { createSupabaseServer } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

/** Lecturas del panel (usuario autenticado → RLS permite ver todo, incl. borradores). */

export async function getAllProducts(): Promise<Product[]> {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("products")
    .select("*")
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

export async function getAllOrders() {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}
