"use client";

import { useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 *  Generador de firmas de email para el equipo Oucy Studios.
 *  Tablas + estilos EN LÍNEA (lo único que respetan Gmail/Outlook/
 *  Apple Mail). Sin CSS externo, sin flexbox/grid. Fuentes web-safe
 *  (Georgia + Arial). Cuatro plantillas brandeadas a elegir.
 * ------------------------------------------------------------------ */

const GOLD = "#B08B32";
const GOLD_SOFT = "#C9A24B";
const INK = "#1a1610";
const TEXT = "#3a3222";
const MUTED = "#9a8c6a";

type Template = "classic" | "stacked" | "compact" | "banner";

export interface SigData {
  template: Template;
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

function esc(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
const host = (u: string) =>
  String(u || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
const handle = (h: string) => String(h || "").trim().replace(/^@/, "");
const tel = (p: string) => p.replace(/[^\d+]/g, "");

function vals(d: SigData) {
  return {
    name: esc(d.name || "Nombre Apellido"),
    role: esc(d.role || "Puesto"),
    email: esc(d.email || "nombre@oucystudios.com"),
    phone: d.phone.trim(),
    web: host(d.web || "oucystudios.com"),
    ig: handle(d.instagram),
    tk: handle(d.tiktok),
    base: host(d.baseUrl || "oucystudios.com"),
  };
}

function wordmark(size: number) {
  return `<span style="font-family:Georgia,'Times New Roman',serif;font-size:${size}px;line-height:1;color:${INK};letter-spacing:0.5px;">Oucy<span style="color:${GOLD_SOFT};font-style:italic;">&nbsp;Studios</span></span>`;
}
function brandBlock(d: SigData, opts: { center?: boolean; size?: number } = {}) {
  const { base } = vals(d);
  const size = opts.size ?? 23;
  if (d.logo) {
    return `<img src="https://${base}/logo.png" alt="Oucy Studios" width="${opts.center ? 170 : 150}" style="display:block;border:0;outline:none;${opts.center ? "margin:0 auto 8px;" : "margin-bottom:8px;"}">`;
  }
  return `<div${opts.center ? ' style="text-align:center;"' : ""}>${wordmark(size)}</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:8.5px;letter-spacing:3px;text-transform:uppercase;color:${MUTED};margin-top:5px;${opts.center ? "text-align:center;" : ""}">Joyería de acero dorado</div>`;
}

function contactRow(label: string, value: string, href: string) {
  return `<tr>
    <td style="padding:1px 8px 1px 0;font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:${GOLD};vertical-align:middle;white-space:nowrap;">${label}</td>
    <td style="padding:1px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${TEXT};vertical-align:middle;"><a href="${href}" style="color:${TEXT};text-decoration:none;">${value}</a></td>
  </tr>`;
}
function contactRows(d: SigData) {
  const v = vals(d);
  const r: string[] = [contactRow("Email", v.email, `mailto:${v.email}`)];
  if (v.phone) r.push(contactRow("Tel", esc(v.phone), `tel:${tel(v.phone)}`));
  r.push(contactRow("Web", v.web, `https://${v.web}`));
  if (v.ig) r.push(contactRow("IG", `@${esc(v.ig)}`, `https://instagram.com/${esc(v.ig)}`));
  if (v.tk) r.push(contactRow("TikTok", `@${esc(v.tk)}`, `https://tiktok.com/@${esc(v.tk)}`));
  return r.join("");
}
function inlineContact(d: SigData, color = TEXT) {
  const v = vals(d);
  const dot = ` <span style="color:${GOLD_SOFT};">&middot;</span> `;
  const p = [`<a href="mailto:${v.email}" style="color:${color};text-decoration:none;">${v.email}</a>`];
  if (v.phone) p.push(`<a href="tel:${tel(v.phone)}" style="color:${color};text-decoration:none;">${esc(v.phone)}</a>`);
  p.push(`<a href="https://${v.web}" style="color:${color};text-decoration:none;">${v.web}</a>`);
  return p.join(dot);
}
function socialInline(d: SigData) {
  const v = vals(d);
  const dot = ` <span style="color:${GOLD_SOFT};">&middot;</span> `;
  const p: string[] = [];
  if (v.ig) p.push(`<a href="https://instagram.com/${esc(v.ig)}" style="color:${GOLD};text-decoration:none;">@${esc(v.ig)}</a>`);
  if (v.tk) p.push(`<a href="https://tiktok.com/@${esc(v.tk)}" style="color:${GOLD};text-decoration:none;">@${esc(v.tk)} · TikTok</a>`);
  return p.join(dot);
}
function taglineRow(colspan = 2) {
  return `<tr><td colspan="${colspan}" style="padding-top:12px;"><div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:12px;color:${GOLD};"><span style="color:${GOLD_SOFT};">&#10022;</span>&nbsp;Joyas que duran, no se oxidan.</div></td></tr>`;
}
function legalRow(colspan = 2) {
  return `<tr><td colspan="${colspan}" style="padding-top:10px;"><div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:1.5;color:#b3a888;">Este mensaje y sus adjuntos son confidenciales y de uso exclusivo del destinatario. Si lo has recibido por error, avísanos y elimínalo. Por favor, piensa en el medioambiente antes de imprimir.</div></td></tr>`;
}
function ctaBar(d: SigData) {
  const v = vals(d);
  return `<a href="https://${v.web}" style="display:block;background:${GOLD_SOFT};color:#3a2d10;text-decoration:none;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:10px 12px;">&#10022;&nbsp; Descubre la colección &nbsp;&middot;&nbsp; ${v.web}</a>`;
}

/* -------------------- Plantillas -------------------- */

function buildClassic(d: SigData, banner = false) {
  const v = vals(d);
  const body = `<tr>
    <td style="padding:4px 20px 4px 4px;border-right:2px solid ${GOLD_SOFT};vertical-align:top;">${brandBlock(d)}</td>
    <td style="padding:2px 0 2px 20px;vertical-align:top;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
        <tr><td colspan="2" style="font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:bold;color:${INK};padding-bottom:1px;">${v.name}</td></tr>
        <tr><td colspan="2" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};padding-bottom:9px;">${v.role}</td></tr>
        ${contactRows(d)}
        ${d.tagline ? taglineRow() : ""}
        ${d.legal ? legalRow() : ""}
      </table>
    </td>
  </tr>`;
  const bannerRow = banner ? `<tr><td colspan="2" style="padding-top:14px;">${ctaBar(d)}</td></tr>` : "";
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;background:#ffffff;">${body}${bannerRow}</table>`;
}

function buildStacked(d: SigData) {
  const v = vals(d);
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" width="460" style="border-collapse:collapse;background:#ffffff;text-align:center;">
    <tr><td style="padding:4px 10px 0;text-align:center;">${brandBlock(d, { center: true })}</td></tr>
    <tr><td style="padding:0;"><div style="width:120px;height:2px;background:${GOLD_SOFT};margin:12px auto;line-height:2px;font-size:0;">&nbsp;</div></td></tr>
    <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:bold;color:${INK};">${v.name}</td></tr>
    <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};padding:4px 0 10px;">${v.role}</td></tr>
    <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${TEXT};line-height:1.7;">${inlineContact(d)}</td></tr>
    ${socialInline(d) ? `<tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;padding-top:2px;">${socialInline(d)}</td></tr>` : ""}
    ${d.tagline ? `<tr><td style="padding-top:12px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:12px;color:${GOLD};"><span style="color:${GOLD_SOFT};">&#10022;</span>&nbsp;Joyas que duran, no se oxidan.</td></tr>` : ""}
    ${d.legal ? `<tr><td style="padding-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:1.5;color:#b3a888;">Este mensaje y sus adjuntos son confidenciales y de uso exclusivo del destinatario. Si lo has recibido por error, avísanos y elimínalo.</td></tr>` : ""}
  </table>`;
}

function buildCompact(d: SigData) {
  const v = vals(d);
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;background:#ffffff;">
    <tr>
      <td style="padding:2px 14px 2px 2px;border-right:2px solid ${GOLD_SOFT};vertical-align:middle;">${wordmark(17)}</td>
      <td style="padding:2px 0 2px 14px;vertical-align:middle;">
        <div><span style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-weight:bold;color:${INK};">${v.name}</span><span style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};">&nbsp;&nbsp;${v.role}</span></div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${TEXT};margin-top:4px;line-height:1.5;">${inlineContact(d)}</div>
      </td>
    </tr>
  </table>`;
}

export function buildSignatureHtml(d: SigData): string {
  switch (d.template) {
    case "stacked":
      return buildStacked(d);
    case "compact":
      return buildCompact(d);
    case "banner":
      return buildClassic(d, true);
    default:
      return buildClassic(d, false);
  }
}

/* -------------------- UI -------------------- */

const FIELD =
  "w-full border border-gold/40 bg-white/70 px-4 py-2.5 text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 placeholder:text-[#b6ab92]";

const TEMPLATES: { key: Template; label: string; hint: string }[] = [
  { key: "classic", label: "Clásica", hint: "Logo a un lado y datos al otro" },
  { key: "stacked", label: "Centrada", hint: "Elegante y vertical" },
  { key: "compact", label: "Compacta", hint: "Mínima, de una línea" },
  { key: "banner", label: "Con botón", hint: "Con llamada a la tienda" },
];

export default function SignatureBuilder() {
  const [d, setD] = useState<SigData>({
    template: "classic",
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
          "text/plain": new Blob([html.replace(/<[^>]+>/g, " ")], { type: "text/plain" }),
        }),
      ]);
      flash("✦ Firma copiada. Pégala en los ajustes de firma de tu correo.");
    } catch {
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

  const isCompact = d.template === "compact";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
      {/* Formulario */}
      <div className="space-y-4">
        <div>
          <span className="label">Plantilla</span>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => set("template", t.key)}
                className={`rounded border px-3 py-2 text-left transition ${
                  d.template === t.key
                    ? "border-gold bg-gold/10"
                    : "border-gold/25 hover:border-gold/50 hover:bg-gold/5"
                }`}
              >
                <span className="block text-sm font-medium text-ink">{t.label}</span>
                <span className="block text-[11px] text-muted">{t.hint}</span>
              </button>
            ))}
          </div>
        </div>

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
          <Toggle checked={d.tagline} onChange={(v) => set("tagline", v)} label="Incluir eslogan («Joyas que duran…»)" disabled={isCompact} />
          <Toggle checked={d.legal} onChange={(v) => set("legal", v)} label="Incluir aviso de confidencialidad" disabled={isCompact} />
          <Toggle checked={d.logo} onChange={(v) => set("logo", v)} label="Usar el logo (imagen) en vez del texto" disabled={isCompact} />
        </div>
        {isCompact && (
          <p className="text-xs text-muted">
            La plantilla compacta omite eslogan, aviso legal y logo para mantenerse
            mínima.
          </p>
        )}
        {d.logo && !isCompact && (
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
          <button onClick={copyRich} className="btn-gold">Copiar firma</button>
          <button onClick={copyHtml} className="btn-outline">Copiar HTML</button>
          {msg && <span className="text-sm text-gold-3">{msg}</span>}
        </div>

        <details className="card mt-6 p-5 text-sm">
          <summary className="cursor-pointer font-medium">¿Cómo la pongo en mi correo?</summary>
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
              firma HTML del cliente.
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
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center gap-2 text-sm ${disabled ? "cursor-not-allowed text-muted/60" : "cursor-pointer text-ink-soft"}`}>
      <input
        type="checkbox"
        checked={checked && !disabled}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-gold-3"
      />
      {label}
    </label>
  );
}
