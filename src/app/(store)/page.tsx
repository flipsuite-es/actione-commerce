import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import Testimonials from "@/components/Testimonials";
import { getActiveProducts, getSettings } from "@/lib/data";
import { IconArrow, IconDrop, IconSparkle, IconGift } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, settings] = await Promise.all([
    getActiveProducts(),
    getSettings(),
  ]);
  const featured = products.filter((p) => p.featured);
  const grid = (featured.length ? featured : products).slice(0, 8);
  const heroImg = grid.find((p) => p.images?.[0])?.images?.[0] ?? null;

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container-lux grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <Reveal className="text-center md:text-left">
            <p className="kicker">Acero dorado · no se oxida</p>
            <h1 className="heading mt-6 text-5xl italic sm:text-6xl lg:text-7xl">
              {settings.tagline}
            </h1>
            <p className="mx-auto mt-6 max-w-md text-muted md:mx-0">
              {settings.hero_subtitle}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4 md:justify-start">
              <Link href="/tienda" className="btn-gold">
                Ver la colección
              </Link>
              <Link href="/#historia" className="btn-outline">
                Por qué Oucy
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted md:justify-start">
              <span>No se oxida</span>
              <span>Piel sensible</span>
              <span>Envíos 24–72 h</span>
            </div>
          </Reveal>

          <Reveal delay={120} className="relative hidden md:block">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden border border-gold/20 bg-ivory-2 shadow-soft">
              {heroImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImg} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="gold-text font-serif text-4xl italic">Oucy</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-5 -left-5 h-24 w-24 border border-gold/30" />
            <div className="absolute -right-4 -top-4 grid h-16 w-16 place-items-center rounded-full bg-gold-grad text-[#3a2d10]">
              <IconSparkle />
            </div>
          </Reveal>
        </div>
      </section>

      {/* NOVEDADES */}
      {grid.length > 0 && (
        <section className="container-lux py-10">
          <Reveal className="mb-10 text-center">
            <div className="hairline mx-auto" />
            <h2 className="heading mt-4 text-4xl">Novedades</h2>
            <p className="mt-2 text-muted">Seleccionadas a mano · lotes limitados</p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
              {grid.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </Reveal>
          <div className="mt-12 text-center">
            <Link href="/tienda" className="btn-outline">
              Ver todo <IconArrow width={16} height={16} className="ml-2" />
            </Link>
          </div>
        </section>
      )}

      {/* CALIDAD */}
      <section className="container-lux py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { icon: IconDrop, t: "No se oxida", s: "Acero inoxidable dorado que resiste agua, sudor, gym y ducha. No se pone negro." },
            { icon: IconSparkle, t: "Apto para piel sensible", s: "Sin níquel liberado. La joya que sí puedes llevar cada día sin que te irrite." },
            { icon: IconGift, t: "Lista para regalar", s: "Packaging cuidado y piezas atemporales. El detalle que parece de joyería." },
          ].map(({ icon: Icon, t, s }, i) => (
            <Reveal key={t} delay={i * 90} className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold/30 text-gold-3">
                <Icon />
              </span>
              <h3 className="heading mt-5 text-2xl">{t}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-ink-soft">{s}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* REGALO */}
      <section id="regalo" className="border-y border-gold/15 bg-white/40">
        <div className="container-lux grid items-center gap-10 py-20 md:grid-cols-2">
          <Reveal>
            <p className="kicker">El regalo perfecto</p>
            <h2 className="heading mt-4 text-4xl sm:text-5xl">
              Que parezca de joyería, <span className="gold-text italic">sin el precio</span>.
            </h2>
            <p className="mt-4 max-w-md text-ink-soft">
              Piezas elegantes de perla y oro, con packaging bonito, listas para
              sorprender. Para un cumpleaños, un aniversario o un “porque sí”.
            </p>
            <Link href="/tienda" className="btn-gold mt-8">
              Encontrar un regalo
            </Link>
          </Reveal>
          <Reveal delay={120} className="grid grid-cols-2 gap-4">
            {grid.slice(0, 2).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Reveal>
        </div>
      </section>

      {/* HISTORIA */}
      <section id="historia" className="container-lux py-24 text-center">
        <Reveal>
          <div className="hairline mx-auto" />
          <h2 className="heading mt-4 text-4xl">Por qué Oucy</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {settings.story_text}
          </p>
        </Reveal>
      </section>

      {/* TESTIMONIOS */}
      <section className="container-lux pb-24">
        <Reveal className="mb-10 text-center">
          <p className="kicker">Lo que dicen</p>
          <h2 className="heading mt-3 text-4xl">Clientas Oucy</h2>
        </Reveal>
        <Reveal>
          <Testimonials />
        </Reveal>
      </section>
    </div>
  );
}
