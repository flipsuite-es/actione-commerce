"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useToast } from "@/lib/toast";
import { IconMinus, IconPlus, IconHeart, IconHeartFill } from "./icons";

export default function BuyBox({ product }: { product: Product }) {
  const { add, setOpen } = useCart();
  const wish = useWishlist();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const soldOut = product.stock <= 0;
  const liked = wish.has(product.id);
  const img = product.images?.[0] ?? null;

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-gold/30">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-11 w-11 place-items-center text-ink-soft hover:text-gold-3 disabled:opacity-40"
            disabled={soldOut}
            aria-label="Menos"
          >
            <IconMinus width={16} height={16} />
          </button>
          <span className="w-10 text-center">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
            className="grid h-11 w-11 place-items-center text-ink-soft hover:text-gold-3 disabled:opacity-40"
            disabled={soldOut}
            aria-label="Más"
          >
            <IconPlus width={16} height={16} />
          </button>
        </div>

        <button
          disabled={soldOut}
          onClick={() => {
            add({ id: product.id, slug: product.slug, name: product.name, price: product.price, image: img }, qty);
            toast("Añadido a la cesta");
            setOpen(true);
          }}
          className="btn-gold flex-1"
        >
          {soldOut ? "Agotado" : "Añadir a la cesta"}
        </button>

        <button
          onClick={() =>
            wish.toggle({ id: product.id, slug: product.slug, name: product.name, price: product.price, image: img })
          }
          aria-label="Favorito"
          className={`grid h-[52px] w-[52px] shrink-0 place-items-center border transition ${
            liked ? "border-gold text-gold-3" : "border-gold/30 text-ink-soft hover:text-gold-3"
          }`}
        >
          {liked ? <IconHeartFill /> : <IconHeart />}
        </button>
      </div>

      <p className="mt-3 text-center text-[11px] uppercase tracking-[0.16em] text-muted">
        Pago seguro · Envío 24–72 h · Devolución en 14 días
      </p>
    </div>
  );
}
