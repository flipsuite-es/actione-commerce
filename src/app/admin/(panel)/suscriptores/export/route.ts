import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getSubscribers } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const subs = await getSubscribers();
  const headers = ["Email", "Origen", "Fecha"];
  const rows = subs.map((s) =>
    [s.email, s.source, new Date(s.created_at).toLocaleString("es-ES")]
      .map(cell)
      .join(";"),
  );
  const csv = "﻿" + [headers.join(";"), ...rows].join("\r\n");
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="suscriptores-oucy-${today}.csv"`,
    },
  });
}
