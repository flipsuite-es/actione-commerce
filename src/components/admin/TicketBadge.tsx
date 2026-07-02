import type { TicketPriority, TicketStatus } from "@/lib/types";

const STATUS: Record<TicketStatus, { label: string; cls: string }> = {
  open: { label: "Abierto", cls: "bg-amber-100 text-amber-700" },
  pending: { label: "Pendiente", cls: "bg-sky-100 text-sky-700" },
  answered: { label: "Respondido", cls: "bg-emerald-100 text-emerald-700" },
  closed: { label: "Cerrado", cls: "bg-ink/10 text-ink-soft" },
};

const PRIORITY: Record<TicketPriority, { label: string; cls: string }> = {
  low: { label: "Baja", cls: "text-muted" },
  normal: { label: "Normal", cls: "text-ink-soft" },
  high: { label: "Alta", cls: "text-red-600" },
};

export function TicketBadge({ status }: { status: TicketStatus }) {
  const s = STATUS[status] ?? STATUS.open;
  return (
    <span className={`rounded px-2 py-0.5 text-[11px] uppercase tracking-wider ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function PriorityTag({ priority }: { priority: TicketPriority }) {
  const p = PRIORITY[priority] ?? PRIORITY.normal;
  if (priority === "normal") return null;
  return (
    <span className={`text-[11px] uppercase tracking-wider ${p.cls}`}>
      {priority === "high" ? "● " : ""}
      {p.label}
    </span>
  );
}
