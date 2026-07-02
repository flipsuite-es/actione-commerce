import Link from "next/link";
import { getAllProducts, getAllOrders } from "@/lib/admin-data";
import { euro } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [products, orders] = await Promise.all([
    getAllProducts(),
    getAllOrders(),
  ]);
  const active = products.filter((p) => p.status === "active").length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 3);
  const outStock = products.filter((p) => p.stock <= 0).length;
  const pending = orders.filter((o: any) => o.status === "pending").length;

  const cards = [
    { label: "Productos activos", value: active },
    { label: "Borradores", value: products.length - active },
    { label: "Sin stock", value: outStock },
    { label: "Pedidos pendientes", value: pending },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl">Panel</h1>
      <p className="mt-1 text-muted">Resumen de tu tienda.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="font-serif text-4xl">{c.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
              {c.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/productos/nuevo" className="btn-gold">
          + Nuevo producto
        </Link>
        <Link href="/admin/productos" className="btn-outline">
          Gestionar productos
        </Link>
      </div>

      {lowStock.length > 0 && (
        <div className="mt-10">
          <h2 className="font-serif text-2xl">Stock bajo</h2>
          <ul className="mt-4 divide-y divide-gold/15 card">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3">
                <Link href={`/admin/productos/${p.id}`} className="hover:text-gold-3">
                  {p.name}
                </Link>
                <span className="text-sm text-red-600">Quedan {p.stock}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {orders.length > 0 && (
        <div className="mt-10">
          <h2 className="font-serif text-2xl">Últimos pedidos</h2>
          <ul className="mt-4 divide-y divide-gold/15 card">
            {orders.slice(0, 5).map((o: any) => (
              <li key={o.id} className="flex items-center justify-between px-5 py-3">
                <span>{o.name || o.email}</span>
                <span className="text-sm text-ink-soft">{euro(o.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
