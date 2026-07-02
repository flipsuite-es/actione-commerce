"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Cliente de Supabase para componentes de navegador (login admin). */
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
