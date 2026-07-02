"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { euro } from "@/lib/format";
import { createOrder, validateCoupon } from "@/app/(store)/carrito/actions";

export default function Checkout({
  freeShipThreshold,
  shippingFlat,
}: {
  freeShipThreshold: number;
  shippingFlat: number;
}) {
  const { items, subtotal, clear } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");

  const shipping = subtotal >= freeShipThreshold ? 0 : shippingFlat;
  const discount = applied?.discount ?? 0;
  const total = Math.max(0, subtotal + shipping - discount);

  async function applyCoupon() {
    setCouponMsg("");
    const res = await validateCoupon(coupon, subtotal);
    if (res.ok) {
      setApplied({ code: res.code!, discount: res.discount });
      setCouponMsg(res.message);
    } else {
      setApplied(null);
      setCouponMsg(res.message);
    }
  }

  if (status === "done") {
    return (
      <div className="container-lux mx-auto max-w-lg py-24 text-center">
        <div className="hairline mx-auto" />
        <h1 className="heading mt-5 text-4xl">¡Gracias! ✦</h1>
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
      <div className="container-lux py-24 text-center">
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
    const res = await createOrder({ items, ...form, couponCode: applied?.code });
    if (res.ok) {
      clear();
      setStatus("done");
    } else {
      setStatus("error");
      setError(res.error || "Algo salió mal.");
    }
  }

  return (
    <div className="container-lux grid gap-12 py-14 md:grid-cols-2">
      {/* Resumen */}
      <div>
        <h1 className="heading text-3xl">Tu cesta</h1>
        <ul className="mt-6 space-y-4">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden border border-gold/15 bg-ivory-2">
                {i.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.image} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="font-serif text-lg leading-tight">{i.name}</p>
                <p className="text-sm text-muted">× {i.qty}</p>
              </div>
              <span>{euro(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>

        {/* Cupón */}
        <div className="mt-6 flex gap-2">
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder="Código de descuento"
            className="input flex-1 !py-2.5"
          />
          <button type="button" onClick={applyCoupon} className="btn-outline !px-5 !py-2.5">
            Aplicar
          </button>
        </div>
        {couponMsg && (
          <p className={`mt-2 text-sm ${applied ? "text-emerald-700" : "text-red-600"}`}>
            {couponMsg}
          </p>
        )}

        <div className="mt-6 space-y-2 border-t border-gold/20 pt-4 text-sm">
          <Row k="Subtotal" v={euro(subtotal)} />
          <Row k="Envío" v={shipping === 0 ? "Gratis" : euro(shipping)} />
          {discount > 0 && <Row k={`Descuento (${applied?.code})`} v={`− ${euro(discount)}`} />}
          <div className="flex justify-between border-t border-gold/20 pt-2 font-serif text-xl">
            <span>Total</span>
            <span>{euro(total)}</span>
          </div>
        </div>
      </div>

      {/* Datos */}
      <form onSubmit={submit} className="card p-6">
        <h2 className="heading text-2xl">Tus datos</h2>
        <p className="mt-1 text-sm text-muted">
          Registramos tu pedido y te enviamos el enlace de pago por correo.
        </p>
        <div className="mt-5 space-y-4">
          <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label="Correo" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <Input label="Teléfono (opcional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <div>
            <label className="label">Nota (opcional)</label>
            <textarea className="input" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={status === "sending"} className="btn-gold mt-6 w-full">
          {status === "sending" ? "Enviando…" : `Confirmar pedido · ${euro(total)}`}
        </button>
      </form>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{k}</span>
      <span>{v}</span>
    </div>
  );
}
function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </div>
  );
}
