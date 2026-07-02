import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <p className="kicker">Error 404</p>
        <h1 className="heading mt-4 text-5xl italic">Esta página no existe.</h1>
        <p className="mt-4 text-muted">Puede que la joya que buscabas ya no esté disponible.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn-gold">Volver al inicio</Link>
          <Link href="/tienda" className="btn-outline">Ver la colección</Link>
        </div>
      </div>
    </div>
  );
}
