import { getAllOrders } from "@/lib/admin-data";
import { euro } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const orders = await getAllOrders();
  return (
    <div>
      <h1 className="font-serif text-3xl">Pedidos</h1>
      <p className="mb-6 mt-1 text-muted">
        {orders.length} pedido{orders.length === 1 ? "" : "s"}
      </p>

      {orders.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          Todavía no hay pedidos.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gold/20 text-left text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Artículos</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {orders.map((o: any) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">
                    <div>{o.name}</div>
                    <div className="text-xs text-muted">{o.email}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {(o.items as any[])
                      .map((i) => `${i.name} ×${i.qty}`)
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3">{euro(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-gold/15 px-2 py-0.5 text-[11px] uppercase tracking-wider text-gold-3">
                      {o.status}
                    </span>
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
