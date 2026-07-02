"use client";

import { useState } from "react";
import Link from "next/link";
import { draftRestock } from "@/app/admin/actions";

export interface RestockItem {
  id: string;
  name: string;
  ref: string | null;
  stock: number;
}
export interface RestockGroup {
  supplierId: string | null;
  supplierName: string;
  contactName: string | null;
  email: string | null;
  items: RestockItem[];
}

export default function RestockAssistant({ groups }: { groups: RestockGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className="card p-10 text-center text-muted">
        Todo con stock suficiente. No hay nada que reponer. ✦
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <GroupCard key={g.supplierId ?? "none"} group={g} />
      ))}
    </div>
  );
}

function GroupCard({ group }: { group: RestockGroup }) {
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const r = await draftRestock({
        supplierName: group.supplierName,
        contactName: group.contactName,
        items: group.items.map((i) => ({ name: i.name, ref: i.ref, stock: i.stock })),
      });
      if (!r.ok) setError(r.error);
      else setDraft(r.text);
    } catch (err: any) {
      setError(err?.message || "No se pudo redactar el pedido.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  const mailto =
    group.email && draft
      ? `mailto:${group.email}?subject=${encodeURIComponent(
          draft.split("\n")[0].replace(/^Asunto:\s*/i, "")
        )}&body=${encodeURIComponent(
          draft.replace(/^Asunto:.*\n?/i, "").trimStart()
        )}`
      : null;

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl">
            {group.supplierId ? (
              <Link
                href={`/admin/proveedores/${group.supplierId}`}
                className="hover:text-gold-3"
              >
                {group.supplierName}
              </Link>
            ) : (
              group.supplierName
            )}
          </h2>
          <p className="text-xs text-muted">
            {group.items.length} pieza{group.items.length === 1 ? "" : "s"} por reponer
            {group.email ? ` · ${group.email}` : ""}
          </p>
        </div>
        {group.supplierId && (
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="btn-gold text-sm disabled:opacity-50"
          >
            {loading ? "Redactando…" : "✨ Redactar pedido con IA"}
          </button>
        )}
      </div>

      <ul className="mt-4 divide-y divide-gold/10 text-sm">
        {group.items.map((i) => (
          <li key={i.id} className="flex items-center justify-between py-2">
            <Link href={`/admin/productos/${i.id}`} className="hover:text-gold-3">
              {i.name}
              {i.ref && <span className="ml-2 text-xs text-muted">ref. {i.ref}</span>}
            </Link>
            <span className={i.stock <= 0 ? "text-red-600" : "text-amber-600"}>
              {i.stock <= 0 ? "Agotado" : `Quedan ${i.stock}`}
            </span>
          </li>
        ))}
      </ul>

      {!group.supplierId && (
        <p className="mt-4 text-xs text-muted">
          Estas piezas no tienen proveedor asignado. Edítalas y asígnales uno para
          poder redactar el pedido automáticamente.
        </p>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {draft && (
        <div className="mt-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={10}
            className="input font-sans text-sm"
          />
          <div className="mt-2 flex flex-wrap gap-3">
            <button type="button" onClick={copy} className="btn-outline text-sm">
              {copied ? "¡Copiado!" : "Copiar"}
            </button>
            {mailto && (
              <a href={mailto} className="btn-outline text-sm">
                Abrir en el correo
              </a>
            )}
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="text-sm text-muted hover:text-gold-3 disabled:opacity-50"
            >
              Regenerar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
