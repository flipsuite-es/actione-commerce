"use client";

import Link from "next/link";
import Logo from "./Logo";
import { useCart } from "@/lib/cart";

export default function SiteHeader({ announcement }: { announcement?: string }) {
  const { count, setOpen } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-gold/20 bg-ivory/80 backdrop-blur">
      {announcement ? (
        <div className="bg-gold-grad text-center text-[11px] uppercase tracking-[0.18em] text-[#3a2d10] py-1.5 px-4">
          {announcement}
        </div>
      ) : null}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <nav className="hidden w-40 gap-6 text-xs uppercase tracking-[0.16em] text-ink-soft md:flex">
          <Link href="/tienda" className="hover:text-gold-3">
            Tienda
          </Link>
          <Link href="/#historia" className="hover:text-gold-3">
            Nosotras
          </Link>
        </nav>
        <Logo width={132} />
        <div className="flex w-40 items-center justify-end gap-4">
          <Link
            href="/tienda"
            className="text-xs uppercase tracking-[0.16em] text-ink-soft hover:text-gold-3 md:hidden"
          >
            Tienda
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="relative text-xs uppercase tracking-[0.16em] text-ink-soft hover:text-gold-3"
            aria-label="Abrir carrito"
          >
            Cesta
            {count > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-grad px-1 text-[10px] font-semibold text-[#3a2d10]">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
