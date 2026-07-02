import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { getProductById, getAllCategories, getAllSuppliers } from "@/lib/admin-data";
import { imageEditConfigured } from "@/lib/image-edit";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // el borrado de reflejo (editar + auditar) tarda

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, categories, suppliers] = await Promise.all([
    getProductById(params.id),
    getAllCategories(),
    getAllSuppliers(),
  ]);
  if (!product) notFound();
  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl">Editar producto</h1>
      <ProductForm
        product={product}
        categories={categories}
        suppliers={suppliers}
        imageEditEnabled={imageEditConfigured()}
      />
    </div>
  );
}
