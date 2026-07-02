import Link from "next/link";
import { savePage } from "@/app/admin/actions";
import type { Page } from "@/lib/types";

export default function PageForm({ page }: { page?: Page }) {
  return (
    <form action={savePage} className="max-w-2xl space-y-5">
      {page && <input type="hidden" name="id" defaultValue={page.id} />}
      <div>
        <label className="label">Título</label>
        <input name="title" className="input" defaultValue={page?.title} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Slug (URL)</label>
          <input name="slug" className="input" defaultValue={page?.slug} placeholder="envios" />
        </div>
        <div>
          <label className="label">Orden</label>
          <input name="sort" type="number" className="input" defaultValue={page?.sort ?? 0} />
        </div>
      </div>
      <div>
        <label className="label">Contenido</label>
        <textarea name="body" rows={12} className="input" defaultValue={page?.body} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={page?.published ?? true} />
        Publicada (visible en la tienda)
      </label>
      <div className="flex gap-3">
        <button className="btn-gold">Guardar página</button>
        <Link href="/admin/paginas" className="btn-outline">Cancelar</Link>
      </div>
    </form>
  );
}
