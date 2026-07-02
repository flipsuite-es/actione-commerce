import type { OrderStatus } from "@/lib/types";

const MAP: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Pagado", cls: "bg-emerald-100 text-emerald-700" },
  shipped: { label: "Enviado", cls: "bg-sky-100 text-sky-700" },
  cancelled: { label: "Cancelado", cls: "bg-ink/10 text-ink-soft" },
};

export function OrderBadge({ status }: { status: OrderStatus }) {
  const s = MAP[status] ?? MAP.pending;
  return (
    <span className={`rounded px-2 py-0.5 text-[11px] uppercase tracking-wider ${s.cls}`}>
      {s.label}
    </span>
  );
}
