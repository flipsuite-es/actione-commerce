"use client";

import { useState } from "react";

export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const pics = images?.length ? images : [];
  const [active, setActive] = useState(0);

  if (pics.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center border border-gold/15 bg-ivory-2">
        <span className="gold-text font-serif text-2xl italic">Oucy Studios</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {pics.length > 1 && (
        <div className="flex gap-3 md:flex-col">
          {pics.slice(0, 6).map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden border transition ${
                active === i ? "border-gold" : "border-gold/20 hover:border-gold/50"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-hidden border border-gold/15 bg-ivory-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pics[active]}
          alt={name}
          className="aspect-square w-full animate-fade-in object-cover"
        />
      </div>
    </div>
  );
}
