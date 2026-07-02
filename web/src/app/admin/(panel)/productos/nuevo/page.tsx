import ProductForm from "@/components/admin/ProductForm";
import { getAllCategories } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getAllCategories();
  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl">Nuevo producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
