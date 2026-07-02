"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function EntrarPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <div className="container-lux flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="kicker">Tu cuenta</p>
          <h1 className="heading mt-3 text-4xl">
            {tab === "login" ? "Bienvenida de nuevo" : "Crea tu cuenta"}
          </h1>
        </div>

        <div className="mt-8 flex justify-center gap-1">
          <Tab active={tab === "login"} onClick={() => setTab("login")}>
            Entrar
          </Tab>
          <Tab active={tab === "register"} onClick={() => setTab("register")}>
            Crear cuenta
          </Tab>
        </div>

        {tab === "login" ? (
          <LoginForm onDone={() => router.push("/cuenta")} />
        ) : (
          <RegisterForm />
        )}

        <p className="mt-6 text-center text-sm text-muted">
          Al continuar aceptas nuestra{" "}
          <Link href="/pagina/privacidad" className="text-gold-3 hover:text-gold">
            política de privacidad
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-xs uppercase tracking-[0.16em] transition ${
        active
          ? "border-b-2 border-gold text-ink"
          : "border-b-2 border-transparent text-muted hover:text-gold-3"
      }`}
    >
      {children}
    </button>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card mt-6 space-y-4 p-6 sm:p-8">
      <div>
        <label className="label">Correo</label>
        <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="label">Contraseña</label>
        <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-gold w-full" disabled={busy}>
        {busy ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [check, setCheck] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setBusy(true);
    setError("");
    const supabase = createSupabaseBrowser();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
      },
    });
    setBusy(false);
    if (error) {
      setError(
        error.message.includes("already")
          ? "Ya existe una cuenta con ese correo. Inicia sesión."
          : "No se pudo crear la cuenta. Inténtalo de nuevo.",
      );
      return;
    }
    if (data.session) {
      router.push("/cuenta");
      router.refresh();
    } else {
      setCheck(true);
    }
  }

  if (check) {
    return (
      <div className="card mt-6 p-8 text-center">
        <p className="gold-text font-serif text-2xl">¡Casi está! ✦</p>
        <p className="mt-3 text-ink-soft">
          Te hemos enviado un correo a <b>{email}</b> para confirmar tu cuenta.
          Ábrelo y pulsa el enlace para entrar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card mt-6 space-y-4 p-6 sm:p-8">
      <div>
        <label className="label">Nombre</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="label">Correo</label>
        <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="label">Contraseña</label>
        <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-gold w-full" disabled={busy}>
        {busy ? "Creando…" : "Crear cuenta"}
      </button>
    </form>
  );
}
