-- 010_supplier_ref.sql — Referencia de proveedor en productos
-- Añade `supplier_ref`: el código/referencia de la pieza en el catálogo del
-- proveedor (Smile Joyas), para poder hacer nuevos pedidos (reposición) sin
-- buscar la pieza a mano. Es de uso interno del backoffice (no se muestra en la
-- tienda). El SKU seguimos asignándolo nosotros automáticamente (control propio).

alter table public.products
  add column if not exists supplier_ref text;

comment on column public.products.supplier_ref is
  'Referencia de la pieza en el catálogo del proveedor (Smile Joyas), para reposición. Uso interno.';
