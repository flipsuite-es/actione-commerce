"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { Product, Supplier } from "@/lib/types";
import { euro } from "@/lib/format";
import { adjustStock, deleteProduct, duplicateProduct, toggleProduct } from "@/app/admin/actions";

type Filter = "all" | "active" | "draft" | "low";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Activos" },
  { key: "draft", label: "Borradores" },
  { key: "low", label: "Stock bajo" },
];

export default function AdminProductList({
  products,
  suppliers = [],
}: {
  products: Product[];
  suppliers?: Supplier[];
}) {
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const supplierName = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s.name])),
    [suppliers]
  );

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "active" && p.status !== "active") return false;
      if (filter === "draft" && p.status !== "draft") return false;
      if (filter === "low" && p.stock > 3) return false;
      if (
        term &&
        !p.name.toLowerCase().includes(term) &&
        !(p.sku || "").toLowerCase().includes(term) &&
        !(p.supplier_ref || "").toLowerCase().includes(term)
      )
        return false;
      return true;
    });
  }, [products, q, filter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, SKU o ref. proveedor…"
          className="input max-w-xs !py-2.5"
        />
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition ${
                filter === f.key
                  ? "bg-gold/15 text-ink"
                  : "text-muted hover:bg-gold/10 hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted">
          {shown.length} de {products.length}
        </span>
      </div>

      <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-gold/20 text-left text-xs uppercase tracking-[0.14em] text-muted">
          <tr>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Precio</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gold/10">
          {shown.map((p) => (
            <tr key={p.id} className={pending ? "opacity-60" : ""}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden border border-gold/15 bg-white/60">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="font-medium hover:text-gold-3"
                    >
                      {p.name}
                    </Link>
                    {(p.sku || p.supplier_ref || p.supplier_id) && (
                      <div className="text-[11px] text-muted">
                        {p.sku && <span>{p.sku}</span>}
                        {p.supplier_id && supplierName.get(p.supplier_id) && (
                          <span>
                            {p.sku ? " · " : ""}
                            {supplierName.get(p.supplier_id)}
                          </span>
                        )}
                        {p.supplier_ref && (
                          <span>
                            {p.sku || p.supplier_id ? " · " : ""}Ref: {p.supplier_ref}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">{euro(p.price)}</td>
              <td className="px-4 py-3">
                <div className="inline-flex items-center gap-2">
                  <button
                    onClick={() => start(() => adjustStock(p.id, -1))}
                    className="h-6 w-6 border border-gold/30 text-ink-soft hover:bg-gold/10"
                    aria-label="Restar stock"
                  >
                    −
                  </button>
                  <span
                    className={
                      p.stock <= 0
                        ? "text-red-600"
                        : p.stock <= 3
                          ? "text-amber-600"
                          : ""
                    }
                  >
                    {p.stock}
                  </span>
                  <button
                    onClick={() => start(() => adjustStock(p.id, +1))}
                    className="h-6 w-6 border border-gold/30 text-ink-soft hover:bg-gold/10"
                    aria-label="Sumar stock"
                  >
                    +
                  </button>
                </div>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => start(() => toggleProduct(p.id, "status"))}
                  title="Cambiar visibilidad"
                  className={`rounded px-2 py-0.5 text-[11px] uppercase tracking-wider transition ${
                    p.status === "active"
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-ink/10 text-ink-soft hover:bg-ink/20"
                  }`}
                >
                  {p.status === "active" ? "Activo" : "Borrador"}
                </button>
                <button
                  onClick={() => start(() => toggleProduct(p.id, "featured"))}
                  title="Destacar en portada"
                  className={`ml-2 text-sm transition ${p.featured ? "text-gold" : "text-ink/25 hover:text-gold-3"}`}
                >
                  ★
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/productos/${p.id}`}
                  className="text-xs uppercase tracking-wider text-ink-soft hover:text-gold-3"
                >
                  Editar
                </Link>
                <button
                  onClick={() => start(() => duplicateProduct(p.id))}
                  className="ml-4 text-xs uppercase tracking-wider text-ink-soft hover:text-gold-3"
                >
                  Duplicar
                </button>
                <button
                  onClick={() => {
                    if (confirm(`¿Borrar "${p.name}"?`))
                      start(() => deleteProduct(p.id));
                  }}
                  className="ml-4 text-xs uppercase tracking-wider text-muted hover:text-red-600"
                >
                  Borrar
                </button>
              </td>
            </tr>
          ))}
          {shown.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-muted">
                {products.length === 0
                  ? "Aún no hay productos. Crea el primero."
                  : "Ningún producto coincide con la búsqueda."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
