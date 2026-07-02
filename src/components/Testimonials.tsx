import { IconSparkle } from "./icons";
import type { Review } from "@/lib/types";

const FALLBACK = [
  {
    q: "Me lo pongo con todo y siempre me preguntan de dónde es. Se ha vuelto mi sello.",
    a: "Lucía M.",
    r: 5,
  },
  {
    q: "Elegante sin esfuerzo. Es de esas piezas que sientes tuyas desde el primer día.",
    a: "Marta R.",
    r: 5,
  },
  {
    q: "Lo regalé y fue un acierto total. El detalle y la presentación, de diez.",
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
