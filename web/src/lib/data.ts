import { createSupabaseServer } from "@/lib/supabase/server";
import type { Category, Product, Settings } from "@/lib/types";

const DEFAULT_SETTINGS: Settings = {
  id: 1,
  shop_name: "Oucy Studios",
  tagline: "Joyas que duran, no se oxidan.",
  announcement: "",
  prelaunch_enabled: true,
  access_code: "oucy2026",
  free_ship_threshold: 24.9,
  shipping_flat: 2.95,
};

/** Ajustes de la tienda. Si Supabase no está configurado, devuelve valores por defecto. */
export async function getSettings(): Promise<Settings> {
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
    return (data as Settings) ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function getActiveProducts(): Promise<Product[]> {
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("featured", { ascending: false })
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false });
    return (data as Product[]) ?? [];
  } catch {
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .single();
    return (data as Product) ?? null;
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("sort", { ascending: true });
    return (data as Category[]) ?? [];
  } catch {
    return [];
  }
}
