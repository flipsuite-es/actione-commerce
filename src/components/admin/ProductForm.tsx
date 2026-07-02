"use client";

import { useState } from "react";
import { saveProduct, uploadImage } from "@/app/admin/actions";
import type { Category, Product } from "@/lib/types";

export default function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const url = await uploadImage(fd);
        setImages((prev) => [...prev, url]);
      }
    } catch (err: any) {
      setError(err?.message || "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <form action={saveProduct} className="max-w-3xl space-y-8">
      {product && <input type="hidden" name="id" defaultValue={product.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      {/* Imágenes */}
      <section className="card p-6">
        <h2 className="font-serif text-xl">Imágenes</h2>
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
      </section>

      {/* Datos */}
      <section className="card space-y-4 p-6">
        <h2 className="font-serif text-xl">Datos del producto</h2>
        <div>
          <label className="label">Nombre</label>
          <input name="name" className="input" defaultValue={product?.name} required />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea
            name="description"
            rows={4}
            className="input"
            defaultValue={product?.description ?? ""}
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
              defaultValue={product?.price ?? ""}
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
              defaultValue={product?.compare_at_price ?? ""}
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
            <label className="label">SKU (opcional)</label>
            <input name="sku" className="input" defaultValue={product?.sku ?? ""} />
          </div>
          <div>
            <label className="label">Material</label>
            <input
              name="material"
              className="input"
              defaultValue={product?.material ?? "Acero inoxidable dorado"}
            />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select
              name="category_id"
              className="input"
              defaultValue={product?.category_id ?? ""}
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
