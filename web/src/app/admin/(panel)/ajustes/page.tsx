import { getSettings } from "@/lib/data";
import { saveSettings } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const s = await getSettings();
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl">Ajustes</h1>
      <p className="mb-6 mt-1 text-muted">Configuración de la tienda.</p>

      <form action={saveSettings} className="space-y-8">
        <section className="card space-y-4 p-6">
          <h2 className="font-serif text-xl">Muro de pre-lanzamiento</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="prelaunch_enabled"
              defaultChecked={s.prelaunch_enabled}
            />
            Activar muro (la tienda pide un código para entrar)
          </label>
          <div>
            <label className="label">Código de acceso</label>
            <input name="access_code" className="input" defaultValue={s.access_code} />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-serif text-xl">Tienda</h2>
          <div>
            <label className="label">Nombre</label>
            <input name="shop_name" className="input" defaultValue={s.shop_name} />
          </div>
          <div>
            <label className="label">Tagline</label>
            <input name="tagline" className="input" defaultValue={s.tagline} />
          </div>
          <div>
            <label className="label">Anuncio superior (opcional)</label>
            <input
              name="announcement"
              className="input"
              defaultValue={s.announcement ?? ""}
              placeholder="Ej: Envío gratis desde 24,90 €"
            />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-serif text-xl">Envíos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Envío gratis desde (€)</label>
              <input
                name="free_ship_threshold"
                type="number"
                step="0.01"
                className="input"
                defaultValue={s.free_ship_threshold}
              />
            </div>
            <div>
              <label className="label">Coste de envío (€)</label>
              <input
                name="shipping_flat"
                type="number"
                step="0.01"
                className="input"
                defaultValue={s.shipping_flat}
              />
            </div>
          </div>
        </section>

        <button type="submit" className="btn-gold">
          Guardar ajustes
        </button>
      </form>
    </div>
  );
}
