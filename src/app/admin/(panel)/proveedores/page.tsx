import Link from "next/link";
import { getAllSuppliers, getAllProducts } from "@/lib/admin-data";
import { deleteSupplier } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const [suppliers, products] = await Promise.all([
    getAllSuppliers(),
    getAllProducts(),
  ]);
  const countBySupplier = new Map<string, number>();
  for (const p of products) {
    if (p.supplier_id)
      countBySupplier.set(p.supplier_id, (countBySupplier.get(p.supplier_id) ?? 0) + 1);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Proveedores</h1>
        <Link href="/admin/proveedores/nuevo" className="btn-gold">
          + Nuevo
        </Link>
      </div>
      <p className="mb-6 mt-1 text-muted">
        Tus proveedores de producto. Cada pieza puede enlazarse a uno para reponer
        stock y hacer nuevos pedidos.
      </p>

      {suppliers.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          Aún no hay proveedores. Crea el primero.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {suppliers.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/proveedores/${s.id}`}
                    className="font-serif text-xl hover:text-gold-3"
                  >
                    {s.name}
                  </Link>
                  {!s.active && (
                    <span className="ml-2 rounded bg-ink/10 px-2 py-0.5 text-[11px] uppercase tracking-wider text-ink-soft">
                      Inactivo
                    </span>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {countBySupplier.get(s.id) ?? 0} producto
                    {(countBySupplier.get(s.id) ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <dl className="mt-3 space-y-1 text-sm text-ink-soft">
                {s.contact_name && <div>{s.contact_name}</div>}
                {s.email && <div className="truncate">{s.email}</div>}
                {s.phone && <div>{s.phone}</div>}
                {s.lead_time_days != null && (
                  <div className="text-muted">Plazo ~{s.lead_time_days} días</div>
                )}
              </dl>
              <div className="mt-4 flex gap-4 text-xs uppercase tracking-wider">
                <Link href={`/admin/proveedores/${s.id}`} className="text-ink-soft hover:text-gold-3">
                  Editar
                </Link>
                {s.website && (
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink-soft hover:text-gold-3"
                  >
                    Catálogo ↗
                  </a>
                )}
                <form
                  action={async () => {
                    "use server";
                    await deleteSupplier(s.id);
                  }}
                >
                  <button className="text-muted hover:text-red-600">Borrar</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
