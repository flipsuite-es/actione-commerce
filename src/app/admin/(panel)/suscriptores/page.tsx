import { getSubscribers } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function SuscriptoresPage() {
  let subs = [] as Awaited<ReturnType<typeof getSubscribers>>;
  let ready = true;
  try {
    subs = await getSubscribers();
  } catch {
    ready = false;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Suscriptores</h1>
          <p className="mt-1 text-muted">
            {subs.length} correo{subs.length === 1 ? "" : "s"} captado
            {subs.length === 1 ? "" : "s"}.
          </p>
        </div>
        {subs.length > 0 && (
          <a href="/admin/suscriptores/export" className="btn-outline !px-5 !py-2.5">
            Exportar CSV
          </a>
        )}
      </div>

      {!ready && (
        <div className="mt-6 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Ejecuta la migración <b>005_resenas_suscriptores.sql</b> en Supabase para
          activar la captura de correos.
        </div>
      )}

      {subs.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-muted">
          {ready ? "Todavía no hay suscriptores." : "—"}
        </div>
      ) : (
        <div className="card mt-6 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gold/20 text-left text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {subs.map((s) => (
                <tr key={s.id} className="transition hover:bg-gold/5">
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3 text-ink-soft">{s.source}</td>
                  <td className="px-4 py-3 text-right text-muted">
                    {new Date(s.created_at).toLocaleDateString("es-ES")}
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
