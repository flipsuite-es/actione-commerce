"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast";
import {
  openTicket,
  fetchTicketThread,
  replyToTicket,
} from "@/app/(store)/soporte/actions";
import type { TicketStatus, TicketThread } from "@/lib/types";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Abierto",
  pending: "Esperando respuesta",
  answered: "Respondido",
  closed: "Cerrado",
};
const STATUS_CLS: Record<TicketStatus, string> = {
  open: "bg-amber-100 text-amber-700",
  pending: "bg-sky-100 text-sky-700",
  answered: "bg-emerald-100 text-emerald-700",
  closed: "bg-ink/10 text-ink-soft",
};

function when(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SupportCenter({ contactEmail }: { contactEmail?: string }) {
  const [tab, setTab] = useState<"open" | "track">("open");

  return (
    <div>
      <div className="mb-8 flex gap-2">
        <TabButton active={tab === "open"} onClick={() => setTab("open")}>
          Abrir un ticket
        </TabButton>
        <TabButton active={tab === "track"} onClick={() => setTab("track")}>
          Consultar mi ticket
        </TabButton>
      </div>

      {tab === "open" ? (
        <OpenTicket onTracked={() => setTab("track")} />
      ) : (
        <TrackTicket />
      )}

      {contactEmail && (
        <p className="mt-8 text-center text-sm text-muted">
          ¿Prefieres el correo? Escríbenos a{" "}
          <a href={`mailto:${contactEmail}`} className="text-gold-3 hover:text-gold">
            {contactEmail}
          </a>
        </p>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-xs uppercase tracking-[0.16em] transition ${
        active
          ? "border-b-2 border-gold text-ink"
          : "border-b-2 border-transparent text-muted hover:text-gold-3"
      }`}
    >
      {children}
    </button>
  );
}

function OpenTicket({ onTracked }: { onTracked: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    const res = await openTicket({
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      subject: String(fd.get("subject") || ""),
      orderRef: String(fd.get("order_ref") || ""),
      body: String(fd.get("body") || ""),
    });
    setBusy(false);
    if (!res.ok) {
      toast(res.error || "No se pudo enviar.");
      return;
    }
    setRef(res.ref!);
    form.reset();
  }

  if (ref) {
    return (
      <div className="card p-8 text-center">
        <p className="gold-text font-serif text-2xl">¡Ticket creado!</p>
        <p className="mt-3 text-ink-soft">
          Hemos registrado tu consulta. Guarda tu referencia:
        </p>
        <p className="mt-4 inline-block border border-gold/40 bg-white/70 px-5 py-3 font-mono text-lg tracking-widest">
          {ref}
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted">
          Con esa referencia y tu correo podrás seguir la conversación en la
          pestaña «Consultar mi ticket». Te avisaremos por correo cuando
          respondamos.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={onTracked} className="btn-gold">
            Ver mi ticket
          </button>
          <button onClick={() => setRef(null)} className="btn-outline">
            Abrir otro
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nombre</label>
          <input name="name" className="input" required />
        </div>
        <div>
          <label className="label">Correo</label>
          <input name="email" type="email" className="input" required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Asunto</label>
          <input name="subject" className="input" required />
        </div>
        <div>
          <label className="label">Nº de pedido (opcional)</label>
          <input name="order_ref" className="input" placeholder="Si es sobre un pedido" />
        </div>
      </div>
      <div>
        <label className="label">¿En qué te ayudamos?</label>
        <textarea name="body" rows={5} className="input" required />
      </div>
      <button className="btn-gold justify-self-start" disabled={busy}>
        {busy ? "Enviando…" : "Enviar consulta"}
      </button>
    </form>
  );
}

function TrackTicket() {
  const { toast } = useToast();
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [thread, setThread] = useState<TicketThread | null>(null);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");

  async function load(e?: React.FormEvent) {
    e?.preventDefault();
    if (!ref.trim() || !email.trim()) {
      toast("Indica referencia y correo.");
      return;
    }
    setBusy(true);
    const res = await fetchTicketThread(ref, email);
    setBusy(false);
    if (!res.ok || !res.thread) {
      toast(res.error || "No encontrado.");
      setThread(null);
      return;
    }
    setThread(res.thread);
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    const res = await replyToTicket(ref, email, reply);
    setBusy(false);
    if (!res.ok) {
      toast(res.error || "No se pudo enviar.");
      return;
    }
    setReply("");
    toast("Respuesta enviada ✦");
    load();
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={load} className="card grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label">Referencia</label>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="input"
            placeholder="OUCY-XXXXXX"
          />
        </div>
        <div>
          <label className="label">Correo</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="input"
          />
        </div>
        <button className="btn-outline" disabled={busy}>
          {busy ? "Buscando…" : "Consultar"}
        </button>
      </form>

      {thread && (
        <div className="card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/15 pb-4">
            <div>
              <p className="font-serif text-xl">{thread.subject}</p>
              <p className="mt-1 font-mono text-xs tracking-widest text-muted">
                {thread.ref}
                {thread.order_ref ? ` · pedido ${thread.order_ref}` : ""}
              </p>
            </div>
            <span
              className={`rounded px-2 py-0.5 text-[11px] uppercase tracking-wider ${STATUS_CLS[thread.status]}`}
            >
              {STATUS_LABEL[thread.status]}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {thread.messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] ${m.author === "admin" ? "ml-auto text-right" : ""}`}
              >
                <div
                  className={`inline-block whitespace-pre-wrap px-4 py-3 text-sm ${
                    m.author === "admin"
                      ? "border border-gold/30 bg-gold/10 text-ink"
                      : "border border-gold/15 bg-white/70 text-ink"
                  }`}
                >
                  {m.body}
                </div>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-muted">
                  {m.author === "admin" ? "Oucy Studios" : "Tú"} · {when(m.created_at)}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={sendReply} className="mt-6 border-t border-gold/15 pt-5">
            <label className="label">Responder</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              className="input"
              placeholder="Escribe tu mensaje…"
            />
            <button className="btn-gold mt-3" disabled={busy || !reply.trim()}>
              {busy ? "Enviando…" : "Enviar respuesta"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
