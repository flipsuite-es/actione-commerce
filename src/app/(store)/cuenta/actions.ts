"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  await supabase.rpc("update_my_profile", {
    p_full_name: String(formData.get("full_name") || "").trim(),
    p_phone: String(formData.get("phone") || "").trim(),
  });
  revalidatePath("/cuenta");
}

export async function signOutCustomer() {
  const supabase = createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}
