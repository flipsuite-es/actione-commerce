import Link from "next/link";
import { getAllOrders } from "@/lib/admin-data";
import { euro } from "@/lib/format";
import { OrderBadge } from "@/components/admin/OrderBadge";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const orders = await getAllOrders();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Pedidos</h1>
          <p className="mt-1 text-muted">
            {orders.length} pedido{orders.length === 1 ? "" : "s"}
          </p>
        </div>
        {orders.length > 0 && (
          <a href="/admin/pedidos/export" className="btn-outline !px-5 !py-2.5">
            Exportar CSV
          </a>
        )}
      </div>
      <div className="mb-6" />

      {orders.length === 0 ? (
        <div className="card p-10 text-center text-muted">Todavía no hay pedidos.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-gold/20 text-left text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Artículos</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {orders.map((o) => (
                <tr key={o.id} className="transition hover:bg-gold/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pedidos/${o.id}`} className="font-medium hover:text-gold-3">
                      {o.name || "—"}
                    </Link>
                    <div className="text-xs text-muted">{o.email}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {(o.items || []).reduce((n, i) => n + i.qty, 0)} uds
                  </td>
                  <td className="px-4 py-3">{euro(o.total)}</td>
                  <td className="px-4 py-3">
                    <OrderBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
