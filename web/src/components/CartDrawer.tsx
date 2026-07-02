"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { euro } from "@/lib/format";

export default function CartDrawer({
  freeShipThreshold,
  shippingFlat,
}: {
  freeShipThreshold: number;
  shippingFlat: number;
}) {
  const { items, open, setOpen, remove, setQty, subtotal } = useCart();
  const freeShip = subtotal >= freeShipThreshold && subtotal > 0;
  const remaining = Math.max(0, freeShipThreshold - subtotal);

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm transition ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gold/30 bg-ivory shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gold/20 px-6 py-5">
          <h2 className="font-serif text-2xl">Tu cesta</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-sm uppercase tracking-[0.16em] text-ink-soft hover:text-gold-3"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <p className="mt-10 text-center text-muted">Tu cesta está vacía.</p>
          ) : (
            <ul className="space-y-5">
              {items.map((i) => (
                <li key={i.id} className="flex gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden border border-gold/15 bg-white/60">
                    {i.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={i.image}
                        alt={i.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-serif italic text-muted">
                        Oucy
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-serif text-lg leading-tight">{i.name}</p>
                    <p className="text-sm text-ink-soft">{euro(i.price)}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center border border-gold/30">
                        <button
                          onClick={() => setQty(i.id, i.qty - 1)}
                          className="px-2 py-1 text-ink-soft hover:text-gold-3"
                        >
                          −
                        </button>
                        <span className="px-2 text-sm">{i.qty}</span>
                        <button
                          onClick={() => setQty(i.id, i.qty + 1)}
                          className="px-2 py-1 text-ink-soft hover:text-gold-3"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => remove(i.id)}
                        className="text-xs uppercase tracking-wider text-muted hover:text-gold-3"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gold/20 px-6 py-5">
            <p className="mb-3 text-center text-xs text-muted">
              {freeShip
                ? "¡Envío gratis conseguido! ✦"
                : `Te faltan ${euro(remaining)} para el envío gratis`}
            </p>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm uppercase tracking-[0.16em] text-ink-soft">
                Subtotal
              </span>
              <span className="font-serif text-xl">{euro(subtotal)}</span>
            </div>
            <Link href="/carrito" className="btn-gold w-full" onClick={() => setOpen(false)}>
              Finalizar compra
            </Link>
            <p className="mt-3 text-center text-[11px] text-muted">
              Envío {euro(shippingFlat)} · gratis desde {euro(freeShipThreshold)}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
