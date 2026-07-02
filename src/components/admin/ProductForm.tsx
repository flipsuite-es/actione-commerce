"use client";

import { useState } from "react";
import { saveProduct, uploadImage, suggestProduct } from "@/app/admin/actions";
import type { Category, Product, Supplier } from "@/lib/types";

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
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const url = await uploadImage(fd);
        if (!firstUrl) firstUrl = url;
        setImages((prev) => [...prev, url]);
      }
    } catch (err: any) {
      setError(err?.message || "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
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
          {images.map((src, i) => (
            <div key={i} className="relative h-24 w-24 border border-gold/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages(images.filter((_, j) => j !== i))}
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-ink text-xs text-white"
                aria-label="Quitar"
              >
                ×
              </button>
            </div>
          ))}
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
        <p className="mt-2 text-xs text-muted">
          Al subir la primera foto se generan sugerencias de nombre, descripción,
          material y categoría. Son solo una propuesta: revísalas antes de guardar.
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
