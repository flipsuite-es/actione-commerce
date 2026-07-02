import { createSupabaseServer } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

/** Usuario autenticado (cliente o admin) o null. */
export async function getAuthUser(): Promise<User | null> {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

/** Perfil del usuario actual (o null si no hay sesión). */
export async function getMyProfile(): Promise<Profile | null> {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    return (data as Profile) ?? null;
  } catch {
    return null;
  }
}

/** ¿El usuario actual es admin? (para proteger el backoffice). */
export async function getIsAdmin(): Promise<boolean> {
  const profile = await getMyProfile();
  return profile?.role === "admin";
}
