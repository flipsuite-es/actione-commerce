"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast";
import { submitReview } from "@/app/(store)/actions";

const STAR =
  "M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.51L10 14.98l-4.94 2.84.94-5.51-4-3.9 5.53-.8z";

export default function ReviewForm({ productId }: { productId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (rating < 1) {
      toast("Elige tu valoración en estrellas.");
      return;
    }
    setBusy(true);
    const res = await submitReview({
      productId,
      name: String(fd.get("name") || ""),
      rating,
      body: String(fd.get("body") || ""),
    });
    setBusy(false);
    if (!res.ok) {
      toast(res.error || "No se pudo enviar.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="mt-4 border border-gold/20 bg-white/60 px-5 py-4 text-sm text-ink-soft">
        ¡Gracias por tu opinión! ✦ La revisaremos y la publicaremos en breve.
      </p>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-outline mt-4">
        Escribir una reseña
      </button>
    );
  }

  const shown = hover || rating;

  return (
    <form onSubmit={onSubmit} className="card mt-4 grid gap-4 p-5 sm:p-6">
      <div>
        <label className="label">Tu valoración</label>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
              className="p-0.5"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 20 20"
                fill={n <= shown ? "#C9A24B" : "rgba(169,129,47,0.22)"}
                className="transition"
              >
                <path d={STAR} />
              </svg>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Nombre</label>
        <input name="name" className="input" required />
      </div>
      <div>
        <label className="label">Tu opinión (opcional)</label>
        <textarea name="body" rows={3} className="input" placeholder="¿Qué te ha parecido?" />
      </div>
      <div className="flex gap-3">
        <button className="btn-gold" disabled={busy}>
          {busy ? "Enviando…" : "Enviar reseña"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}
