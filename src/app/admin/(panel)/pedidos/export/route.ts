import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAllOrders } from "@/lib/admin-data";

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

  const orders = await getAllOrders();

  const headers = [
    "Fecha",
    "Referencia",
    "Nombre",
    "Email",
    "Teléfono",
    "Estado",
    "Artículos",
    "Subtotal",
    "Envío",
    "Descuento",
    "Cupón",
    "Total",
    "Seguimiento",
    "Nota",
  ];

  const rows = orders.map((o) =>
    [
      new Date(o.created_at).toLocaleString("es-ES"),
      o.id.slice(0, 8),
      o.name,
      o.email,
      o.phone,
      o.status,
      (o.items || []).reduce((n, i) => n + (i.qty || 0), 0),
      o.subtotal,
      o.shipping,
      o.discount ?? 0,
      o.coupon_code ?? "",
      o.total,
      o.tracking ?? "",
      o.note ?? "",
    ]
      .map(cell)
      .join(";"),
  );

  // BOM para que Excel lo abra con acentos correctos.
  const csv = "﻿" + [headers.join(";"), ...rows].join("\r\n");
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-oucy-${today}.csv"`,
    },
  });
}
