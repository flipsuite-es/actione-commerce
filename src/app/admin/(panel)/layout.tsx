import Link from "next/link";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import { signOut } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel · Oucy Studios" };

const nav = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/ajustes", label: "Ajustes" },
];

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: User | null = null;
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase no configurado o sesión inválida → tratar como no autenticado.
    user = null;
  }
  if (!user) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-ivory md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-gold/20 bg-white/60 md:border-b-0 md:border-r">
        <div className="px-6 py-6">
          <p className="font-serif text-2xl">Oucy</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
            Backoffice
          </p>
        </div>
        <nav className="flex gap-1 px-3 pb-4 md:flex-col">
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
        <div className="hidden px-6 py-4 md:block">
          <p className="mb-2 truncate text-xs text-muted">{user.email}</p>
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
