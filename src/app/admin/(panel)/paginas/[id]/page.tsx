import { notFound } from "next/navigation";
import PageForm from "@/components/admin/PageForm";
import { getPageByIdAdmin } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function EditarPaginaPage({ params }: { params: { id: string } }) {
  const page = await getPageByIdAdmin(params.id);
  if (!page) notFound();
  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl">Editar página</h1>
      <PageForm page={page} />
    </div>
  );
}
