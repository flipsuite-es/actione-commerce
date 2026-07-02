-- Datos de ejemplo (opcional). Ejecuta después de schema.sql.
insert into public.categories (name, slug, sort) values
  ('Anillos', 'anillos', 1),
  ('Pendientes', 'pendientes', 2),
  ('Colgantes', 'colgantes', 3),
  ('Perlas', 'perlas', 4)
on conflict (slug) do nothing;

insert into public.products (name, slug, description, price, compare_at_price, stock, material, status, featured, images)
values
  ('Anillo Perla Dorado', 'anillo-perla-dorado',
   'Anillo de acero inoxidable con baño dorado y perla sintética. No se oxida, resiste el agua y no mancha la piel. Ajustable.',
   13.95, 24.90, 12, 'Acero inoxidable dorado', 'active', true, '{}'),
  ('Anillo Torsión', 'anillo-torsion',
   'Anillo de acero dorado con diseño de torsión. Ajustable, apto para piel sensible.',
   11.95, 19.90, 20, 'Acero inoxidable dorado', 'active', true, '{}'),
  ('Colgante Gota', 'colgante-gota',
   'Colgante minimalista en forma de gota, cadena de acero dorado. No se oxida.',
   15.95, 27.90, 8, 'Acero inoxidable dorado', 'active', false, '{}')
on conflict (slug) do nothing;
