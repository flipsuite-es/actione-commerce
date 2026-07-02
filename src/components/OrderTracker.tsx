"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast";
import { fetchOrderStatus } from "@/app/(store)/actions";
import { euro } from "@/lib/format";
import type { OrderStatusResult, OrderStatus } from "@/lib/types";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Recibido" },
  { key: "paid", label: "Pagado" },
  { key: "shipped", label: "Enviado" },
];

function stepIndex(status: OrderStatus) {
  const i = STEPS.findIndex((s) => s.key === status);
  return i < 0 ? 0 : i;
}

export default function OrderTracker() {
  const { toast } = useToast();
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<OrderStatusResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  async function load(e: React.FormEvent) {
    e.preventDefault();
    if (!ref.trim() || !email.trim()) {
      toast("Indica referencia y correo.");
      return;
    }
    setBusy(true);
    const res = await fetchOrderStatus(ref, email);
    setBusy(false);
    setSearched(true);
    if (!res.ok || !res.order) {
      setOrder(null);
      toast(res.error || "No encontrado.");
      return;
    }
    setOrder(res.order);
  }

  const cancelled = order?.status === "cancelled";
  const current = order ? stepIndex(order.status) : 0;

  return (
    <div className="grid gap-6">
      <form
        onSubmit={load}
        className="card grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div>
          <label className="label">Referencia del pedido</label>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="input uppercase"
            placeholder="Ej. 3F9A2C1B"
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

      {searched && !order && (
        <p className="text-center text-sm text-muted">
          No encontramos ningún pedido con esa referencia y correo. Revisa que
          coincidan con los del email de confirmación.
        </p>
      )}

      {order && (
        <div className="card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/15 pb-4">
            <div>
              <p className="font-mono text-sm tracking-widest">{order.ref}</p>
              <p className="mt-1 text-xs text-muted">
                {new Date(order.created_at).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <span className="font-serif text-xl">{euro(order.total)}</span>
          </div>

          {cancelled ? (
            <p className="mt-6 rounded bg-ink/5 px-4 py-3 text-center text-sm text-ink-soft">
              Este pedido está cancelado. Si crees que es un error, escríbenos por
              soporte.
            </p>
          ) : (
            <div className="mt-8 flex items-center">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-full border text-sm ${
                        i <= current
                          ? "border-gold bg-gold-grad text-[#3a2d10]"
                          : "border-gold/30 text-muted"
                      }`}
                    >
                      {i < current ? "✓" : i + 1}
                    </span>
                    <span
                      className={`mt-2 text-[11px] uppercase tracking-wider ${
                        i <= current ? "text-ink" : "text-muted"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span
                      className={`mx-2 h-px flex-1 ${i < current ? "bg-gold" : "bg-gold/20"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {order.tracking && (
            <p className="mt-6 text-center text-sm">
              <span className="text-muted">Nº de seguimiento: </span>
              <span className="font-medium">{order.tracking}</span>
            </p>
          )}

          {order.items?.length > 0 && (
            <ul className="mt-6 divide-y divide-gold/10 border-t border-gold/15 text-sm">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between py-2">
                  <span>{it.name || "Artículo"}</span>
                  <span className="text-muted">× {it.qty ?? 1}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
