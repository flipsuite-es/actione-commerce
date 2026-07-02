import Link from "next/link";
import {
  getAllProducts,
  getAllOrders,
  getAllTickets,
  getAllReviews,
  getSubscribers,
} from "@/lib/admin-data";
import { euro } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [products, orders, tickets, reviews, subscribers] = await Promise.all([
    getAllProducts(),
    getAllOrders(),
    getAllTickets().catch(() => []),
    getAllReviews().catch(() => []),
    getSubscribers().catch(() => []),
  ]);
  const openTickets = tickets.filter(
    (t) => t.status === "open" || t.status === "pending",
  ).length;
  const pendingReviews = reviews.filter((r) => !r.approved).length;

  const paid = orders.filter((o) => o.status === "paid" || o.status === "shipped");
  const revenue = paid.reduce((n, o) => n + Number(o.total || 0), 0);
  const units = paid.reduce(
    (n, o) => n + (o.items || []).reduce((s, i) => s + (i.qty || 0), 0),
    0,
  );
  const pending = orders.filter((o) => o.status === "pending").length;
  const aov = paid.length ? revenue / paid.length : 0;

  const active = products.filter((p) => p.status === "active").length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 3);
  const outStock = products.filter((p) => p.stock <= 0).length;

  // Best sellers (por unidades en pedidos pagados)
  const tally = new Map<string, { name: string; qty: number }>();
  for (const o of paid)
    for (const i of o.items || []) {
      const cur = tally.get(i.name) || { name: i.name, qty: 0 };
      cur.qty += i.qty || 0;
      tally.set(i.name, cur);
    }
  const best = Array.from(tally.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const cards = [
    { label: "Ingresos (pagados)", value: euro(revenue) },
    { label: "Pedidos pendientes", value: pending },
    { label: "Unidades vendidas", value: units },
    { label: "Ticket medio", value: euro(aov) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Panel</h1>
          <p className="mt-1 text-muted">Resumen de tu tienda.</p>
        </div>
        <Link href="/admin/productos/nuevo" className="btn-gold">
          + Nuevo producto
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="font-serif text-3xl">{c.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm lg:grid-cols-3">
        <MiniStat label="Productos activos" value={active} />
        <MiniStat label="Sin stock" value={outStock} tone={outStock ? "bad" : undefined} />
        <MiniStat label="Tickets por responder" value={openTickets} tone={openTickets ? "bad" : undefined} />
        <MiniStat label="Reseñas por aprobar" value={pendingReviews} tone={pendingReviews ? "bad" : undefined} />
        <MiniStat label="Suscriptores" value={subscribers.length} />
        <MiniStat label="Total pedidos" value={orders.length} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Best sellers */}
        <Panel title="Más vendidos">
          {best.length === 0 ? (
            <Empty>Aún no hay ventas registradas.</Empty>
          ) : (
            <ul className="divide-y divide-gold/10">
              {best.map((b) => (
                <li key={b.name} className="flex items-center justify-between px-5 py-3">
                  <span>{b.name}</span>
                  <span className="text-sm text-ink-soft">{b.qty} uds</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Stock bajo */}
        <Panel title="Stock bajo" action={{ href: "/admin/reposicion", label: "Reponer" }}>
          {lowStock.length === 0 ? (
            <Empty>Todo con stock suficiente. ✦</Empty>
          ) : (
            <ul className="divide-y divide-gold/10">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <Link href={`/admin/productos/${p.id}`} className="hover:text-gold-3">
                    {p.name}
                  </Link>
                  <span className="text-sm text-red-600">Quedan {p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Últimos pedidos + soporte */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Últimos pedidos" action={{ href: "/admin/pedidos", label: "Ver todos" }}>
          {orders.length === 0 ? (
            <Empty>Todavía no hay pedidos.</Empty>
          ) : (
            <ul className="divide-y divide-gold/10">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="flex items-center justify-between px-5 py-3 transition hover:bg-gold/5"
                  >
                    <span>
                      {o.name || o.email}
                      <span className="ml-2 text-xs uppercase tracking-wider text-muted">
                        {o.status}
                      </span>
                    </span>
                    <span className="text-sm text-ink-soft">{euro(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Soporte" action={{ href: "/admin/soporte", label: "Ver todos" }}>
          {tickets.length === 0 ? (
            <Empty>No hay tickets de soporte.</Empty>
          ) : (
            <ul className="divide-y divide-gold/10">
              {tickets.slice(0, 6).map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/admin/soporte/${t.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-gold/5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{t.subject}</span>
                      <span className="text-xs text-muted">{t.name}</span>
                    </span>
                    <span className="shrink-0 text-xs uppercase tracking-wider text-muted">
                      {t.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: "bad" }) {
  return (
    <div className="card px-4 py-3">
      <span className={`font-serif text-2xl ${tone === "bad" ? "text-red-600" : ""}`}>{value}</span>
      <span className="ml-2 text-xs uppercase tracking-[0.12em] text-muted">{label}</span>
    </div>
  );
}
function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-gold/15 px-5 py-3">
        <h2 className="font-serif text-xl">{title}</h2>
        {action && (
          <Link href={action.href} className="text-xs uppercase tracking-wider text-gold-3 hover:text-gold">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-muted">{children}</p>;
}
