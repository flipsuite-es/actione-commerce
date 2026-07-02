import ProductCard from "@/components/ProductCard";
import { getActiveProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tienda · Oucy Studios" };

export default async function TiendaPage() {
  const products = await getActiveProducts();

  return (
    <div className="py-14">
      <div className="mb-10 text-center">
        <div className="hairline mx-auto" />
        <h1 className="mt-4 font-serif text-4xl">La colección</h1>
        <p className="mt-2 text-muted">
          Joyas doradas de acero · seleccionadas a mano
        </p>
      </div>

      {products.length === 0 ? (
        <p className="py-20 text-center text-muted">
          Muy pronto tendremos piezas disponibles aquí. ✦
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
