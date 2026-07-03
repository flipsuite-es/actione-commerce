"use client";

import { useRef, useState } from "react";
import {
  saveProduct,
  uploadImage,
  suggestProduct,
  checkPhoto,
  cleanupPhoto,
  enhancePhoto,
} from "@/app/admin/actions";
import type { Category, Product, Supplier } from "@/lib/types";

interface PhotoQc {
  checking?: boolean;
  publishable: boolean;
  reflection: boolean;
  problems: string[];
  note: string;
}

interface PhotoCleanup {
  loading?: boolean;
  cleanedUrl?: string;
  safe?: boolean;
  score?: number;
  fidelity?: number;
  reflectionRemoved?: number;
  changes?: string[];
  note?: string;
  feedback?: string; // ajuste transitorio para el siguiente intento
  error?: string;
  attempts?: number; // acumulado (todas las tandas)
}

export default function ProductForm({
  product,
  categories,
  suppliers = [],
  imageEditEnabled = false,
}: {
  product?: Product;
  categories: Category[];
  suppliers?: Supplier[];
  imageEditEnabled?: boolean;
}) {
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  // Control de calidad por foto (reflejos, borrosa, fondo…), por URL.
  const [qc, setQc] = useState<Record<string, PhotoQc>>({});
  // Borrado de reflejo con IA (compara y audita), por URL original.
  const [cleanup, setCleanup] = useState<Record<string, PhotoCleanup>>({});

  // Bandera de parada del bucle automático, por foto.
  const stopRef = useRef<Record<string, boolean>>({});
  const AUTO_CAP = 10; // tope de intentos automáticos (protección coste/tiempo)

  function stopCleanup(url: string) {
    stopRef.current[url] = true;
  }

  /** Bucle automático: reintenta solo hasta encontrar una publicable (segura)
   *  o hasta AUTO_CAP intentos. Va guardando el mejor y actualizando la vista. */
  async function runCleanup(url: string) {
    stopRef.current[url] = false;
    const current = cleanup[url];
    let best =
      current?.cleanedUrl != null
        ? {
            cleanedUrl: current.cleanedUrl,
            safe: current.safe ?? false,
            score: current.score ?? 0,
            fidelity: current.fidelity,
            reflectionRemoved: current.reflectionRemoved,
            changes: current.changes ?? [],
            note: current.note ?? "",
            feedback: current.feedback,
          }
        : null;
    let total = current?.attempts ?? 0;
    setCleanup((prev) => ({ ...prev, [url]: { ...prev[url], loading: true, error: undefined } }));
    try {
      while (!stopRef.current[url] && total < AUTO_CAP) {
        const r = await cleanupPhoto(url, best);
        if (!r || !r.ok) {
          const msg =
            r && !r.ok
              ? r.error
              : "La app se actualizó mientras probabas. Recarga la página y vuelve a intentarlo.";
          setCleanup((prev) => ({ ...prev, [url]: { ...prev[url], loading: false, error: msg } }));
          return;
        }
        total += r.attempts;
        best = {
          cleanedUrl: r.cleanedUrl,
          safe: r.safe,
          score: r.score,
          fidelity: r.fidelity,
          reflectionRemoved: r.reflectionRemoved,
          changes: r.changes,
          note: r.note,
          feedback: r.feedback,
        };
        const keepGoing = !r.safe && !stopRef.current[url] && total < AUTO_CAP;
        setCleanup((prev) => ({
          ...prev,
          [url]: { ...best!, attempts: total, loading: keepGoing },
        }));
        if (r.safe) break;
      }
    } catch (err: any) {
      setCleanup((prev) => ({
        ...prev,
        [url]: { ...prev[url], loading: false, error: err?.message || "No se pudo quitar el reflejo." },
      }));
    } finally {
      setCleanup((prev) =>
        prev[url] ? { ...prev, [url]: { ...prev[url], loading: false } } : prev,
      );
    }
  }

  // Sustituye la foto original por la corregida (el admin lo aprueba).
  function useCleaned(originalUrl: string, cleanedUrl: string) {
    setImages((prev) => prev.map((u) => (u === originalUrl ? cleanedUrl : u)));
    setQc((prev) => {
      const next = { ...prev };
      delete next[originalUrl];
      return next;
    });
    setCleanup((prev) => {
      const next = { ...prev };
      delete next[originalUrl];
      return next;
    });
    runCheck(cleanedUrl);
  }

  function dismissCleanup(url: string) {
    setCleanup((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
  }

  // Mejora de calidad (luz/contraste/nitidez), determinista, por URL original.
  const [enhance, setEnhance] = useState<
    Record<string, { loading?: boolean; url?: string; error?: string }>
  >({});

  async function runEnhance(url: string) {
    setEnhance((prev) => ({ ...prev, [url]: { loading: true } }));
    try {
      const r = await enhancePhoto(url);
      if (!r || !r.ok)
        setEnhance((prev) => ({
          ...prev,
          [url]: {
            error:
              r && !r.ok
                ? r.error
                : "La app se actualizó mientras probabas. Recarga la página y vuelve a intentarlo.",
          },
        }));
      else setEnhance((prev) => ({ ...prev, [url]: { url: r.url } }));
    } catch (err: any) {
      setEnhance((prev) => ({
        ...prev,
        [url]: { error: err?.message || "No se pudo mejorar la foto." },
      }));
    }
  }

  function useEnhanced(originalUrl: string, newUrl: string) {
    setImages((prev) => prev.map((u) => (u === originalUrl ? newUrl : u)));
    setEnhance((prev) => {
      const next = { ...prev };
      delete next[originalUrl];
      return next;
    });
    setQc((prev) => {
      const next = { ...prev };
      delete next[originalUrl];
      return next;
    });
    runCheck(newUrl);
  }

  function dismissEnhance(url: string) {
    setEnhance((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
  }

  async function runCheck(url: string) {
    setQc((prev) => ({
      ...prev,
      [url]: { checking: true, publishable: true, reflection: false, problems: [], note: "" },
    }));
    try {
      const r = await checkPhoto(url);
      if (r && r.ok) {
        setQc((prev) => ({
          ...prev,
          [url]: {
            checking: false,
            publishable: r.publishable,
            reflection: r.reflection,
            problems: r.problems,
            note: r.note,
          },
        }));
      } else {
        // Si el control falla (p. ej. sin clave), no molestamos: se quita.
        setQc((prev) => {
          const next = { ...prev };
          delete next[url];
          return next;
        });
      }
    } catch {
      setQc((prev) => {
        const next = { ...prev };
        delete next[url];
        return next;
      });
    }
  }

  // Campos controlados para poder autorrellenarlos con las sugerencias de IA.
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [material, setMaterial] = useState(product?.material ?? "Acero inoxidable");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [price, setPrice] = useState(
    product?.price != null ? String(product.price) : ""
  );
  const [compareAt, setCompareAt] = useState(
    product?.compare_at_price != null ? String(product.compare_at_price) : ""
  );
  const [cost, setCost] = useState(
    product?.cost != null ? String(product.cost) : ""
  );

  // Cálculo de PVP a partir del coste × multiplicador, redondeado a .95.
  const costNum = parseFloat(cost.replace(",", "."));
  const priceNum = parseFloat(price.replace(",", "."));
  function applyMultiplier(mult: number) {
    if (!Number.isFinite(costNum) || costNum <= 0) return;
    const raw = costNum * mult;
    const rounded = Math.max(0, Math.ceil(raw) - 0.05); // …,95 más cercano hacia arriba
    setPrice(rounded.toFixed(2));
  }
  const margin =
    Number.isFinite(costNum) && costNum > 0 && Number.isFinite(priceNum)
      ? { profit: priceNum - costNum, mult: priceNum / costNum }
      : null;

  const [suggesting, setSuggesting] = useState(false);
  const [aiMsg, setAiMsg] = useState("");

  async function runSuggest(url: string) {
    setSuggesting(true);
    setAiMsg("");
    try {
      const cats = categories.map((c) => ({ id: c.id, name: c.name }));
      const r = await suggestProduct(url, cats);
      if (!r || !r.ok) {
        setAiMsg(
          r && !r.ok
            ? r.error
            : "La app se actualizó mientras probabas. Recarga la página y vuelve a intentarlo.",
        );
        return;
      }
      if (r.name) setName(r.name);
      if (r.description) setDescription(r.description);
      if (r.material) setMaterial(r.material);
      if (r.category) {
        const c = categories.find((x) => x.name === r.category);
        if (c) setCategoryId(c.id);
      }
      if (r.price != null) setPrice(String(r.price));
      if (r.compare_at_price != null) setCompareAt(String(r.compare_at_price));
      setAiMsg("Sugerencias aplicadas (incluye precio orientativo). Revísalas y ajusta antes de guardar.");
    } catch (err: any) {
      setAiMsg(err?.message || "No se pudieron generar sugerencias.");
    } finally {
      setSuggesting(false);
    }
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    const wasEmpty = images.length === 0;
    let firstUrl = "";
    const newUrls: string[] = [];
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const url = await uploadImage(fd);
        if (!firstUrl) firstUrl = url;
        newUrls.push(url);
        setImages((prev) => [...prev, url]);
      }
    } catch (err: any) {
      setError(err?.message || "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
    // Control de calidad de cada foto subida (reflejos, borrosa, fondo…).
    newUrls.forEach((u) => runCheck(u));
    // Autorrelleno: si es la primera foto y aún no hay nombre, sugiere con IA.
    if (wasEmpty && firstUrl && !name.trim()) {
      runSuggest(firstUrl);
    }
  }

  return (
    <form action={saveProduct} className="max-w-3xl space-y-8">
      {product && <input type="hidden" name="id" defaultValue={product.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      {/* Imágenes */}
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl">Imágenes</h2>
          {images.length > 0 && (
            <button
              type="button"
              onClick={() => runSuggest(images[0])}
              disabled={suggesting}
              className="btn-outline text-sm disabled:opacity-50"
            >
              {suggesting ? "Pensando…" : "✨ Sugerir ficha con IA"}
            </button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {images.map((src, i) => {
            const check = qc[src];
            const flagged = check && !check.checking && (check.reflection || !check.publishable);
            return (
              <div
                key={i}
                className={`relative h-24 w-24 border ${
                  flagged ? "border-2 border-red-500" : "border-gold/20"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                {check?.checking && (
                  <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-0.5 text-center text-[10px] text-white">
                    Revisando…
                  </span>
                )}
                {flagged && (
                  <span
                    className="absolute left-1 top-1 rounded bg-red-500 px-1 text-[10px] font-medium text-white"
                    title={check.problems.join(" · ")}
                  >
                    ⚠
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setImages(images.filter((_, j) => j !== i));
                    setQc((prev) => {
                      const next = { ...prev };
                      delete next[src];
                      return next;
                    });
                  }}
                  className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-ink text-xs text-white"
                  aria-label="Quitar"
                >
                  ×
                </button>
              </div>
            );
          })}
          <label className="flex h-24 w-24 cursor-pointer items-center justify-center border border-dashed border-gold/40 text-center text-xs text-muted hover:bg-gold/5">
            {uploading ? "Subiendo…" : "+ Añadir"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onFiles}
              disabled={uploading}
            />
          </label>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {aiMsg && <p className="mt-2 text-sm text-muted">{aiMsg}</p>}

        {/* Avisos de control de calidad de foto (solo texto) */}
        {images.some((src) => {
          const c = qc[src];
          return c && !c.checking && (c.reflection || !c.publishable);
        }) && (
          <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm">
            <p className="font-medium text-red-700">Revisa estas fotos antes de publicar:</p>
            <ul className="mt-1 space-y-1 text-red-700">
              {images.map((src, i) => {
                const c = qc[src];
                if (!c || c.checking || (!c.reflection && c.publishable)) return null;
                const items = [
                  ...(c.reflection ? ["se te ve reflejada / sale el móvil"] : []),
                  ...c.problems.filter((p) => !/reflej|móvil|movil|fotograf/i.test(p)),
                ];
                return (
                  <li key={src}>
                    <span className="font-medium">Foto {i + 1}:</span>{" "}
                    {items.join(" · ") || c.note || "revisar"}
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-red-600/80">
              Consejo: lo más limpio y gratis es usar la foto del proveedor o disparar con
              una cartulina blanca con un agujero para el objetivo.
            </p>
          </div>
        )}

        {/* Mejorar calidad (luz/contraste/nitidez): siempre disponible, sin claves */}
        {images.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>✨ Mejorar calidad (luz, contraste, nitidez):</span>
            {images.map((src, i) =>
              enhance[src]?.url ? null : (
                <button
                  key={src}
                  type="button"
                  onClick={() => runEnhance(src)}
                  disabled={enhance[src]?.loading}
                  className="btn-outline px-2 py-1 text-xs disabled:opacity-50"
                >
                  {enhance[src]?.loading ? `Foto ${i + 1}…` : `Foto ${i + 1}`}
                </button>
              ),
            )}
          </div>
        )}

        {/* Paneles de mejora de calidad (antes/después) */}
        {images.map((src, i) => {
          const en = enhance[src];
          if (!en) return null;
          if (en.error) {
            return (
              <p key={src} className="mt-2 text-xs text-red-600">
                Foto {i + 1}: {en.error}
              </p>
            );
          }
          if (!en.url) return null;
          return (
            <div key={src} className="mt-3 rounded border border-gold/20 p-3">
              <p className="text-xs font-medium text-ink-soft">
                Foto {i + 1} — mejora de calidad
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="antes" className="w-full border border-gold/20" />
                  <figcaption className="mt-1 text-center text-[11px] text-muted">Antes</figcaption>
                </figure>
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={en.url} alt="después" className="w-full border border-gold/20" />
                  <figcaption className="mt-1 text-center text-[11px] text-muted">Después</figcaption>
                </figure>
              </div>
              <p className="mt-2 text-xs text-muted">
                Solo ajusta luz, contraste, color y nitidez de forma global. No cambia
                la forma, el color ni el acabado del producto.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => useEnhanced(src, en.url!)}
                  className="btn-gold text-sm"
                >
                  Usar la mejorada
                </button>
                <button
                  type="button"
                  onClick={() => dismissEnhance(src)}
                  className="text-sm text-muted hover:text-gold-3"
                >
                  Quedarme con la original
                </button>
              </div>
            </div>
          );
        })}

        {/* Quitar reflejo con IA: disponible para cualquier foto (si hay FAL_KEY) */}
        {imageEditEnabled && images.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>✨ Quitar reflejo con IA:</span>
            {images.map((src, i) =>
              cleanup[src]?.cleanedUrl ? null : (
                <button
                  key={src}
                  type="button"
                  onClick={() => runCleanup(src)}
                  disabled={cleanup[src]?.loading}
                  className="btn-outline px-2 py-1 text-xs disabled:opacity-50"
                >
                  {cleanup[src]?.loading ? `Foto ${i + 1} (probando…)` : `Foto ${i + 1}`}
                </button>
              ),
            )}
            <span className="w-full text-[11px] text-muted/80">
              Reintenta sola hasta encontrar una publicable (o hasta {AUTO_CAP} intentos).
              Puede tardar; verás el progreso y podrás pararlo.
            </span>
          </div>
        )}

        {/* Paneles de comparación (original vs sin reflejo). El admin aprueba. */}
        {images.map((src, i) => {
          const cl = cleanup[src];
          if (!cl) return null;
          if (cl.error) {
            return (
              <p key={src} className="mt-2 text-xs text-red-600">
                Foto {i + 1}: {cl.error}
              </p>
            );
          }
          if (!cl.cleanedUrl) return null;
          return (
            <div key={src} className="mt-3 rounded border border-gold/20 p-3">
              <p className="text-xs font-medium text-ink-soft">
                Foto {i + 1} — revisa antes de usar
                {typeof cl.score === "number" ? ` · calidad ${cl.score}/100` : ""}
                {cl.attempts && cl.attempts > 1 ? ` · ${cl.attempts} intentos` : ""}
              </p>
              {(typeof cl.fidelity === "number" ||
                typeof cl.reflectionRemoved === "number") && (
                <p className="text-[11px] text-muted">
                  {typeof cl.reflectionRemoved === "number"
                    ? `Reflejo limpiado: ${cl.reflectionRemoved}/100`
                    : ""}
                  {typeof cl.fidelity === "number"
                    ? ` · Fidelidad al producto: ${cl.fidelity}/100`
                    : ""}
                </p>
              )}
              <div className="mt-2 grid grid-cols-2 gap-3">
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="original" className="w-full border border-gold/20" />
                  <figcaption className="mt-1 text-center text-[11px] text-muted">
                    Original
                  </figcaption>
                </figure>
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cl.cleanedUrl}
                    alt="sin reflejo"
                    className="w-full border border-gold/20"
                  />
                  <figcaption className="mt-1 text-center text-[11px] text-muted">
                    Sin reflejo (IA)
                  </figcaption>
                </figure>
              </div>

              {cl.safe ? (
                <p className="mt-2 text-xs text-emerald-700">
                  ✓ Auditoría IA: es el mismo producto, solo se ha quitado el reflejo.
                  Seguro de usar.
                </p>
              ) : (
                <div className="mt-2 text-xs text-red-700">
                  <p className="font-medium">
                    ⚠ La auditoría no confirma que sea idéntico — compárala bien antes de
                    usarla:
                  </p>
                  {cl.changes && cl.changes.length > 0 && (
                    <ul className="ml-4 list-disc">
                      {cl.changes.map((ch, k) => (
                        <li key={k}>{ch}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {cl.note && <p className="mt-1 text-xs text-muted">{cl.note}</p>}

              {cl.loading && (
                <p className="mt-2 text-xs text-ink-soft">
                  Probando automáticamente y afinando la instrucción en cada intento…
                  (mejor calidad hasta ahora: {cl.score ?? 0}/100)
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => useCleaned(src, cl.cleanedUrl!)}
                  className={cl.safe ? "btn-gold text-sm" : "btn-outline text-sm"}
                >
                  Usar esta
                </button>
                {cl.loading ? (
                  <button
                    type="button"
                    onClick={() => stopCleanup(src)}
                    className="btn-outline text-sm"
                  >
                    Parar
                  </button>
                ) : (
                  !cl.safe && (
                    <button
                      type="button"
                      onClick={() => runCleanup(src)}
                      className="btn-outline text-sm"
                    >
                      ✨ Seguir probando
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => dismissCleanup(src)}
                  className="text-sm text-muted hover:text-gold-3"
                >
                  Quedarme con la original
                </button>
              </div>
            </div>
          );
        })}

        <p className="mt-2 text-xs text-muted">
          Al subir cada foto, la IA la revisa (reflejos, fondo, enfoque) y te avisa
          si conviene cambiarla. Con la primera foto además se sugiere nombre,
          descripción, material, categoría y un precio orientativo (ajústalo con tu coste).
        </p>
      </section>

      {/* Datos */}
      <section className="card space-y-4 p-6">
        <h2 className="font-serif text-xl">Datos del producto</h2>
        <div>
          <label className="label">Nombre</label>
          <input
            name="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea
            name="description"
            rows={4}
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Precio (€)</label>
            <input
              name="price"
              type="number"
              step="0.01"
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Precio antes (€, opcional)</label>
            <input
              name="compare_at_price"
              type="number"
              step="0.01"
              className="input"
              value={compareAt}
              onChange={(e) => setCompareAt(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted">
              Solo para rebajas reales (precio tachado). Déjalo vacío si no hay oferta.
            </p>
          </div>

          {/* Coste + calculador de PVP (interno) */}
          <div className="rounded border border-gold/20 bg-gold/[0.04] p-4 sm:col-span-2">
            <div className="grid gap-4 sm:grid-cols-[200px_1fr] sm:items-end">
              <div>
                <label className="label">Coste (€, interno)</label>
                <input
                  name="cost"
                  type="number"
                  step="0.01"
                  className="input"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="lo que te cuesta"
                />
              </div>
              <div>
                <span className="label">Calcular PVP desde el coste</span>
                <div className="flex flex-wrap items-center gap-2">
                  {[3, 4, 5, 6, 8].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => applyMultiplier(m)}
                      disabled={!Number.isFinite(costNum) || costNum <= 0}
                      className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40"
                      title={`Precio = coste × ${m} (redondeado a ,95)`}
                    >
                      ×{m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              El coste es solo interno (no se ve en la tienda). Los botones fijan el
              precio a coste × N, redondeado a ,95. Ajústalo luego a mano si quieres.
            </p>
            {margin && (
              <p className="mt-1 text-xs">
                Margen:{" "}
                <span
                  className={margin.profit > 0 ? "text-emerald-700" : "text-red-600"}
                >
                  {margin.profit.toFixed(2)} € por pieza ({margin.mult.toFixed(1)}×)
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="label">Stock</label>
            <input
              name="stock"
              type="number"
              className="input"
              defaultValue={product?.stock ?? 0}
            />
          </div>
          <div>
            <label className="label">SKU (interno)</label>
            {/* El SKU lo asigna el sistema automáticamente para tener control. */}
            <input type="hidden" name="sku" value={product?.sku ?? ""} />
            <input
              className="input bg-black/5"
              value={product?.sku ?? "Se asignará automáticamente al guardar"}
              readOnly
              disabled
            />
          </div>
          <div>
            <label className="label">Proveedor</label>
            <select
              name="supplier_id"
              className="input"
              defaultValue={product?.supplier_id ?? ""}
            >
              <option value="">— Sin asignar —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {!s.active ? " (inactivo)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Ref. del proveedor</label>
            <input
              name="supplier_ref"
              className="input"
              defaultValue={product?.supplier_ref ?? ""}
              placeholder="p. ej. SJ-1234"
            />
            <p className="mt-1 text-xs text-muted">
              Código de la pieza en el catálogo del proveedor, para reponer stock. Uso interno.
            </p>
          </div>
          <div>
            <label className="label">Material</label>
            <input
              name="material"
              className="input"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select
              name="category_id"
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">— Sin categoría —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Publicación */}
      <section className="card space-y-4 p-6">
        <h2 className="font-serif text-xl">Publicación</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Estado</label>
            <select
              name="status"
              className="input"
              defaultValue={product?.status ?? "draft"}
            >
              <option value="draft">Borrador (oculto)</option>
              <option value="active">Activo (visible)</option>
            </select>
          </div>
          <div>
            <label className="label">Orden</label>
            <input
              name="sort"
              type="number"
              className="input"
              defaultValue={product?.sort ?? 0}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product?.featured ?? false}
          />
          Destacado en la portada
        </label>
      </section>

      <div className="flex gap-3">
        <button type="submit" className="btn-gold">
          Guardar producto
        </button>
        <a href="/admin/productos" className="btn-outline">
          Cancelar
        </a>
      </div>
    </form>
  );
}
