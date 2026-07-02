import ProductForm from "@/components/admin/ProductForm";
import { getAllCategories, getAllSuppliers } from "@/lib/admin-data";
import { imageEditConfigured } from "@/lib/image-edit";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // el borrado de reflejo (editar + auditar) tarda

export default async function NewProductPage() {
  const [categories, suppliers] = await Promise.all([
    getAllCategories(),
    getAllSuppliers(),
  ]);
  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl">Nuevo producto</h1>
      <ProductForm
        categories={categories}
        suppliers={suppliers}
        imageEditEnabled={imageEditConfigured()}
      />
    </div>
  );
}
