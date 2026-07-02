"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { Product } from "@/lib/types";
import { euro } from "@/lib/format";
import { adjustStock, deleteProduct, duplicateProduct, toggleProduct } from "@/app/admin/actions";

export default function AdminProductList({ products }: { products: Product[] }) {
  const [pending, start] = useTransition();

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
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
          {products.map((p) => (
            <tr key={p.id} className={pending ? "opacity-60" : ""}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden border border-gold/15 bg-white/60">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <Link
                    href={`/admin/productos/${p.id}`}
                    className="font-medium hover:text-gold-3"
                  >
                    {p.name}
                  </Link>
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
          {products.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-muted">
                Aún no hay productos. Crea el primero.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
