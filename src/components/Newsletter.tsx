"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast";
import { subscribe } from "@/app/(store)/actions";

export default function Newsletter({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    const res = await subscribe(email, "newsletter");
    setBusy(false);
    if (!res.ok) {
      toast(res.error || "No se pudo suscribir.");
      return;
    }
    setDone(true);
  }

  return (
    <div className={compact ? "" : "text-center"}>
      {!compact && (
        <>
          <p className="kicker">Comunidad Oucy</p>
          <h2 className="heading mt-3 text-3xl sm:text-4xl">
            Acceso anticipado a cada drop
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Novedades, chollos y las piezas que no vuelven. Sin spam.
          </p>
        </>
      )}
      {done ? (
        <p className="mt-6 font-serif text-xl italic text-gold-3">
          Gracias ✦ te avisaremos la primera.
        </p>
      ) : (
        <form
          onSubmit={onSubmit}
          className={`mx-auto mt-6 flex max-w-md gap-2 ${compact ? "mt-3" : ""}`}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tu correo"
            className="input flex-1"
          />
          <button className="btn-gold shrink-0" disabled={busy}>
            {busy ? "…" : "Avísame"}
          </button>
        </form>
      )}
    </div>
  );
}
