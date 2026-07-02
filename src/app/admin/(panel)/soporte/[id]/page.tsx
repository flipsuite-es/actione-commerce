import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicketWithMessages } from "@/lib/admin-data";
import { replyTicket, updateTicketMeta, deleteTicket } from "@/app/admin/actions";
import { TicketBadge } from "@/components/admin/TicketBadge";

export const dynamic = "force-dynamic";

function when(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getTicketWithMessages(params.id);
  if (!data) notFound();
  const { ticket, messages } = data;

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/soporte"
        className="text-xs uppercase tracking-[0.16em] text-muted hover:text-gold-3"
      >
        ← Soporte
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">{ticket.subject}</h1>
        <TicketBadge status={ticket.status} />
      </div>
      <p className="mt-1 font-mono text-xs tracking-widest text-muted">
        {ticket.ref}
        {ticket.order_ref ? ` · pedido ${ticket.order_ref}` : ""}
      </p>

      {/* Cliente */}
      <div className="card mt-6 p-5 text-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <span>
            <span className="text-muted">Cliente: </span>
            {ticket.name}
          </span>
          <a
            href={`mailto:${ticket.email}?subject=Re: ${ticket.subject} (${ticket.ref})`}
            className="text-gold-3 hover:text-gold"
          >
            {ticket.email}
          </a>
        </div>
        <p className="mt-1 text-xs text-muted">
          Abierto el {when(ticket.created_at)} · última actividad{" "}
          {when(ticket.last_message_at)}
        </p>
      </div>

      {/* Hilo */}
      <div className="card mt-6 space-y-4 p-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] ${m.author === "admin" ? "ml-auto text-right" : ""}`}
          >
            <div
              className={`inline-block whitespace-pre-wrap px-4 py-3 text-sm ${
                m.author === "admin"
                  ? "border border-gold/30 bg-gold/10"
                  : "border border-gold/15 bg-white/70"
              }`}
            >
              {m.body}
            </div>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-muted">
              {m.author === "admin" ? "Tú (Oucy)" : ticket.name} · {when(m.created_at)}
            </p>
          </div>
        ))}
      </div>

      {/* Responder */}
      <form action={replyTicket} className="card mt-6 p-6">
        <input type="hidden" name="id" defaultValue={ticket.id} />
        <label className="label">Responder al cliente</label>
        <textarea
          name="body"
          rows={4}
          className="input"
          placeholder="Escribe tu respuesta…"
          required
        />
        <button className="btn-gold mt-3">Enviar respuesta</button>
      </form>

      {/* Gestión */}
      <form action={updateTicketMeta} className="card mt-6 grid gap-4 p-6 sm:grid-cols-2 sm:items-end">
        <input type="hidden" name="id" defaultValue={ticket.id} />
        <div>
          <label className="label">Estado</label>
          <select name="status" className="input" defaultValue={ticket.status}>
            <option value="open">Abierto</option>
            <option value="pending">Pendiente</option>
            <option value="answered">Respondido</option>
            <option value="closed">Cerrado</option>
          </select>
        </div>
        <div>
          <label className="label">Prioridad</label>
          <select name="priority" className="input" defaultValue={ticket.priority}>
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <button className="btn-outline sm:col-span-2 sm:justify-self-start">
          Guardar estado
        </button>
      </form>

      <form action={deleteTicket.bind(null, ticket.id)} className="mt-6">
        <button className="text-xs uppercase tracking-[0.16em] text-muted hover:text-red-600">
          Eliminar ticket
        </button>
      </form>
    </div>
  );
}
