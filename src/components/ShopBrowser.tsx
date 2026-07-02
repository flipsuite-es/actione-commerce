"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import ProductCard from "./ProductCard";

type Sort = "novedades" | "precio-asc" | "precio-desc";

export default function ShopBrowser({
  products,
  categories,
  initialCat = "",
  initialQuery = "",
}: {
  products: Product[];
  categories: Category[];
  initialCat?: string;
  initialQuery?: string;
}) {
  const [cat, setCat] = useState(initialCat);
  const [q, setQ] = useState(initialQuery);
  const [sort, setSort] = useState<Sort>("novedades");

  const catById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.slug])),
    [categories],
  );

  const list = useMemo(() => {
    let out = products.slice();
    if (cat) out = out.filter((p) => p.category_id && catById[p.category_id] === cat);
    if (q.trim()) {
      const t = q.toLowerCase();
      out = out.filter(
        (p) =>
          p.name.toLowerCase().includes(t) ||
          (p.description ?? "").toLowerCase().includes(t),
      );
    }
    if (sort === "precio-asc") out.sort((a, b) => a.price - b.price);
    else if (sort === "precio-desc") out.sort((a, b) => b.price - a.price);
    return out;
  }, [products, cat, q, sort, catById]);

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-8 flex flex-col gap-4 border-y border-gold/15 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Chip active={!cat} onClick={() => setCat("")}>
            Todo
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={cat === c.slug} onClick={() => setCat(c.slug)}>
              {c.name}
            </Chip>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="w-40 border border-gold/30 bg-white/70 px-3 py-2 text-sm outline-none focus:border-gold"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="border border-gold/30 bg-white/70 px-3 py-2 text-sm outline-none focus:border-gold"
          >
            <option value="novedades">Novedades</option>
            <option value="precio-asc">Precio ↑</option>
            <option value="precio-desc">Precio ↓</option>
          </select>
        </div>
      </div>

      <p className="mb-6 text-xs uppercase tracking-[0.16em] text-muted">
        {list.length} pieza{list.length === 1 ? "" : "s"}
      </p>

      {list.length === 0 ? (
        <p className="py-20 text-center text-muted">
          No encontramos piezas con ese filtro. ✦
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-xs uppercase tracking-[0.14em] transition ${
        active
          ? "bg-gold-grad text-[#3a2d10]"
          : "border border-gold/30 text-ink-soft hover:border-gold hover:text-gold-3"
      }`}
    >
      {children}
    </button>
  );
}
