import Link from "next/link";
import { getAllReviews } from "@/lib/admin-data";
import { setReviewApproved, deleteReview } from "@/app/admin/actions";
import Stars from "@/components/Stars";

export const dynamic = "force-dynamic";

export default async function ResenasPage() {
  let reviews = [] as Awaited<ReturnType<typeof getAllReviews>>;
  let ready = true;
  try {
    reviews = await getAllReviews();
  } catch {
    ready = false;
  }

  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl">Reseñas</h1>
      <p className="mb-6 mt-1 text-muted">
        {pending.length > 0
          ? `${pending.length} pendiente${pending.length === 1 ? "" : "s"} de aprobar.`
          : "Nada pendiente de moderar. ✦"}
      </p>

      {!ready && (
        <div className="mb-6 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Ejecuta la migración <b>005_resenas_suscriptores.sql</b> en Supabase para
          activar las reseñas.
        </div>
      )}

      {pending.length > 0 && (
        <>
          <h2 className="label mb-2">Pendientes</h2>
          <div className="mb-8 space-y-3">
            {pending.map((r) => (
              <ReviewRow key={r.id} r={r} pending />
            ))}
          </div>
        </>
      )}

      <h2 className="label mb-2">Publicadas</h2>
      {approved.length === 0 ? (
        <div className="card p-8 text-center text-muted">Aún no hay reseñas publicadas.</div>
      ) : (
        <div className="space-y-3">
          {approved.map((r) => (
            <ReviewRow key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewRow({
  r,
  pending = false,
}: {
  r: Awaited<ReturnType<typeof getAllReviews>>[number];
  pending?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Stars value={r.rating} />
          <span className="text-sm font-medium">{r.name}</span>
        </div>
        <span className="text-xs text-muted">
          {new Date(r.created_at).toLocaleDateString("es-ES")}
        </span>
      </div>
      {r.product && (
        <Link
          href={`/producto/${r.product.slug}`}
          target="_blank"
          className="mt-1 inline-block text-xs uppercase tracking-wider text-gold-3 hover:text-gold"
        >
          {r.product.name} ↗
        </Link>
      )}
      {r.body && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.body}</p>}
      <div className="mt-3 flex items-center gap-3">
        {pending ? (
          <form action={setReviewApproved.bind(null, r.id, true)}>
            <button className="btn-gold !px-4 !py-1.5 !text-[11px]">Aprobar</button>
          </form>
        ) : (
          <form action={setReviewApproved.bind(null, r.id, false)}>
            <button className="btn-outline !px-4 !py-1.5 !text-[11px]">Ocultar</button>
          </form>
        )}
        <form action={deleteReview.bind(null, r.id)}>
          <button className="text-xs uppercase tracking-wider text-muted hover:text-red-600">
            Borrar
          </button>
        </form>
      </div>
    </div>
  );
}
