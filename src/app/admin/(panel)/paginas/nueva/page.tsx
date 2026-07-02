import PageForm from "@/components/admin/PageForm";

export const dynamic = "force-dynamic";

export default function NuevaPaginaPage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl">Nueva página</h1>
      <PageForm />
    </div>
  );
}
