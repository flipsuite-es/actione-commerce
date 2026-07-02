"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Credenciales incorrectas.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="card w-full max-w-sm p-8">
        <p className="font-serif text-3xl">Oucy · Backoffice</p>
        <p className="mt-1 text-sm text-muted">Acceso de administración</p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="label">Correo</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="btn-gold mt-6 w-full">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
