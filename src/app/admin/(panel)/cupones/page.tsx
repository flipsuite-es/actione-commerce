import { getAllCoupons } from "@/lib/admin-data";
import { saveCoupon, deleteCoupon } from "@/app/admin/actions";
import { euro } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CuponesPage() {
  let coupons = [] as Awaited<ReturnType<typeof getAllCoupons>>;
  let ready = true;
  try {
    coupons = await getAllCoupons();
  } catch {
    ready = false;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl">Cupones</h1>
      <p className="mb-6 mt-1 text-muted">Códigos de descuento para tu tienda.</p>

      {!ready && (
        <div className="mb-6 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Ejecuta la migración <b>002_backoffice.sql</b> en Supabase para activar los cupones.
        </div>
      )}

      {/* Crear */}
      <form action={saveCoupon} className="card mb-8 grid gap-3 p-5 sm:grid-cols-5 sm:items-end">
        <div className="sm:col-span-2">
          <label className="label">Código</label>
          <input name="code" className="input" placeholder="BIENVENIDA10" required />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select name="kind" className="input">
            <option value="percent">%</option>
            <option value="fixed">€</option>
          </select>
        </div>
        <div>
          <label className="label">Valor</label>
          <input name="value" type="number" step="0.01" className="input" defaultValue={10} />
        </div>
        <button className="btn-gold">Crear</button>
        <label className="flex items-center gap-2 text-sm sm:col-span-5">
          <input type="checkbox" name="active" defaultChecked /> Activo
        </label>
      </form>

      {/* Lista */}
      <div className="card divide-y divide-gold/10">
        {coupons.length === 0 && ready && (
          <p className="px-5 py-8 text-center text-muted">Aún no hay cupones.</p>
        )}
        {coupons.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <span className="font-mono text-sm font-semibold tracking-wider">{c.code}</span>
            <span className="text-sm text-ink-soft">
              {c.kind === "percent" ? `${c.value}%` : euro(c.value)}
              {c.min_subtotal ? ` · desde ${euro(c.min_subtotal)}` : ""}
            </span>
            <span className={`rounded px-2 py-0.5 text-[11px] uppercase ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-ink/10 text-ink-soft"}`}>
              {c.active ? "Activo" : "Inactivo"}
            </span>
            <form action={saveCoupon} className="ml-auto flex items-center gap-2">
              <input type="hidden" name="id" defaultValue={c.id} />
              <input type="hidden" name="code" defaultValue={c.code} />
              <input type="hidden" name="kind" defaultValue={c.kind} />
              <input type="hidden" name="value" defaultValue={c.value} />
              <label className="flex items-center gap-1 text-xs text-muted">
                <input type="checkbox" name="active" defaultChecked={c.active} /> activo
              </label>
              <button className="btn-outline !px-3 !py-1.5">Actualizar</button>
            </form>
            <form action={deleteCoupon.bind(null, c.id)}>
              <button className="px-2 text-muted hover:text-red-600" title="Borrar">✕</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
