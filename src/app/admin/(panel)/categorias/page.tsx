import { getAllCategories } from "@/lib/admin-data";
import { saveCategory, deleteCategory, moveCategory } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categories = await getAllCategories();

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl">Categorías</h1>
      <p className="mb-6 mt-1 text-muted">Organiza tu catálogo por tipo de joya.</p>

      {/* Añadir */}
      <form action={saveCategory} className="card mb-8 flex items-end gap-3 p-5">
        <div className="flex-1">
          <label className="label">Nueva categoría</label>
          <input name="name" className="input" placeholder="Ej: Colgantes" required />
        </div>
        <div className="w-24">
          <label className="label">Orden</label>
          <input name="sort" type="number" className="input" defaultValue={categories.length + 1} />
        </div>
        <button className="btn-gold">Añadir</button>
      </form>

      {/* Lista */}
      <div className="card divide-y divide-gold/10">
        {categories.length === 0 && (
          <p className="px-5 py-8 text-center text-muted">Aún no hay categorías.</p>
        )}
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-5 py-3">
            <form action={saveCategory} className="flex flex-1 items-center gap-2">
              <input type="hidden" name="id" defaultValue={c.id} />
              <input name="name" defaultValue={c.name} className="input !py-2" />
              <input name="sort" type="number" defaultValue={c.sort} className="input w-20 !py-2" />
              <button className="btn-outline !px-4 !py-2">Guardar</button>
            </form>
            <form action={moveCategory.bind(null, c.id, -1)}>
              <button className="px-2 text-ink-soft hover:text-gold-3" title="Subir">↑</button>
            </form>
            <form action={moveCategory.bind(null, c.id, 1)}>
              <button className="px-2 text-ink-soft hover:text-gold-3" title="Bajar">↓</button>
            </form>
            <form action={deleteCategory.bind(null, c.id)}>
              <button className="px-2 text-muted hover:text-red-600" title="Borrar">✕</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
