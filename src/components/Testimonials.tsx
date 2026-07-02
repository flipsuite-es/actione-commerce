import { IconSparkle } from "./icons";
import type { Review } from "@/lib/types";

const FALLBACK = [
  {
    q: "Llevo el anillo desde hace meses, en la ducha y el gym, y sigue como el primer día. No se ha puesto negro.",
    a: "Lucía M.",
    r: 5,
  },
  {
    q: "Tengo la piel súper sensible y es de lo poco que puedo llevar sin que me irrite. Además preciosos.",
    a: "Marta R.",
    r: 5,
  },
  {
    q: "Lo pedí como regalo y llegó en 2 días con un packaging monísimo. Parecen de joyería de verdad.",
    a: "Andrea G.",
    r: 5,
  },
];

export default function Testimonials({ reviews = [] }: { reviews?: Review[] }) {
  const data =
    reviews.length >= 3
      ? reviews.slice(0, 3).map((r) => ({ q: r.body, a: r.name, r: r.rating }))
      : FALLBACK;

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {data.map((t, i) => (
        <figure key={t.a + i} className="card p-7 text-center">
          <div className="mb-3 flex justify-center gap-1 text-gold">
            {Array.from({ length: t.r }).map((_, n) => (
              <IconSparkle key={n} width={14} height={14} />
            ))}
          </div>
          <blockquote className="font-serif text-lg italic leading-snug text-ink">
            “{t.q}”
          </blockquote>
          <figcaption className="mt-4 text-[11px] uppercase tracking-[0.2em] text-muted">
            {t.a}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
