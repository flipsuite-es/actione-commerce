import Link from "next/link";
import type { Product } from "@/lib/types";
import { euro } from "@/lib/format";

export default function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0];
  const onSale =
    product.compare_at_price != null &&
    product.compare_at_price > product.price;
  return (
    <Link href={`/producto/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden border border-gold/15 bg-white/60">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <span className="font-serif text-lg italic">Oucy</span>
          </div>
        )}
        {onSale && (
          <span className="absolute left-3 top-3 bg-gold-grad px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#3a2d10]">
            Oferta
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute right-3 top-3 bg-ink/80 px-2 py-1 text-[10px] uppercase tracking-wider text-white">
            Agotado
          </span>
        )}
      </div>
      <div className="mt-3 text-center">
        <h3 className="font-serif text-lg leading-tight">{product.name}</h3>
        <p className="mt-1 text-sm text-ink-soft">
          {euro(product.price)}
          {onSale && (
            <span className="ml-2 text-muted line-through">
              {euro(product.compare_at_price)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
