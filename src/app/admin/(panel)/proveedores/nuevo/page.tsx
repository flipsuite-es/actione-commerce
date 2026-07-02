import SupplierForm from "@/components/admin/SupplierForm";

export const dynamic = "force-dynamic";

export default function NewSupplierPage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl">Nuevo proveedor</h1>
      <SupplierForm />
    </div>
  );
}
