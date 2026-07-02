import { createSupabaseServer } from "@/lib/supabase/server";
import type { Category, Page, Product, Review, Settings } from "@/lib/types";

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  shop_name: "Oucy Studios",
  tagline: "Oro para cada día.",
  announcement: "",
  prelaunch_enabled: true,
  access_code: "oucy2026",
  free_ship_threshold: 24.9,
  shipping_flat: 2.95,
  instagram_url: "https://instagram.com/oucystudios",
  tiktok_url: "https://tiktok.com/@oucystudios",
  whatsapp_url: "",
  contact_email: "",
  hero_subtitle:
    "Joyas doradas atemporales, diseñadas en nuestro estudio para acompañarte cada día y para regalar.",
  story_text:
    "Oucy Studios nace de una idea sencilla: llevar algo bonito no debería ser un lujo reservado para las grandes ocasiones. Diseñamos joyas doradas atemporales, pensadas para tu día a día y para los momentos que quieres recordar. Piezas para tener siempre, para regalarte y para regalar.",
};

/** Rellena los campos que aún no existan (antes de correr la migración 002). */
export function normalizeSettings(row: any): Settings {
  return { ...DEFAULT_SETTINGS, ...(row ?? {}) } as Settings;
}

export async function getSettings(): Promise<Settings> {
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
    return normalizeSettings(data);
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

export async function getPages(): Promise<Page[]> {
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase
      .from("pages")
      .select("*")
      .eq("published", true)
      .order("sort", { ascending: true });
    return (data as Page[]) ?? [];
  } catch {
    return [];
  }
}

/** Reseñas aprobadas de un producto (RLS ya limita a approved=true). */
export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("approved", true)
      .order("created_at", { ascending: false });
    return (data as Review[]) ?? [];
  } catch {
    return [];
  }
}

/** Reseñas aprobadas recientes (con texto) para la home. */
export async function getRecentReviews(limit = 3): Promise<Review[]> {
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("approved", true)
      .gte("rating", 4)
      .neq("body", "")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as Review[]) ?? [];
  } catch {
    return [];
  }
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase
      .from("pages")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();
    return (data as Page) ?? null;
  } catch {
    return null;
  }
}
