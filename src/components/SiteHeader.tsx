"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { IconBag, IconHeart, IconSearch, IconMenu, IconClose } from "./icons";

const NAV = [
  { href: "/tienda", label: "Tienda" },
  { href: "/tienda?cat=anillos", label: "Anillos" },
  { href: "/tienda?cat=pendientes", label: "Pendientes" },
  { href: "/#regalo", label: "Regalo" },
  { href: "/#historia", label: "Nosotras" },
];

export default function SiteHeader() {
  const { count, setOpen } = useCart();
  const wish = useWishlist();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(false);
    router.push(`/tienda?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-gold/20 bg-ivory/85 shadow-soft backdrop-blur"
          : "bg-ivory/40 backdrop-blur-sm"
      }`}
    >
      <div className="container-lux flex items-center justify-between py-4">
        <div className="flex flex-1 items-center gap-6">
          <button className="md:hidden" onClick={() => setMenu(true)} aria-label="Menú">
            <IconMenu />
          </button>
          <nav className="hidden gap-6 text-xs uppercase tracking-[0.16em] text-ink-soft md:flex">
            {NAV.slice(0, 3).map((n) => (
              <Link key={n.label} href={n.href} className="link-underline hover:text-gold-3">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link href="/" aria-label="Oucy Studios" className="shrink-0">
          <Image
            src="/logo.png"
            alt="Oucy Studios"
            width={132}
            height={Math.round((132 * 960) / 3665)}
            priority
          />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-4 text-ink-soft sm:gap-5">
          <button onClick={() => setSearch(true)} aria-label="Buscar" className="hover:text-gold-3">
            <IconSearch />
          </button>
          <Link href="/favoritos" aria-label="Favoritos" className="relative hover:text-gold-3">
            <IconHeart />
            {wish.count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-grad px-1 text-[9px] font-semibold text-[#3a2d10]">
                {wish.count}
              </span>
            )}
          </Link>
          <button onClick={() => setOpen(true)} aria-label="Cesta" className="relative hover:text-gold-3">
            <IconBag />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-grad px-1 text-[9px] font-semibold text-[#3a2d10]">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {search && (
        <div className="animate-fade-in fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm" onClick={() => setSearch(false)}>
          <div className="bg-ivory px-5 py-6" onClick={(e) => e.stopPropagation()}>
            <div className="container-lux">
              <form onSubmit={submitSearch} className="flex items-center gap-3">
                <IconSearch className="text-gold-3" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Busca anillos, perlas, colgantes…"
                  className="flex-1 bg-transparent py-2 text-lg outline-none placeholder:text-muted"
                />
                <button type="button" onClick={() => setSearch(false)} aria-label="Cerrar">
                  <IconClose />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {menu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setMenu(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-ivory p-6 shadow-lift">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-serif text-2xl">Oucy</span>
              <button onClick={() => setMenu(false)} aria-label="Cerrar">
                <IconClose />
              </button>
            </div>
            <nav className="flex flex-col gap-4 text-sm uppercase tracking-[0.16em] text-ink-soft">
              {NAV.map((n) => (
                <Link key={n.label} href={n.href} onClick={() => setMenu(false)} className="hover:text-gold-3">
                  {n.label}
                </Link>
              ))}
              <Link href="/favoritos" onClick={() => setMenu(false)} className="hover:text-gold-3">
                Favoritos
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
