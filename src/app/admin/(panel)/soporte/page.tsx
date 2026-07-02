import Link from "next/link";
import { getAllTickets } from "@/lib/admin-data";
import { TicketBadge, PriorityTag } from "@/components/admin/TicketBadge";
import type { TicketStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string; match?: TicketStatus[] }[] = [
  { key: "todos", label: "Todos" },
  { key: "abiertos", label: "Por responder", match: ["open", "pending"] },
  { key: "respondidos", label: "Respondidos", match: ["answered"] },
  { key: "cerrados", label: "Cerrados", match: ["closed"] },
];

function when(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SoportePage({
  searchParams,
}: {
  searchParams: { estado?: string };
}) {
  let tickets = [] as Awaited<ReturnType<typeof getAllTickets>>;
  let ready = true;
  try {
    tickets = await getAllTickets();
  } catch {
    ready = false;
  }

  const active = searchParams.estado || "todos";
  const filter = FILTERS.find((f) => f.key === active) ?? FILTERS[0];
  const shown = filter.match
    ? tickets.filter((t) => filter.match!.includes(t.status))
    : tickets;

  const pending = tickets.filter(
    (t) => t.status === "open" || t.status === "pending",
  ).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Soporte</h1>
          <p className="mt-1 text-muted">
            {pending > 0
              ? `${pending} ticket${pending === 1 ? "" : "s"} por responder.`
              : "Todo respondido. ✦"}
          </p>
        </div>
      </div>

      {!ready && (
        <div className="mt-6 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Ejecuta la migración <b>003_soporte.sql</b> en Supabase para activar el
          sistema de tickets.
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/soporte?estado=${f.key}`}
            className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition ${
              active === f.key
                ? "bg-gold/15 text-ink"
                : "text-muted hover:bg-gold/10 hover:text-ink"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-muted">
          {ready ? "No hay tickets en esta vista." : "—"}
        </div>
      ) : (
        <div className="card mt-6 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gold/20 text-left text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3">Asunto</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="hidden px-4 py-3 sm:table-cell">Actualizado</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {shown.map((t) => (
                <tr key={t.id} className="transition hover:bg-gold/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/soporte/${t.id}`}
                      className="font-medium hover:text-gold-3"
                    >
                      {t.subject}
                    </Link>
                    <div className="flex items-center gap-2 font-mono text-xs text-muted">
                      {t.ref}
                      <PriorityTag priority={t.priority} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{t.name}</div>
                    <div className="text-xs text-muted">{t.email}</div>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-soft sm:table-cell">
                    {when(t.last_message_at)}
                  </td>
                  <td className="px-4 py-3">
                    <TicketBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
