import { saveSupplier } from "@/app/admin/actions";
import type { Supplier } from "@/lib/types";

export default function SupplierForm({ supplier }: { supplier?: Supplier }) {
  return (
    <form action={saveSupplier} className="max-w-2xl space-y-6">
      {supplier && <input type="hidden" name="id" defaultValue={supplier.id} />}

      <section className="card space-y-4 p-6">
        <div>
          <label className="label">Nombre del proveedor</label>
          <input
            name="name"
            className="input"
            defaultValue={supplier?.name}
            placeholder="p. ej. Smile Joyas"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Persona de contacto</label>
            <input
              name="contact_name"
              className="input"
              defaultValue={supplier?.contact_name ?? ""}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              name="email"
              type="email"
              className="input"
              defaultValue={supplier?.email ?? ""}
            />
          </div>
          <div>
            <label className="label">Teléfono / WhatsApp</label>
            <input name="phone" className="input" defaultValue={supplier?.phone ?? ""} />
          </div>
          <div>
            <label className="label">Web / catálogo</label>
            <input
              name="website"
              className="input"
              defaultValue={supplier?.website ?? ""}
              placeholder="https://"
            />
          </div>
          <div>
            <label className="label">Plazo de entrega (días)</label>
            <input
              name="lead_time_days"
              type="number"
              className="input"
              defaultValue={supplier?.lead_time_days ?? ""}
            />
          </div>
          <div>
            <label className="label">Pedido mínimo (€, opcional)</label>
            <input
              name="min_order"
              type="number"
              step="0.01"
              className="input"
              defaultValue={supplier?.min_order ?? ""}
            />
          </div>
        </div>
        <div>
          <label className="label">Notas internas</label>
          <textarea
            name="notes"
            rows={3}
            className="input"
            defaultValue={supplier?.notes ?? ""}
            placeholder="Condiciones, portes, cómo se hacen los pedidos…"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={supplier?.active ?? true}
          />
          Proveedor activo
        </label>
      </section>

      <div className="flex gap-3">
        <button type="submit" className="btn-gold">
          Guardar proveedor
        </button>
        <a href="/admin/proveedores" className="btn-outline">
          Cancelar
        </a>
      </div>
    </form>
  );
}
