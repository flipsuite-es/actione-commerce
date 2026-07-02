import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getActiveProducts, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, settings] = await Promise.all([
    getActiveProducts(),
    getSettings(),
  ]);
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const grid = (featured.length ? featured : products).slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <section className="py-20 text-center sm:py-28">
        <p className="text-[11px] uppercase tracking-[0.4em] text-gold-3">
          Acero dorado · no se oxida
        </p>
        <h1 className="mx-auto mt-6 max-w-2xl font-serif text-4xl italic leading-tight sm:text-6xl">
          {settings.tagline}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-muted">
          Joyas elegantes y atemporales que parecen de joyería. Para llevar cada
          día y para regalar.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/tienda" className="btn-gold">
            Ver la colección
          </Link>
        </div>
        <div className="mx-auto mt-10 flex max-w-md flex-wrap justify-center gap-x-8 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted">
          <span>No se oxida</span>
          <span>Piel sensible</span>
          <span>Envíos desde España</span>
        </div>
      </section>

      {/* Destacados */}
      {grid.length > 0 && (
        <section className="py-6">
          <div className="mb-8 text-center">
            <div className="hairline mx-auto" />
            <h2 className="mt-4 font-serif text-3xl">Novedades</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {grid.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/tienda" className="btn-outline">
              Ver todo
            </Link>
          </div>
        </section>
      )}

      {/* Historia */}
      <section id="historia" className="py-20 text-center">
        <div className="hairline mx-auto" />
        <h2 className="mt-4 font-serif text-3xl">Por qué Oucy</h2>
        <p className="mx-auto mt-5 max-w-xl leading-relaxed text-ink-soft">
          Creemos que llevar algo bonito y elegante no debería costar una fortuna
          ni estropearse en un mes. Seleccionamos a mano joyas de acero
          inoxidable dorado —de las que no se oxidan ni manchan la piel— pensadas
          para durar y acompañarte cada día.
        </p>
      </section>
    </div>
  );
}
