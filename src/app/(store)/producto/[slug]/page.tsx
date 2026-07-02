import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getActiveProducts } from "@/lib/data";
import { euro } from "@/lib/format";
import ProductGallery from "@/components/ProductGallery";
import BuyBox from "@/components/BuyBox";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";

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
      (product.description || "Joya de acero dorado que no se oxida.").slice(0, 160),
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

  const all = await getActiveProducts();
  const related = all
    .filter((p) => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 4);
  const fallbackRelated = all.filter((p) => p.id !== product.id).slice(0, 4);
  const relatedList = related.length ? related : fallbackRelated;

  const onSale =
    product.compare_at_price != null && product.compare_at_price > product.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description || "Joya de acero inoxidable dorado que no se oxida.",
    image: product.images?.length ? product.images : undefined,
    sku: product.sku || undefined,
    brand: { "@type": "Brand", name: "Oucy Studios" },
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
                ? `Solo quedan ${product.stock} · lote limitado`
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
              {product.material || "Acero inoxidable dorado"}. No se oxida, resiste el
              agua y no mancha la piel. Guárdalo seco y evita el contacto directo con
              perfume para que dure aún más.
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
