"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export default function AddToCart({ product }: { product: Product }) {
  const { add, setOpen } = useCart();
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;

  return (
    <button
      disabled={soldOut}
      onClick={() => {
        add(
          {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.images?.[0] ?? null,
          },
          1,
        );
        setAdded(true);
        setOpen(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className="btn-gold w-full sm:w-auto"
    >
      {soldOut ? "Agotado" : added ? "Añadido ✦" : "Añadir a la cesta"}
    </button>
  );
}
