"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "oucy_cookie_ok";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* almacenamiento no disponible: no molestar */
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-5">
      <div className="container-lux flex flex-col items-center gap-4 border border-gold/25 bg-ivory/95 px-5 py-4 shadow-lift backdrop-blur sm:flex-row">
        <p className="flex-1 text-center text-sm text-ink-soft sm:text-left">
          Usamos cookies propias para el funcionamiento de la tienda y recordar tu
          cesta. Al continuar aceptas su uso.{" "}
          <Link href="/pagina/privacidad" className="text-gold-3 underline hover:text-gold">
            Más información
          </Link>
          .
        </p>
        <button onClick={accept} className="btn-gold shrink-0 !px-6 !py-3">
          Aceptar
        </button>
      </div>
    </div>
  );
}
