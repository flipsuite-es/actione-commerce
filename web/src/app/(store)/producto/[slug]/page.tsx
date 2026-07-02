import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/data";
import { euro } from "@/lib/format";
import AddToCart from "@/components/AddToCart";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const onSale =
    product.compare_at_price != null &&
    product.compare_at_price > product.price;
  const images = product.images?.length ? product.images : [null];

  return (
    <div className="grid gap-10 py-14 md:grid-cols-2">
      {/* Galería */}
      <div className="space-y-4">
        <div className="aspect-square overflow-hidden border border-gold/15 bg-white/60">
          {images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[0]!}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-2xl italic text-muted">
              Oucy Studios
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {images.slice(1, 5).map((src, i) =>
              src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="aspect-square w-full border border-gold/15 object-cover"
                />
              ) : null,
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="md:pt-6">
        <h1 className="font-serif text-4xl">{product.name}</h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-2xl">{euro(product.price)}</span>
          {onSale && (
            <span className="text-muted line-through">
              {euro(product.compare_at_price)}
            </span>
          )}
        </div>

        {product.stock > 0 ? (
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-gold-3">
            {product.stock <= 5 ? `Solo quedan ${product.stock}` : "Disponible"}
          </p>
        ) : (
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">
            Agotado
          </p>
        )}

        <div className="mt-6">
          <AddToCart product={product} />
        </div>

        {product.description && (
          <p className="mt-8 leading-relaxed text-ink-soft">
            {product.description}
          </p>
        )}

        <ul className="mt-8 space-y-2 border-t border-gold/20 pt-6 text-sm text-ink-soft">
          <li>✦ {product.material || "Acero inoxidable dorado"}</li>
          <li>✦ No se oxida · resiste el agua · no mancha la piel</li>
          <li>✦ Apta para piel sensible</li>
          <li>✦ Envío 24–72 h desde España</li>
        </ul>
      </div>
    </div>
  );
}
