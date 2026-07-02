import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { getProductById, getAllCategories } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, categories] = await Promise.all([
    getProductById(params.id),
    getAllCategories(),
  ]);
  if (!product) notFound();
  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl">Editar producto</h1>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
