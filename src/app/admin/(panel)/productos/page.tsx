import Link from "next/link";
import { getAllProducts } from "@/lib/admin-data";
import AdminProductList from "@/components/admin/AdminProductList";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAllProducts();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Productos</h1>
        <Link href="/admin/productos/nuevo" className="btn-gold">
          + Nuevo
        </Link>
      </div>
      <p className="mb-6 mt-1 text-muted">
        {products.length} producto{products.length === 1 ? "" : "s"}
      </p>
      <AdminProductList products={products} />
    </div>
  );
}
