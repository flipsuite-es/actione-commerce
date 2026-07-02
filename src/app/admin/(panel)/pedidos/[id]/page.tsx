import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/admin-data";
import { euro } from "@/lib/format";
import { updateOrder } from "@/app/admin/actions";
import { OrderBadge } from "@/components/admin/OrderBadge";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);
  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/pedidos" className="text-xs uppercase tracking-[0.16em] text-muted hover:text-gold-3">
        ← Pedidos
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">Pedido</h1>
        <OrderBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted">
        {new Date(order.created_at).toLocaleString("es-ES")}
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Cliente */}
        <div className="card p-6">
          <h2 className="font-serif text-xl">Cliente</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <Row k="Nombre" v={order.name} />
            <Row k="Correo" v={order.email} />
            <Row k="Teléfono" v={order.phone} />
            {order.note && <Row k="Nota" v={order.note} />}
          </dl>
        </div>

        {/* Totales */}
        <div className="card p-6">
          <h2 className="font-serif text-xl">Resumen</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <Row k="Subtotal" v={euro(order.subtotal)} />
            <Row k="Envío" v={order.shipping ? euro(order.shipping) : "Gratis"} />
            {order.discount > 0 && (
              <Row k={`Descuento${order.coupon_code ? ` (${order.coupon_code})` : ""}`} v={`− ${euro(order.discount)}`} />
            )}
            <div className="flex justify-between border-t border-gold/15 pt-2 font-serif text-lg">
              <span>Total</span>
              <span>{euro(order.total)}</span>
            </div>
          </dl>
        </div>
      </div>

      {/* Artículos */}
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="border-b border-gold/15 text-left text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-5 py-3">Artículo</th>
              <th className="px-5 py-3">Precio</th>
              <th className="px-5 py-3">Cant.</th>
              <th className="px-5 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold/10">
            {(order.items || []).map((i, n) => (
              <tr key={n}>
                <td className="px-5 py-3">{i.name}</td>
                <td className="px-5 py-3">{euro(i.price)}</td>
                <td className="px-5 py-3">{i.qty}</td>
                <td className="px-5 py-3 text-right">{euro(i.price * i.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gestión */}
      <form action={updateOrder} className="card mt-6 space-y-4 p-6">
        <input type="hidden" name="id" defaultValue={order.id} />
        <h2 className="font-serif text-xl">Gestionar</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Estado</label>
            <select name="status" className="input" defaultValue={order.status}>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagado</option>
              <option value="shipped">Enviado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="label">Nº de seguimiento</label>
            <input name="tracking" className="input" defaultValue={order.tracking ?? ""} />
          </div>
        </div>
        <div>
          <label className="label">Nota interna</label>
          <textarea name="note" rows={2} className="input" defaultValue={order.note ?? ""} />
        </div>
        <button className="btn-gold">Guardar cambios</button>
      </form>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right text-ink">{v || "—"}</dd>
    </div>
  );
}
