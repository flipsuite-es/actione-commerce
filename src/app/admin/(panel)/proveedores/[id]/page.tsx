import { notFound } from "next/navigation";
import SupplierForm from "@/components/admin/SupplierForm";
import { getSupplierById } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function EditSupplierPage({
  params,
}: {
  params: { id: string };
}) {
  const supplier = await getSupplierById(params.id);
  if (!supplier) notFound();
  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl">Editar proveedor</h1>
      <SupplierForm supplier={supplier} />
    </div>
  );
}
