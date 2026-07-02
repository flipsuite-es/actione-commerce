"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { useToast } from "@/lib/toast";
import { euro } from "@/lib/format";
import { IconClose } from "@/components/icons";

export default function FavoritosPage() {
  const wish = useWishlist();
  const { add, setOpen } = useCart();
  const { toast } = useToast();

  return (
    <div className="container-lux py-14">
      <div className="mb-10 text-center">
        <div className="hairline mx-auto" />
        <h1 className="heading mt-4 text-4xl sm:text-5xl">Tus favoritos</h1>
      </div>

      {wish.items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted">Aún no has guardado ninguna joya.</p>
          <Link href="/tienda" className="btn-outline mt-6">
            Descubrir la colección
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
          {wish.items.map((i) => (
            <div key={i.id} className="group relative">
              <button
                onClick={() => wish.remove(i.id)}
                aria-label="Quitar"
                className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-ivory/90 text-ink-soft hover:text-gold-3"
              >
                <IconClose width={15} height={15} />
              </button>
              <Link href={`/producto/${i.slug}`}>
                <div className="aspect-[4/5] overflow-hidden border border-gold/15 bg-ivory-2">
                  {i.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.image} alt={i.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="gold-text font-serif text-xl italic">Oucy</span>
                    </div>
                  )}
                </div>
              </Link>
              <div className="mt-3 text-center">
                <h3 className="font-serif text-lg leading-tight">{i.name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{euro(i.price)}</p>
                <button
                  onClick={() => {
                    add({ id: i.id, slug: i.slug, name: i.name, price: i.price, image: i.image }, 1);
                    toast("Añadido a la cesta");
                    setOpen(true);
                  }}
                  className="btn-outline mt-3 w-full !py-2"
                >
                  Añadir a la cesta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
