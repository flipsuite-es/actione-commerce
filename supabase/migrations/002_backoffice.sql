-- ============================================================
--  Oucy Studios — migración 002: contenido editable, pedidos,
--  cupones y páginas. Ejecuta en Supabase -> SQL Editor -> Run.
--  Es idempotente (se puede ejecutar varias veces sin romper).
-- ============================================================

-- ---------- Ajustes: contenido editable desde el backoffice ----------
alter table public.settings add column if not exists instagram_url text default 'https://instagram.com/oucystudios';
alter table public.settings add column if not exists tiktok_url    text default 'https://tiktok.com/@oucystudios';
alter table public.settings add column if not exists whatsapp_url  text default '';
alter table public.settings add column if not exists contact_email text default '';
alter table public.settings add column if not exists hero_subtitle text default 'Joyas elegantes y atemporales que parecen de joyería. Para llevar cada día y para regalar — sin que se estropeen.';
alter table public.settings add column if not exists story_text    text default 'Creemos que llevar algo bonito y elegante no debería costar una fortuna ni estropearse en un mes. Seleccionamos a mano joyas de acero inoxidable dorado —de las que no se oxidan ni manchan la piel— pensadas para durar y acompañarte cada día.';

-- ---------- Pedidos: estado avanzado ----------
alter table public.orders add column if not exists tracking    text;
alter table public.orders add column if not exists discount    numeric(10,2) not null default 0;
alter table public.orders add column if not exists coupon_code text;

-- ---------- Cupones de descuento ----------
create table if not exists public.coupons (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  kind         text not null default 'percent',   -- 'percent' | 'fixed'
  value        numeric(10,2) not null default 0,
  min_subtotal numeric(10,2) not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);
alter table public.coupons enable row level security;
drop policy if exists coupons_public_read on public.coupons;
create policy coupons_public_read on public.coupons for select using (active = true);
drop policy if exists coupons_admin_all on public.coupons;
create policy coupons_admin_all on public.coupons for all to authenticated using (true) with check (true);

-- ---------- Páginas de contenido (legal / info) ----------
create table if not exists public.pages (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  title      text not null,
  body       text not null default '',
  published  boolean not null default true,
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pages enable row level security;
drop policy if exists pages_public_read on public.pages;
create policy pages_public_read on public.pages for select using (published = true);
drop policy if exists pages_admin_all on public.pages;
create policy pages_admin_all on public.pages for all to authenticated using (true) with check (true);

drop trigger if exists pages_touch on public.pages;
create trigger pages_touch before update on public.pages
  for each row execute function public.touch_updated_at();

-- Páginas iniciales
insert into public.pages (slug, title, body, sort) values
  ('envios', 'Envíos y entregas', 'Preparamos tu pedido en 24–72 h y lo enviamos desde España con seguimiento. Envío gratis a partir de 24,90 €.', 1),
  ('devoluciones', 'Devoluciones', 'Dispones de 14 días para devolver tu pedido. Por higiene, los pendientes solo se admiten si vienen precintados.', 2),
  ('cuidado', 'Cuidado de tus joyas', 'Nuestras piezas son de acero inoxidable, resistente y pensado para el uso diario: aguanta bien el agua y la humedad. En las piezas con acabado dorado, el color se aplica con tecnología PVD, más duradera que el baño convencional. Para que se conserven como el primer día, guárdalas en un lugar seco y evita el contacto directo con perfume, cremas o productos de limpieza.', 3),
  ('privacidad', 'Política de privacidad', 'Tratamos tus datos conforme al RGPD. Escríbenos para cualquier consulta sobre tus datos.', 4)
on conflict (slug) do nothing;
