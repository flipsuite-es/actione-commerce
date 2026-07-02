import Link from "next/link";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import { signOut } from "@/app/admin/actions";
import { getNotifications } from "@/lib/admin-data";
import NotificationBell from "@/components/admin/NotificationBell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel · Oucy Studios" };

const nav = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/soporte", label: "Soporte" },
  { href: "/admin/resenas", label: "Reseñas" },
  { href: "/admin/cupones", label: "Cupones" },
  { href: "/admin/paginas", label: "Páginas" },
  { href: "/admin/suscriptores", label: "Suscriptores" },
  { href: "/admin/firma", label: "Firmas" },
  { href: "/admin/vault", label: "Contraseñas" },
  { href: "/admin/ajustes", label: "Ajustes" },
];

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: User | null = null;
  let isAdmin = false;
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isAdmin = profile?.role === "admin";
    }
  } catch {
    user = null;
  }
  if (!user) redirect("/admin/login");
  if (!isAdmin) redirect("/cuenta");

  const { items: notifications, unread } = await getNotifications();

  return (
    <div className="min-h-screen bg-ivory md:grid md:grid-cols-[248px_1fr]">
      <aside className="border-b border-gold/20 bg-white/60 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="flex items-start justify-between px-6 py-6">
          <div>
            <p className="font-serif text-3xl">Oucy</p>
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Backoffice</p>
          </div>
          <NotificationBell initialItems={notifications} initialUnread={unread} />
        </div>
        <nav className="flex flex-wrap gap-1 px-3 pb-4 md:flex-col md:flex-nowrap">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded px-3 py-2 text-sm text-ink-soft transition hover:bg-gold/10 hover:text-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-2 border-t border-gold/10 px-6 py-4 md:mt-auto">
          <Link href="/" target="_blank" className="text-xs uppercase tracking-[0.14em] text-gold-3 hover:text-gold">
            Ver tienda ↗
          </Link>
          <p className="mb-2 mt-3 truncate text-xs text-muted">{user.email}</p>
          <form action={signOut}>
            <button className="text-xs uppercase tracking-[0.16em] text-muted hover:text-gold-3">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="p-6 md:p-10">{children}</main>
    </div>
  );
}
