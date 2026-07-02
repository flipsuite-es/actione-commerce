import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-gold/20 bg-white/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-3">
        <div>
          <p className="font-serif text-2xl">Oucy Studios</p>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Joyas doradas de acero, elegantes y atemporales. No se oxidan, aptas
            para piel sensible. Hecho en España.
          </p>
        </div>
        <div className="text-sm">
          <p className="label">Tienda</p>
          <ul className="space-y-2 text-ink-soft">
            <li>
              <Link href="/tienda" className="hover:text-gold-3">
                Todas las joyas
              </Link>
            </li>
            <li>
              <Link href="/carrito" className="hover:text-gold-3">
                Cesta
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="label">Síguenos</p>
          <ul className="space-y-2 text-ink-soft">
            <li>
              <a
                href="https://instagram.com/oucystudios"
                target="_blank"
                rel="noopener"
                className="hover:text-gold-3"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href="https://tiktok.com/@oucystudios"
                target="_blank"
                rel="noopener"
                className="hover:text-gold-3"
              >
                TikTok
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gold/10 py-5 text-center text-[11px] uppercase tracking-[0.14em] text-muted">
        © {new Date().getFullYear()} Oucy Studios · Hecho en España
      </div>
    </footer>
  );
}
