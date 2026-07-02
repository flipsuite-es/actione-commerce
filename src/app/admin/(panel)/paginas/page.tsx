import Link from "next/link";
import { getAllPages } from "@/lib/admin-data";
import { deletePage } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function PaginasPage() {
  let pages = [] as Awaited<ReturnType<typeof getAllPages>>;
  let ready = true;
  try {
    pages = await getAllPages();
  } catch {
    ready = false;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Páginas</h1>
        <Link href="/admin/paginas/nueva" className="btn-gold">+ Nueva</Link>
      </div>
      <p className="mb-6 mt-1 text-muted">Envíos, devoluciones, privacidad, cuidado…</p>

      {!ready && (
        <div className="mb-6 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Ejecuta la migración <b>002_backoffice.sql</b> en Supabase para activar las páginas.
        </div>
      )}

      <div className="card divide-y divide-gold/10">
        {pages.length === 0 && ready && (
          <p className="px-5 py-8 text-center text-muted">Aún no hay páginas.</p>
        )}
        {pages.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-5 py-3">
            <Link href={`/admin/paginas/${p.id}`} className="flex-1 font-medium hover:text-gold-3">
              {p.title}
              <span className="ml-2 text-xs text-muted">/{p.slug}</span>
            </Link>
            <span className={`rounded px-2 py-0.5 text-[11px] uppercase ${p.published ? "bg-emerald-100 text-emerald-700" : "bg-ink/10 text-ink-soft"}`}>
              {p.published ? "Pública" : "Oculta"}
            </span>
            <form action={deletePage.bind(null, p.id)}>
              <button className="px-2 text-muted hover:text-red-600" title="Borrar">✕</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
