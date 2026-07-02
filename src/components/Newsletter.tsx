"use client";

import { useState } from "react";

export default function Newsletter({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

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
          onSubmit={(e) => {
            e.preventDefault();
            if (email) setDone(true);
          }}
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
          <button className="btn-gold shrink-0">Avísame</button>
        </form>
      )}
    </div>
  );
}
