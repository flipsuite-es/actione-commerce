"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { euro } from "@/lib/format";
import { createOrder } from "@/app/(store)/carrito/actions";

export default function Checkout({
  freeShipThreshold,
  shippingFlat,
}: {
  freeShipThreshold: number;
  shippingFlat: number;
}) {
  const { items, subtotal, clear } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  const shipping = subtotal >= freeShipThreshold ? 0 : shippingFlat;
  const total = subtotal + shipping;

  if (status === "done") {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="hairline mx-auto" />
        <h1 className="mt-5 font-serif text-4xl">¡Gracias! ✦</h1>
        <p className="mt-4 text-ink-soft">
          Hemos recibido tu pedido. Te escribiremos al correo para confirmarlo y
          enviarte el enlace de pago.
        </p>
        <Link href="/tienda" className="btn-gold mt-8">
          Seguir viendo joyas
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">Tu cesta está vacía.</p>
        <Link href="/tienda" className="btn-outline mt-6">
          Ver la colección
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const res = await createOrder({ items, ...form });
    if (res.ok) {
      clear();
      setStatus("done");
    } else {
      setStatus("error");
      setError(res.error || "Algo salió mal.");
    }
  }

  return (
    <div className="grid gap-12 py-14 md:grid-cols-2">
      {/* Resumen */}
      <div>
        <h1 className="font-serif text-3xl">Tu cesta</h1>
        <ul className="mt-6 space-y-4">
          {items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-4">
              <span className="text-ink-soft">
                {i.name} <span className="text-muted">× {i.qty}</span>
              </span>
              <span>{euro(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-2 border-t border-gold/20 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span>{euro(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Envío</span>
            <span>{shipping === 0 ? "Gratis" : euro(shipping)}</span>
          </div>
          <div className="flex justify-between border-t border-gold/20 pt-2 font-serif text-xl">
            <span>Total</span>
            <span>{euro(total)}</span>
          </div>
        </div>
      </div>

      {/* Datos */}
      <form onSubmit={submit} className="card p-6">
        <h2 className="font-serif text-2xl">Tus datos</h2>
        <p className="mt-1 text-sm text-muted">
          Registramos tu pedido y te enviamos el enlace de pago por correo.
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Correo</label>
            <input
              type="email"
              className="input"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Teléfono (opcional)</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Nota (opcional)</label>
            <textarea
              className="input"
              rows={2}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={status === "sending"}
          className="btn-gold mt-6 w-full"
        >
          {status === "sending" ? "Enviando…" : "Confirmar pedido"}
        </button>
      </form>
    </div>
  );
}
