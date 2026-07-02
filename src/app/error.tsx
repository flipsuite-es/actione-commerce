"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Podría enviarse a un servicio de errores en el futuro.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <p className="kicker">Vaya…</p>
        <h1 className="heading mt-4 text-4xl italic sm:text-5xl">
          Algo no ha ido bien.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          Ha ocurrido un error inesperado. Puedes reintentar o volver al inicio; si
          persiste, escríbenos por soporte.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="btn-gold">
            Reintentar
          </button>
          <Link href="/" className="btn-outline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
