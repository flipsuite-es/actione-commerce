import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role: SOLO en servidor (Server Actions / route handlers).
 * Salta RLS para operaciones de administración. NUNCA se importa en el cliente.
 */
export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export const BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "product-images";
