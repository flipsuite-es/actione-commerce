-- 012_coste.sql — Coste de compra (interno) para controlar márgenes
-- Guarda lo que nos cuesta la pieza en el proveedor. Es INTERNO: nunca se
-- muestra en la tienda. Sirve para calcular el PVP con un multiplicador y para
-- ver el margen de un vistazo en el backoffice.

alter table public.products
  add column if not exists cost numeric;

comment on column public.products.cost is
  'Coste de compra al proveedor (€, interno, para márgenes). No se muestra en la tienda.';
