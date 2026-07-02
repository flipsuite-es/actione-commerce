import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getActiveProducts, getProductReviews } from "@/lib/data";
import { euro } from "@/lib/format";
import ProductGallery from "@/components/ProductGallery";
import BuyBox from "@/components/BuyBox";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import Stars from "@/components/Stars";
import ReviewForm from "@/components/ReviewForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Producto · Oucy Studios" };
  return {
    title: `${product.name} · Oucy Studios`,
    description:
      (product.description || "Una pieza de Oucy Studios, joyería atemporal.").slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.images?.[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const [all, reviews] = await Promise.all([
    getActiveProducts(),
    getProductReviews(product.id),
  ]);
  const related = all
    .filter((p) => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 4);
  const fallbackRelated = all.filter((p) => p.id !== product.id).slice(0, 4);
  const relatedList = related.length ? related : fallbackRelated;

  const reviewCount = reviews.length;
  const avgRating = reviewCount
    ? reviews.reduce((n, r) => n + r.rating, 0) / reviewCount
    : 0;

  const onSale =
    product.compare_at_price != null && product.compare_at_price > product.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description || "Una pieza de Oucy Studios, joyería atemporal.",
    image: product.images?.length ? product.images : undefined,
    sku: product.sku || undefined,
    brand: { "@type": "Brand", name: "Oucy Studios" },
    ...(reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(avgRating.toFixed(1)),
            reviewCount,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "EUR",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-lux py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* breadcrumb */}
      <nav className="mb-8 text-xs uppercase tracking-[0.16em] text-muted">
        <Link href="/" className="hover:text-gold-3">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/tienda" className="hover:text-gold-3">Tienda</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">{product.name}</span>
      </nav>

      <div className="grid gap-12 md:grid-cols-2">
        <Reveal>
          <ProductGallery images={product.images ?? []} name={product.name} />
        </Reveal>

        <Reveal delay={80} className="md:pt-4">
          <h1 className="heading text-4xl sm:text-5xl">{product.name}</h1>
          {reviewCount > 0 && (
            <a href="#opiniones" className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-gold-3">
              <Stars value={avgRating} />
              <span>
                {avgRating.toFixed(1)} · {reviewCount} reseña{reviewCount === 1 ? "" : "s"}
              </span>
            </a>
          )}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl">{euro(product.price)}</span>
            {onSale && (
              <>
                <span className="text-muted line-through">{euro(product.compare_at_price)}</span>
                <span className="bg-gold-grad px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#3a2d10]">
                  Oferta
                </span>
              </>
            )}
          </div>

          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-gold-3">
            {product.stock > 0
              ? product.stock <= 5
                ? `Solo quedan ${product.stock}`
                : "Disponible"
              : "Agotado — vuelve pronto"}
          </p>

          <div className="mt-8">
            <BuyBox product={product} />
          </div>

          {product.description && (
            <p className="mt-8 leading-relaxed text-ink-soft">{product.description}</p>
          )}

          {/* detalles */}
          <div className="mt-8 divide-y divide-gold/15 border-y border-gold/15">
            <Detail title="Materiales y cuidado">
              {product.material || "Acero inoxidable"}. Resistente al agua y pensada
              para el uso diario. Guárdala en un lugar seco y evita el contacto directo
              con perfume o cremas para conservar su brillo.
            </Detail>
            <Detail title="Envíos">
              Envío en 24–72 h desde España con seguimiento. Gratis a partir de 24,90 €.
            </Detail>
            <Detail title="Devoluciones">
              14 días para devoluciones. Los pendientes, por higiene, solo si vienen
              precintados.
            </Detail>
          </div>
        </Reveal>
      </div>

      {/* opiniones */}
      <section id="opiniones" className="mt-24 scroll-mt-24">
        <Reveal className="mb-8 text-center">
          <div className="hairline mx-auto" />
          <h2 className="heading mt-4 text-3xl">Opiniones</h2>
          {reviewCount > 0 ? (
            <div className="mt-3 flex items-center justify-center gap-2 text-ink-soft">
              <Stars value={avgRating} />
              <span className="text-sm">
                {avgRating.toFixed(1)} de 5 · {reviewCount} reseña{reviewCount === 1 ? "" : "s"}
              </span>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Aún no hay reseñas. ¿Ya la tienes? Sé la primera en opinar.
            </p>
          )}
        </Reveal>

        <div className="mx-auto max-w-2xl">
          {reviews.length > 0 && (
            <ul className="divide-y divide-gold/15 border-y border-gold/15">
              {reviews.map((r) => (
                <li key={r.id} className="py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Stars value={r.rating} />
                      <span className="text-sm font-medium">{r.name}</span>
                    </div>
                    <span className="text-xs text-muted">
                      {new Date(r.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                  {r.body && (
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.body}</p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 text-center">
            <ReviewForm productId={product.id} />
          </div>
        </div>
      </section>

      {/* relacionados */}
      {relatedList.length > 0 && (
        <section className="mt-24">
          <Reveal className="mb-10 text-center">
            <div className="hairline mx-auto" />
            <h2 className="heading mt-4 text-3xl">También te puede gustar</h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {relatedList.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm uppercase tracking-[0.14em] text-ink">
        {title}
        <span className="text-gold-3 transition group-open:rotate-45">+</span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{children}</p>
    </details>
  );
}
