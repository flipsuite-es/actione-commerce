"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { euro } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useToast } from "@/lib/toast";
import { IconHeart, IconHeartFill } from "./icons";

export default function ProductCard({ product }: { product: Product }) {
  const { add, setOpen } = useCart();
  const wish = useWishlist();
  const { toast } = useToast();

  const img = product.images?.[0] ?? null;
  const img2 = product.images?.[1] ?? null;
  const onSale =
    product.compare_at_price != null && product.compare_at_price > product.price;
  const soldOut = product.stock <= 0;
  const off = onSale
    ? Math.round((1 - product.price / (product.compare_at_price as number)) * 100)
    : 0;
  const liked = wish.has(product.id);

  return (
    <div className="group relative">
      <Link href={`/producto/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden border border-gold/15 bg-ivory-2">
          {img ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className={`h-full w-full object-cover transition-all duration-700 ${
                  img2 ? "group-hover:opacity-0" : "group-hover:scale-[1.05]"
                }`}
              />
              {img2 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img2}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="gold-text font-serif text-xl italic">Oucy</span>
            </div>
          )}

          {/* badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {onSale && !soldOut && (
              <span className="bg-gold-grad px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#3a2d10]">
                −{off}%
              </span>
            )}
            {soldOut && (
              <span className="bg-ink/85 px-2 py-1 text-[10px] uppercase tracking-wider text-white">
                Agotado
              </span>
            )}
            {!soldOut && product.stock <= 5 && (
              <span className="border border-gold/40 bg-ivory/90 px-2 py-1 text-[10px] uppercase tracking-wider text-gold-3">
                Últimas
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* wishlist */}
      <button
        onClick={() =>
          wish.toggle({
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: img,
          })
        }
        aria-label="Favorito"
        className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border transition ${
          liked
            ? "border-gold/40 bg-ivory/95 text-gold-3"
            : "border-transparent bg-ivory/70 text-ink-soft opacity-0 group-hover:opacity-100 hover:text-gold-3"
        }`}
      >
        {liked ? <IconHeartFill width={16} height={16} /> : <IconHeart width={16} height={16} />}
      </button>

      {/* quick add */}
      {!soldOut && (
        <button
          onClick={() => {
            add({ id: product.id, slug: product.slug, name: product.name, price: product.price, image: img }, 1);
            toast("Añadido a la cesta");
            setOpen(true);
          }}
          className="absolute inset-x-3 bottom-[92px] translate-y-2 border border-gold/40 bg-ivory/95 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-ink opacity-0 backdrop-blur transition-all duration-300 hover:bg-gold-grad hover:text-[#3a2d10] group-hover:translate-y-0 group-hover:opacity-100"
        >
          Añadir rápido
        </button>
      )}

      <div className="mt-3 text-center">
        <h3 className="font-serif text-lg leading-tight">
          <Link href={`/producto/${product.slug}`} className="hover:text-gold-3">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-ink-soft">
          {euro(product.price)}
          {onSale && (
            <span className="ml-2 text-muted line-through">
              {euro(product.compare_at_price)}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
