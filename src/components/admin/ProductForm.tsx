"use client";

import { useState } from "react";
import { saveProduct, uploadImage, suggestProduct, checkPhoto } from "@/app/admin/actions";
import type { Category, Product, Supplier } from "@/lib/types";

interface PhotoQc {
  checking?: boolean;
  publishable: boolean;
  reflection: boolean;
  problems: string[];
  note: string;
}

export default function ProductForm({
  product,
  categories,
  suppliers = [],
}: {
  product?: Product;
  categories: Category[];
  suppliers?: Supplier[];
}) {
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  // Control de calidad por foto (reflejos, borrosa, fondo…), por URL.
  const [qc, setQc] = useState<Record<string, PhotoQc>>({});

  async function runCheck(url: string) {
    setQc((prev) => ({
      ...prev,
      [url]: { checking: true, publishable: true, reflection: false, problems: [], note: "" },
    }));
    try {
      const r = await checkPhoto(url);
      if (r.ok) {
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
      if (!r.ok) {
        setAiMsg(r.error);
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

        {/* Avisos de control de calidad de foto */}
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
                  ...c.problems.filter(
                    (p) => !/reflej|móvil|movil|fotograf/i.test(p)
                  ),
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
              Consejo: usa la foto del proveedor (sin reflejos) o dispara con una
              cartulina blanca con un agujero para el objetivo. No es obligatorio,
              pero una foto limpia vende mucho más.
            </p>
          </div>
        )}

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
