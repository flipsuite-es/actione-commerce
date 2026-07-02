"use client";

import { useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 *  Generador de firmas de email para el equipo Oucy Studios.
 *  Las firmas se construyen con tablas + estilos EN LÍNEA porque es lo
 *  único que respetan Gmail / Outlook / Apple Mail. Sin CSS externo,
 *  sin flexbox/grid, fuentes web-safe (Georgia + Arial).
 * ------------------------------------------------------------------ */

const GOLD = "#B08B32";
const GOLD_SOFT = "#C9A24B";
const INK = "#1a1610";
const TEXT = "#3a3222";
const MUTED = "#9a8c6a";

function esc(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function cleanHost(url: string) {
  return String(url || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}
function handle(h: string) {
  return String(h || "").trim().replace(/^@/, "");
}

export interface SigData {
  name: string;
  role: string;
  email: string;
  phone: string;
  web: string;
  instagram: string;
  tiktok: string;
  tagline: boolean;
  legal: boolean;
  logo: boolean;
  baseUrl: string;
}

function contactRow(label: string, value: string, href: string) {
  return `
    <tr>
      <td style="padding:1px 8px 1px 0;font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:${GOLD};vertical-align:middle;">${label}</td>
      <td style="padding:1px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${TEXT};vertical-align:middle;">
        <a href="${href}" style="color:${TEXT};text-decoration:none;">${value}</a>
      </td>
    </tr>`;
}

export function buildSignatureHtml(d: SigData): string {
  const name = esc(d.name || "Nombre Apellido");
  const role = esc(d.role || "Puesto");
  const email = esc(d.email || "nombre@oucystudios.com");
  const web = cleanHost(d.web || "oucystudios.com");
  const ig = handle(d.instagram);
  const tk = handle(d.tiktok);
  const base = cleanHost(d.baseUrl || "oucystudios.com");

  const rows: string[] = [];
  rows.push(contactRow("Email", email, `mailto:${email}`));
  if (d.phone.trim())
    rows.push(
      contactRow("Tel", esc(d.phone), `tel:${d.phone.replace(/[^\d+]/g, "")}`),
    );
  rows.push(contactRow("Web", web, `https://${web}`));
  if (ig)
    rows.push(contactRow("IG", `@${esc(ig)}`, `https://instagram.com/${esc(ig)}`));
  if (tk)
    rows.push(contactRow("TikTok", `@${esc(tk)}`, `https://tiktok.com/@${esc(tk)}`));

  const brandCell = d.logo
    ? `<img src="https://${base}/logo.png" alt="Oucy Studios" width="150" style="display:block;border:0;outline:none;margin-bottom:8px;">`
    : `<div style="font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1;color:${INK};letter-spacing:0.5px;">Oucy<span style="color:${GOLD_SOFT};font-style:italic;">&nbsp;Studios</span></div>
       <div style="font-family:Arial,Helvetica,sans-serif;font-size:8.5px;letter-spacing:3px;text-transform:uppercase;color:${MUTED};margin-top:5px;">Joyería de acero dorado</div>`;

  const tagline = d.tagline
    ? `<tr><td colspan="2" style="padding-top:12px;">
         <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:12px;color:${GOLD};">
           <span style="color:${GOLD_SOFT};">&#10022;</span>&nbsp;Joyas que duran, no se oxidan.
         </div>
       </td></tr>`
    : "";

  const legal = d.legal
    ? `<tr><td colspan="2" style="padding-top:10px;">
         <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:1.5;color:#b3a888;">
           Este mensaje y sus adjuntos son confidenciales y de uso exclusivo del destinatario. Si lo has recibido por error, avísanos y elimínalo. Por favor, piensa en el medioambiente antes de imprimir.
         </div>
       </td></tr>`
    : "";

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;background:#ffffff;">
  <tr>
    <td style="padding:4px 20px 4px 4px;border-right:2px solid ${GOLD_SOFT};vertical-align:top;">
      ${brandCell}
    </td>
    <td style="padding:2px 0 2px 20px;vertical-align:top;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
        <tr><td colspan="2" style="font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:bold;color:${INK};padding-bottom:1px;">${name}</td></tr>
        <tr><td colspan="2" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};padding-bottom:9px;">${role}</td></tr>
        ${rows.join("")}
        ${tagline}
        ${legal}
      </table>
    </td>
  </tr>
</table>`;
}

const FIELD =
  "w-full border border-gold/40 bg-white/70 px-4 py-2.5 text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 placeholder:text-[#b6ab92]";

export default function SignatureBuilder() {
  const [d, setD] = useState<SigData>({
    name: "",
    role: "",
    email: "",
    phone: "",
    web: "oucystudios.com",
    instagram: "oucystudios",
    tiktok: "oucystudios",
    tagline: true,
    legal: true,
    logo: false,
    baseUrl: "oucystudios.com",
  });
  const [msg, setMsg] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => buildSignatureHtml(d), [d]);
  const set = (k: keyof SigData, v: string | boolean) =>
    setD((prev) => ({ ...prev, [k]: v }));

  function flash(t: string) {
    setMsg(t);
    window.setTimeout(() => setMsg(""), 3500);
  }

  async function copyRich() {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([html.replace(/<[^>]+>/g, " ")], {
            type: "text/plain",
          }),
        }),
      ]);
      flash("✦ Firma copiada. Pégala en los ajustes de firma de tu correo.");
    } catch {
      // Fallback: seleccionar el nodo renderizado y copiar.
      const node = previewRef.current;
      if (!node) return;
      const range = document.createRange();
      range.selectNodeContents(node);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      try {
        document.execCommand("copy");
        flash("✦ Firma copiada. Pégala en tu correo.");
      } catch {
        flash("No se pudo copiar automáticamente; usa «Copiar HTML».");
      }
      sel?.removeAllRanges();
    }
  }

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(html);
      flash("Código HTML copiado.");
    } catch {
      flash("No se pudo copiar el HTML.");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
      {/* Formulario */}
      <div className="space-y-4">
        <Field label="Nombre y apellidos">
          <input className={FIELD} value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej. Marta García" />
        </Field>
        <Field label="Puesto / cargo">
          <input className={FIELD} value={d.role} onChange={(e) => set("role", e.target.value)} placeholder="Ej. Atención al cliente" />
        </Field>
        <Field label="Email">
          <input className={FIELD} type="email" value={d.email} onChange={(e) => set("email", e.target.value)} placeholder="marta@oucystudios.com" />
        </Field>
        <Field label="Teléfono (opcional)">
          <input className={FIELD} value={d.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+34 600 000 000" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Instagram">
            <input className={FIELD} value={d.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="oucystudios" />
          </Field>
          <Field label="TikTok">
            <input className={FIELD} value={d.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="oucystudios" />
          </Field>
        </div>
        <Field label="Web">
          <input className={FIELD} value={d.web} onChange={(e) => set("web", e.target.value)} placeholder="oucystudios.com" />
        </Field>

        <div className="space-y-2 border-t border-gold/15 pt-4">
          <Toggle checked={d.tagline} onChange={(v) => set("tagline", v)} label="Incluir eslogan («Joyas que duran…»)" />
          <Toggle checked={d.legal} onChange={(v) => set("legal", v)} label="Incluir aviso de confidencialidad" />
          <Toggle checked={d.logo} onChange={(v) => set("logo", v)} label="Usar el logo (imagen) en vez del texto" />
        </div>
        {d.logo && (
          <Field label="Dominio donde está alojado el logo">
            <input className={FIELD} value={d.baseUrl} onChange={(e) => set("baseUrl", e.target.value)} placeholder="oucystudios.com" />
            <p className="mt-1 text-xs text-muted">
              Usa el dominio ya publicado (p. ej. <b>oucystudios.vercel.app</b> hasta
              conectar el dominio) para que la imagen cargue en el correo.
            </p>
          </Field>
        )}
      </div>

      {/* Preview + acciones */}
      <div>
        <p className="label">Vista previa</p>
        <div className="overflow-x-auto rounded border border-gold/20 bg-white p-6 shadow-soft">
          <div ref={previewRef} dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={copyRich} className="btn-gold">
            Copiar firma
          </button>
          <button onClick={copyHtml} className="btn-outline">
            Copiar HTML
          </button>
          {msg && <span className="text-sm text-gold-3">{msg}</span>}
        </div>

        <details className="card mt-6 p-5 text-sm">
          <summary className="cursor-pointer font-medium">
            ¿Cómo la pongo en mi correo?
          </summary>
          <div className="mt-3 space-y-3 text-ink-soft">
            <p>
              <b>Gmail:</b> pulsa «Copiar firma», ve a{" "}
              <i>Ajustes → Ver todos los ajustes → General → Firma</i>, crea una
              firma y pega (Ctrl/Cmd + V). Guarda los cambios abajo.
            </p>
            <p>
              <b>Outlook:</b> <i>Archivo → Opciones → Correo → Firmas</i> (o{" "}
              <i>Ajustes → Correo → Redactar y responder</i> en la web), crea una
              nueva y pega.
            </p>
            <p>
              <b>Apple Mail:</b> <i>Mail → Ajustes → Firmas</i>. Desmarca «Usar
              siempre la fuente de mensajes predeterminada» y pega.
            </p>
            <p className="text-muted">
              Si al pegar se descoloca, usa «Copiar HTML» y pégalo en el modo de
              firma HTML del cliente (algunos lo tienen en avanzado).
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-gold-3"
      />
      {label}
    </label>
  );
}
