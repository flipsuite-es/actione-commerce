import Link from "next/link";
import Newsletter from "./Newsletter";
import { IconInstagram, IconTiktok, IconTruck, IconGift, IconSparkle } from "./icons";
import type { Page, Settings } from "@/lib/types";

export default function SiteFooter({
  settings,
  pages = [],
}: {
  settings: Settings;
  pages?: Page[];
}) {
  const help = pages.length
    ? pages.map((p) => [p.title, `/pagina/${p.slug}`] as [string, string])
    : ([
        ["Envíos y entregas", "/#historia"],
        ["Devoluciones", "/#historia"],
        ["Cuidado de tus joyas", "/#historia"],
      ] as [string, string][]);

  return (
    <footer className="mt-28 border-t border-gold/20 bg-white/40">
      <div className="border-b border-gold/15">
        <div className="container-lux py-16">
          <Newsletter />
        </div>
      </div>

      <div className="container-lux grid gap-6 border-b border-gold/10 py-10 sm:grid-cols-3">
        {[
          { icon: IconSparkle, t: "Diseño atemporal", s: "Piezas pensadas para quedarse" },
          { icon: IconGift, t: "Para regalar", s: "Con un packaging cuidado" },
          { icon: IconTruck, t: "Envío desde España", s: "Preparado con mimo, con seguimiento" },
        ].map(({ icon: Icon, t, s }) => (
          <div key={t} className="flex items-center gap-4">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/30 text-gold-3">
              <Icon />
            </span>
            <div>
              <p className="text-sm font-medium">{t}</p>
              <p className="text-xs text-muted">{s}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="container-lux grid gap-10 py-14 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <p className="font-serif text-2xl">{settings.shop_name}</p>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Estudio de joyería dorada. Piezas atemporales, para llevar cada día.
          </p>
          <div className="mt-4 flex gap-3 text-gold-3">
            {settings.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noopener" aria-label="Instagram" className="transition hover:text-gold">
                <IconInstagram />
              </a>
            )}
            {settings.tiktok_url && (
              <a href={settings.tiktok_url} target="_blank" rel="noopener" aria-label="TikTok" className="transition hover:text-gold">
                <IconTiktok />
              </a>
            )}
          </div>
        </div>
        <FooterCol title="Tienda" links={[["Todas las joyas", "/tienda"], ["Anillos", "/tienda?cat=anillos"], ["Pendientes", "/tienda?cat=pendientes"], ["Favoritos", "/favoritos"]]} />
        <FooterCol title="Ayuda" links={help} />
        <FooterCol
          title="Contacto"
          links={[
            ["Soporte y contacto", "/soporte"],
            ["Seguir mi pedido", "/pedido"],
            ...(settings.contact_email ? [["Escríbenos", `mailto:${settings.contact_email}`] as [string, string]] : []),
            ["Nuestra historia", "/#historia"],
            ["Regalar", "/#regalo"],
          ]}
        />
      </div>

      <div className="border-t border-gold/10 py-6">
        <div className="container-lux flex flex-col items-center justify-between gap-2 text-[11px] uppercase tracking-[0.14em] text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} {settings.shop_name} · Hecho en España</span>
          <span>Pago seguro · Visa · Mastercard · PayPal · Bizum</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="text-sm">
      <p className="label">{title}</p>
      <ul className="space-y-2 text-ink-soft">
        {links.map(([label, href]) => (
          <li key={label + href}>
            {href.startsWith("http") || href.startsWith("mailto") ? (
              <a href={href} className="transition hover:text-gold-3">{label}</a>
            ) : (
              <Link href={href} className="transition hover:text-gold-3">{label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
