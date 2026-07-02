import ProductForm from "@/components/admin/ProductForm";
import { getAllCategories, getAllSuppliers } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, suppliers] = await Promise.all([
    getAllCategories(),
    getAllSuppliers(),
  ]);
  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl">Nuevo producto</h1>
      <ProductForm categories={categories} suppliers={suppliers} />
    </div>
  );
}
