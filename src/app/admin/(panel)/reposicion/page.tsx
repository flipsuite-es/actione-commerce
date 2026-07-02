import { getAllProducts, getAllSuppliers } from "@/lib/admin-data";
import RestockAssistant, {
  type RestockGroup,
} from "@/components/admin/RestockAssistant";
import { aiConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";

const LOW_STOCK = 3; // umbral de "stock bajo"

export default async function RestockPage() {
  const [products, suppliers] = await Promise.all([
    getAllProducts(),
    getAllSuppliers(),
  ]);
  const supplierById = new Map(suppliers.map((s) => [s.id, s]));

  const low = products.filter((p) => p.stock <= LOW_STOCK);

  // Agrupar por proveedor (los sin proveedor van a un grupo aparte).
  const bySupplier = new Map<string, RestockGroup>();
  for (const p of low) {
    const key = p.supplier_id ?? "none";
    if (!bySupplier.has(key)) {
      const s = p.supplier_id ? supplierById.get(p.supplier_id) : null;
      bySupplier.set(key, {
        supplierId: s?.id ?? null,
        supplierName: s?.name ?? "Sin proveedor asignado",
        contactName: s?.contact_name ?? null,
        email: s?.email ?? null,
        items: [],
      });
    }
    bySupplier.get(key)!.items.push({
      id: p.id,
      name: p.name,
      ref: p.supplier_ref,
      stock: p.stock,
    });
  }
  // Proveedores reales primero; "sin proveedor" al final.
  const groups = Array.from(bySupplier.values()).sort((a, b) => {
    if (!a.supplierId) return 1;
    if (!b.supplierId) return -1;
    return a.supplierName.localeCompare(b.supplierName);
  });

  return (
    <div>
      <h1 className="font-serif text-3xl">Reposición</h1>
      <p className="mb-6 mt-1 max-w-2xl text-muted">
        Piezas con stock bajo (≤ {LOW_STOCK}), agrupadas por proveedor. La IA
        redacta por ti el correo de pedido para cada proveedor; tú lo revisas,
        ajustas y envías.
      </p>

      {!aiConfigured() && (
        <div className="mb-6 rounded border border-gold/30 bg-gold/5 p-4 text-sm text-ink-soft">
          Añade <code>ANTHROPIC_API_KEY</code> en Vercel para redactar los pedidos
          con IA. Mientras tanto puedes ver aquí qué reponer y a qué proveedor.
        </div>
      )}

      <RestockAssistant groups={groups} />
    </div>
  );
}
