import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { getProductById, getAllCategories, getAllSuppliers } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

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
      <ProductForm product={product} categories={categories} suppliers={suppliers} />
    </div>
  );
}
