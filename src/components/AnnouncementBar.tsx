import { IconSparkle } from "./icons";

export default function AnnouncementBar({ text }: { text?: string }) {
  const items = text
    ? [text]
    : [
        "Envío gratis desde 24,90 €",
        "Selección cuidada",
        "Piezas atemporales",
        "Envío con seguimiento",
      ];
  const row = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden bg-gold-grad text-[#3a2d10]">
      <div className="flex w-max animate-marquee whitespace-nowrap py-2">
        {row.map((t, i) => (
          <span
            key={i}
            className="mx-6 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em]"
          >
            <IconSparkle width={12} height={12} /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}
