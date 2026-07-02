-- Datos de ejemplo (opcional). Ejecuta después de schema.sql.
insert into public.categories (name, slug, sort) values
  ('Anillos', 'anillos', 1),
  ('Pendientes', 'pendientes', 2),
  ('Colgantes', 'colgantes', 3),
  ('Perlas', 'perlas', 4)
on conflict (slug) do nothing;

insert into public.products (name, slug, description, price, compare_at_price, stock, material, status, featured, images)
values
  ('Anillo Perla', 'anillo-perla',
   'Anillo de acero inoxidable con perla sintética. Ajustable.',
   13.95, 24.90, 12, 'Acero inoxidable', 'active', true, '{}'),
  ('Anillo Torsión', 'anillo-torsion',
   'Anillo de acero inoxidable con forma de torsión. Ajustable.',
   11.95, 19.90, 20, 'Acero inoxidable', 'active', true, '{}'),
  ('Colgante Gota', 'colgante-gota',
   'Colgante minimalista en forma de gota, con cadena de acero inoxidable.',
   15.95, 27.90, 8, 'Acero inoxidable', 'active', false, '{}')
on conflict (slug) do nothing;
