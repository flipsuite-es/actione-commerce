"use client";

import { useState } from "react";
import { saveVaultEntry, deleteVaultEntry } from "@/app/admin/actions";
import type { VaultEntry } from "@/lib/types";

const EMPTY = { id: "", title: "", url: "", username: "", password: "", notes: "" };

type GenOpts = {
  len: number;
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
};

function generatePassword(o: GenOpts): string {
  let chars = "";
  if (o.lower) chars += "abcdefghijkmnopqrstuvwxyz";
  if (o.upper) chars += "ABCDEFGHJKLMNPQRSTUVWXYZ";
  if (o.numbers) chars += "23456789";
  if (o.symbols) chars += "!@#$%&*?-_=+.";
  if (!chars) chars = "abcdefghijkmnopqrstuvwxyz";
  const len = Math.max(6, Math.min(64, o.len || 16));
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

function strength(pw: string): { label: string; pct: number; cls: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 14) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (!pw) return { label: "—", pct: 0, cls: "bg-ink/20" };
  if (s <= 2) return { label: "Débil", pct: 33, cls: "bg-red-500" };
  if (s <= 3) return { label: "Aceptable", pct: 66, cls: "bg-amber-500" };
  return { label: "Fuerte", pct: 100, cls: "bg-emerald-500" };
}

export default function VaultManager({
  entries,
  keyConfigured,
}: {
  entries: VaultEntry[];
  keyConfigured: boolean;
}) {
  const [f, setF] = useState(EMPTY);
  const [showPw, setShowPw] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState("");
  const [gen, setGen] = useState<GenOpts>({
    len: 16,
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
  });
  const editing = Boolean(f.id);
  const st = strength(f.password);

  const set = (k: keyof typeof EMPTY, v: string) => setF((p) => ({ ...p, [k]: v }));
  const setG = (k: keyof GenOpts, v: number | boolean) =>
    setGen((p) => ({ ...p, [k]: v }));

  function editEntry(e: VaultEntry) {
    setF({
      id: e.id,
      title: e.title,
      url: e.url ?? "",
      username: e.username ?? "",
      password: e.password,
      notes: e.notes ?? "",
    });
    setShowPw(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function copy(text: string, id: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(""), 1500);
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,400px)_1fr]">
      {/* Formulario + generador */}
      <div>
        {!keyConfigured && (
          <div className="mb-4 border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
            <b>Cifrado básico activo.</b> Para cifrado fuerte, añade una variable{" "}
            <code>VAULT_KEY</code> (30+ caracteres aleatorios) en Vercel → Settings →
            Environment Variables, y redepliega. Las contraseñas se guardan cifradas
            igualmente, pero con <code>VAULT_KEY</code> propia solo tú puedes
            descifrarlas.
          </div>
        )}

        <form
          action={async (fd) => {
            await saveVaultEntry(fd);
            setF(EMPTY);
            setShowPw(false);
          }}
          className="card space-y-4 p-6"
        >
          <input type="hidden" name="id" value={f.id} />
          <h2 className="font-serif text-xl">
            {editing ? "Editar entrada" : "Nueva entrada"}
          </h2>

          <div>
            <label className="label">Título</label>
            <input name="title" className="input" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Ej. Instagram Oucy" required />
          </div>
          <div>
            <label className="label">Usuario / correo</label>
            <input name="username" className="input" value={f.username} onChange={(e) => set("username", e.target.value)} />
          </div>

          <div>
            <label className="label">Contraseña</label>
            <div className="flex gap-2">
              <input
                name="password"
                type={showPw ? "text" : "password"}
                className="input font-mono"
                value={f.password}
                onChange={(e) => set("password", e.target.value)}
              />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="btn-outline !px-3" title={showPw ? "Ocultar" : "Mostrar"}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
            {f.password && (
              <div className="mt-2 flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded bg-ink/10">
                  <span className={`block h-full ${st.cls}`} style={{ width: `${st.pct}%` }} />
                </span>
                <span className="text-[11px] uppercase tracking-wider text-muted">{st.label}</span>
              </div>
            )}
          </div>

          {/* Generador */}
          <div className="rounded border border-gold/25 bg-gold/5 p-4">
            <div className="flex items-center justify-between">
              <span className="label !mb-0">Generador</span>
              <button type="button" onClick={() => { set("password", generatePassword(gen)); setShowPw(true); }} className="btn-gold !px-4 !py-1.5 !text-[11px]">
                Generar
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input type="range" min={8} max={40} value={gen.len} onChange={(e) => setG("len", Number(e.target.value))} className="flex-1 accent-gold-3" />
              <span className="w-8 text-right text-sm tabular-nums">{gen.len}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-ink-soft">
              <Check label="Mayúsculas" checked={gen.upper} onChange={(v) => setG("upper", v)} />
              <Check label="Minúsculas" checked={gen.lower} onChange={(v) => setG("lower", v)} />
              <Check label="Números" checked={gen.numbers} onChange={(v) => setG("numbers", v)} />
              <Check label="Símbolos" checked={gen.symbols} onChange={(v) => setG("symbols", v)} />
            </div>
          </div>

          <div>
            <label className="label">Web (opcional)</label>
            <input name="url" className="input" value={f.url} onChange={(e) => set("url", e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <label className="label">Notas (opcional)</label>
            <textarea name="notes" rows={2} className="input" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>

          <div className="flex gap-3">
            <button className="btn-gold">{editing ? "Guardar cambios" : "Guardar"}</button>
            {editing && (
              <button type="button" onClick={() => { setF(EMPTY); setShowPw(false); }} className="btn-ghost">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista */}
      <div>
        <h2 className="font-serif text-xl">Guardadas ({entries.length})</h2>
        {entries.length === 0 ? (
          <div className="card mt-4 p-10 text-center text-muted">
            Aún no has guardado ninguna contraseña.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {entries.map((e) => (
              <div key={e.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{e.title}</p>
                    {e.url && (
                      <a href={e.url} target="_blank" rel="noopener" className="text-xs text-gold-3 hover:text-gold">
                        {e.url.replace(/^https?:\/\//, "")} ↗
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-3 text-xs uppercase tracking-wider">
                    <button onClick={() => editEntry(e)} className="text-ink-soft hover:text-gold-3">Editar</button>
                    <form action={deleteVaultEntry.bind(null, e.id)}>
                      <button onClick={(ev) => { if (!confirm(`¿Borrar "${e.title}"?`)) ev.preventDefault(); }} className="text-muted hover:text-red-600">
                        Borrar
                      </button>
                    </form>
                  </div>
                </div>

                <dl className="mt-3 space-y-1.5 text-sm">
                  {e.username && (
                    <Field label="Usuario" value={e.username} onCopy={() => copy(e.username!, e.id + "u")} copied={copied === e.id + "u"} />
                  )}
                  <Field
                    label="Contraseña"
                    value={reveal[e.id] ? e.password : "•".repeat(Math.min(12, e.password.length || 8))}
                    mono
                    onCopy={() => copy(e.password, e.id + "p")}
                    copied={copied === e.id + "p"}
                    onToggle={() => setReveal((r) => ({ ...r, [e.id]: !r[e.id] }))}
                    revealed={!!reveal[e.id]}
                  />
                </dl>
                {e.notes && <p className="mt-2 whitespace-pre-wrap text-xs text-muted">{e.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-gold-3" />
      {label}
    </label>
  );
}

function Field({
  label,
  value,
  mono,
  onCopy,
  copied,
  onToggle,
  revealed,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy: () => void;
  copied: boolean;
  onToggle?: () => void;
  revealed?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="flex items-center gap-2">
        <span className={mono ? "font-mono" : ""}>{value}</span>
        {onToggle && (
          <button onClick={onToggle} className="text-xs text-ink-soft hover:text-gold-3" title={revealed ? "Ocultar" : "Mostrar"}>
            {revealed ? "🙈" : "👁"}
          </button>
        )}
        <button onClick={onCopy} className="text-xs uppercase tracking-wider text-gold-3 hover:text-gold">
          {copied ? "✓" : "Copiar"}
        </button>
      </dd>
    </div>
  );
}
