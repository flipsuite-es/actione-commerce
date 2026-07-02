"use server";

import { createSupabaseServer } from "@/lib/supabase/server";

export interface WItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
}

async function currentUserId() {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/** Favoritos guardados en la cuenta del usuario. */
export async function getWishlist(): Promise<WItem[]> {
  try {
    const { supabase, userId } = await currentUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from("wishlist_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data ?? []).map((r: any) => ({
      id: r.product_id,
      slug: r.slug,
      name: r.name,
      price: Number(r.price),
      image: r.image,
    }));
  } catch {
    return [];
  }
}

/** Al iniciar sesión: sube los favoritos locales y devuelve la unión. */
export async function syncWishlist(local: WItem[]): Promise<WItem[]> {
  try {
    const { supabase, userId } = await currentUserId();
    if (!userId) return local;
    if (local.length) {
      const rows = local.map((i) => ({
        user_id: userId,
        product_id: i.id,
        slug: i.slug,
        name: i.name,
        price: i.price,
        image: i.image,
      }));
      await supabase.from("wishlist_items").upsert(rows, {
        onConflict: "user_id,product_id",
      });
    }
    return getWishlist();
  } catch {
    return local;
  }
}

export async function addWishlist(item: WItem): Promise<void> {
  try {
    const { supabase, userId } = await currentUserId();
    if (!userId) return;
    await supabase.from("wishlist_items").upsert(
      {
        user_id: userId,
        product_id: item.id,
        slug: item.slug,
        name: item.name,
        price: item.price,
        image: item.image,
      },
      { onConflict: "user_id,product_id" },
    );
  } catch {
    /* silencioso: el localStorage mantiene el estado */
  }
}

export async function removeWishlist(productId: string): Promise<void> {
  try {
    const { supabase, userId } = await currentUserId();
    if (!userId) return;
    await supabase
      .from("wishlist_items")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
  } catch {
    /* silencioso */
  }
}
