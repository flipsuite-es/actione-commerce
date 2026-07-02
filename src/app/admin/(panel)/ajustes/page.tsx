import { getSettings } from "@/lib/data";
import { saveSettings } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const s = await getSettings();
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl">Ajustes</h1>
      <p className="mb-6 mt-1 text-muted">Todo lo de tu tienda, editable desde aquí.</p>

      <form action={saveSettings} className="space-y-8">
        <Section title="Muro de pre-lanzamiento">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="prelaunch_enabled" defaultChecked={s.prelaunch_enabled} />
            Activar muro (la tienda pide un código para entrar)
          </label>
          <Field label="Código de acceso" name="access_code" defaultValue={s.access_code} />
        </Section>

        <Section title="Marca y textos">
          <Field label="Nombre" name="shop_name" defaultValue={s.shop_name} />
          <Field label="Tagline" name="tagline" defaultValue={s.tagline} />
          <Area label="Subtítulo de portada" name="hero_subtitle" defaultValue={s.hero_subtitle} />
          <Area label="Nuestra historia" name="story_text" defaultValue={s.story_text} />
          <Field label="Anuncio superior (marquee)" name="announcement" defaultValue={s.announcement ?? ""} placeholder="Ej: Envío gratis desde 24,90 €" />
        </Section>

        <Section title="Redes y contacto">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Instagram (URL)" name="instagram_url" defaultValue={s.instagram_url} />
            <Field label="TikTok (URL)" name="tiktok_url" defaultValue={s.tiktok_url} />
            <Field label="WhatsApp (URL)" name="whatsapp_url" defaultValue={s.whatsapp_url} />
            <Field label="Email de contacto" name="contact_email" defaultValue={s.contact_email} />
          </div>
        </Section>

        <Section title="Envíos">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Envío gratis desde (€)" name="free_ship_threshold" type="number" defaultValue={String(s.free_ship_threshold)} />
            <Field label="Coste de envío (€)" name="shipping_flat" type="number" defaultValue={String(s.shipping_flat)} />
          </div>
        </Section>

        <button className="btn-gold">Guardar ajustes</button>
        <p className="text-xs text-muted">
          Los campos de contenido y redes requieren haber ejecutado la migración
          <b> 002_backoffice.sql</b> en Supabase.
        </p>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-6">
      <h2 className="font-serif text-xl">{title}</h2>
      {children}
    </section>
  );
}
function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        name={name}
        type={type}
        step={type === "number" ? "0.01" : undefined}
        className="input"
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </div>
  );
}
function Area({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea name={name} rows={3} className="input" defaultValue={defaultValue} />
    </div>
  );
}
