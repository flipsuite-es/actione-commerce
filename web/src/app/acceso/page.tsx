import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getSettings } from "@/lib/data";
import { ACCESS_COOKIE, ACCESS_VALUE } from "@/lib/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Acceso · Oucy Studios" };

async function verify(formData: FormData) {
  "use server";
  const code = String(formData.get("code") || "").trim();
  const settings = await getSettings();
  if (code && code === settings.access_code) {
    cookies().set(ACCESS_COOKIE, ACCESS_VALUE, {
      path: "/",
      maxAge: 60 * 60 * 24 * 60, // 60 días
      sameSite: "lax",
    });
    redirect("/");
  }
  redirect("/acceso?error=1");
}

export default async function AccesoPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams?.error;
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <Image
          src="/logo.png"
          alt="Oucy Studios"
          width={220}
          height={Math.round((220 * 960) / 3665)}
          className="mx-auto"
          priority
        />
        <div className="hairline mx-auto mt-8" />
        <p className="mt-6 text-[11px] uppercase tracking-[0.4em] text-gold-3">
          Acceso anticipado
        </p>
        <h1 className="mt-4 font-serif text-3xl italic">
          Estamos preparando algo bonito.
        </h1>
        <p className="mt-3 text-muted">
          Introduce tu código de acceso para entrar antes del lanzamiento.
        </p>

        <form action={verify} className="mx-auto mt-8 max-w-xs">
          <input
            name="code"
            placeholder="Código de acceso"
            className="input text-center"
            autoFocus
            required
          />
          {error && (
            <p className="mt-3 text-sm text-red-600">
              Código incorrecto. Inténtalo de nuevo.
            </p>
          )}
          <button type="submit" className="btn-gold mt-4 w-full">
            Entrar
          </button>
        </form>

        <p className="mt-8 text-[11px] uppercase tracking-[0.16em] text-muted">
          Oucy Studios · Próximamente
        </p>
      </div>
    </div>
  );
}
