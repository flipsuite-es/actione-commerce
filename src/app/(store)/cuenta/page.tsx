import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAuthUser, getMyProfile } from "@/lib/auth";
import { updateProfile, signOutCustomer } from "./actions";
import { euro } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "Recibido", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Pagado", cls: "bg-emerald-100 text-emerald-700" },
  shipped: { label: "Enviado", cls: "bg-sky-100 text-sky-700" },
  cancelled: { label: "Cancelado", cls: "bg-ink/10 text-ink-soft" },
};

export default async function CuentaPage() {
  const user = await getAuthUser();
  if (!user) redirect("/entrar");
  const profile = await getMyProfile();

  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .order("created_at", { ascending: false });
  const orders = (data as Order[]) ?? [];

  const name = profile?.full_name || user.email?.split("@")[0] || "";

  return (
    <div className="container-lux py-14 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Tu cuenta</p>
          <h1 className="heading mt-2 text-4xl sm:text-5xl">
            Hola{name ? `, ${name}` : ""}
          </h1>
        </div>
        <form action={signOutCustomer}>
          <button className="btn-ghost">Cerrar sesión</button>
        </form>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        {/* Perfil */}
        <div>
          <h2 className="font-serif text-2xl">Mis datos</h2>
          <form action={updateProfile} className="card mt-4 space-y-4 p-6">
            <div>
              <label className="label">Nombre</label>
              <input name="full_name" className="input" defaultValue={profile?.full_name ?? ""} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input name="phone" className="input" defaultValue={profile?.phone ?? ""} />
            </div>
            <div>
              <label className="label">Correo</label>
              <input className="input opacity-60" defaultValue={user.email ?? ""} disabled />
            </div>
            <button className="btn-gold">Guardar cambios</button>
          </form>
        </div>

        {/* Pedidos */}
        <div>
          <h2 className="font-serif text-2xl">Mis pedidos</h2>
          {orders.length === 0 ? (
            <div className="card mt-4 p-8 text-center text-muted">
              Aún no tienes pedidos.{" "}
              <Link href="/tienda" className="text-gold-3 hover:text-gold">
                Descubrir la colección
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {orders.map((o) => {
                const s = STATUS[o.status] ?? STATUS.pending;
                const ref = o.id.slice(0, 8).toUpperCase();
                return (
                  <div key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
                    <div>
                      <p className="font-mono text-xs tracking-widest text-muted">{ref}</p>
                      <p className="mt-1 text-sm">
                        {new Date(o.created_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                        {" · "}
                        {(o.items || []).reduce((n, i) => n + (i.qty || 0), 0)} artículo(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`rounded px-2 py-0.5 text-[11px] uppercase tracking-wider ${s.cls}`}>
                        {s.label}
                      </span>
                      <span className="font-serif text-lg">{euro(o.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-4 text-sm text-muted">
            ¿Una duda con un pedido?{" "}
            <Link href="/soporte" className="text-gold-3 hover:text-gold">
              Escríbenos por soporte
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
