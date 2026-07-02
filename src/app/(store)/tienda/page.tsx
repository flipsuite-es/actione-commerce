import ShopBrowser from "@/components/ShopBrowser";
import Reveal from "@/components/Reveal";
import { getActiveProducts, getCategories } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tienda · Oucy Studios" };

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: { q?: string; cat?: string };
}) {
  const [products, categories] = await Promise.all([
    getActiveProducts(),
    getCategories(),
  ]);

  return (
    <div className="container-lux py-14">
      <Reveal className="mb-8 text-center">
        <div className="hairline mx-auto" />
        <h1 className="heading mt-4 text-4xl sm:text-5xl">La colección</h1>
        <p className="mt-2 text-muted">Todas nuestras piezas</p>
      </Reveal>

      {products.length === 0 ? (
        <p className="py-20 text-center text-muted">
          Muy pronto tendremos piezas disponibles aquí. ✦
        </p>
      ) : (
        <ShopBrowser
          products={products}
          categories={categories}
          initialCat={searchParams?.cat ?? ""}
          initialQuery={searchParams?.q ?? ""}
        />
      )}
    </div>
  );
}
