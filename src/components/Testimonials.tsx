import { IconSparkle } from "./icons";

const DATA = [
  {
    q: "Llevo el anillo desde hace meses, en la ducha y el gym, y sigue como el primer día. No se ha puesto negro.",
    a: "Lucía M.",
  },
  {
    q: "Tengo la piel súper sensible y es de lo poco que puedo llevar sin que me irrite. Además preciosos.",
    a: "Marta R.",
  },
  {
    q: "Lo pedí como regalo y llegó en 2 días con un packaging monísimo. Parecen de joyería de verdad.",
    a: "Andrea G.",
  },
];

export default function Testimonials() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {DATA.map((t) => (
        <figure key={t.a} className="card p-7 text-center">
          <div className="mb-3 flex justify-center gap-1 text-gold">
            {Array.from({ length: 5 }).map((_, i) => (
              <IconSparkle key={i} width={14} height={14} />
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
