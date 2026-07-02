-- ============================================================
--  Oucy Studios — esquema de base de datos (Supabase / Postgres)
--  Ejecuta este SQL en: Supabase -> SQL Editor -> New query -> Run
-- ============================================================

-- Extensiones
create extension if not exists "pgcrypto";

-- ---------- Categorías ----------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Productos ----------
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  description       text default '',
  price             numeric(10,2) not null default 0,          -- precio de venta (€)
  compare_at_price  numeric(10,2),                             -- precio "antes" (ancla)
  stock             int not null default 0,                    -- unidades disponibles
  sku               text,
  material          text default 'Acero inoxidable dorado',
  category_id       uuid references public.categories(id) on delete set null,
  images            text[] not null default '{}',              -- URLs (Supabase Storage)
  status            text not null default 'draft',             -- 'active' | 'draft'
  featured          boolean not null default false,
  sort              int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists products_status_idx on public.products(status);
create index if not exists products_category_idx on public.products(category_id);

-- ---------- Pedidos (base; el pago se conecta en Fase 2) ----------
create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  email      text,
  name       text,
  phone      text,
  items      jsonb not null default '[]',
  subtotal   numeric(10,2) not null default 0,
  shipping   numeric(10,2) not null default 0,
  total      numeric(10,2) not null default 0,
  status     text not null default 'pending',   -- pending | paid | shipped | cancelled
  note       text,
  created_at timestamptz not null default now()
);

-- ---------- Ajustes de la tienda (una sola fila) ----------
create table if not exists public.settings (
  id                  int primary key default 1,
  shop_name           text not null default 'Oucy Studios',
  tagline             text not null default 'Joyas que duran, no se oxidan.',
  announcement        text default '',
  prelaunch_enabled   boolean not null default true,     -- muro de pre-lanzamiento
  access_code         text not null default 'oucy2026',  -- código para entrar en pre-lanzamiento
  free_ship_threshold numeric(10,2) not null default 24.90,
  shipping_flat       numeric(10,2) not null default 2.95,
  updated_at          timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------- updated_at automático ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ============================================================
--  RLS: lectura pública de lo publicado; escritura solo autenticado (admin)
-- ============================================================
alter table public.products   enable row level security;
alter table public.categories enable row level security;
alter table public.settings   enable row level security;
alter table public.orders     enable row level security;

-- Productos: el público solo ve los 'active'; los autenticados (admin) ven todo y gestionan
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (status = 'active');

drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products
  for all to authenticated using (true) with check (true);

-- Categorías: lectura pública, gestión autenticada
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select using (true);
drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_all on public.categories
  for all to authenticated using (true) with check (true);

-- Ajustes: lectura pública (para el muro y el envío), gestión autenticada
drop policy if exists settings_public_read on public.settings;
create policy settings_public_read on public.settings for select using (true);
drop policy if exists settings_admin_write on public.settings;
create policy settings_admin_write on public.settings
  for update to authenticated using (true) with check (true);

-- Pedidos: cualquiera puede crear (checkout); solo admin lee/gestiona
drop policy if exists orders_public_insert on public.orders;
create policy orders_public_insert on public.orders for insert with check (true);
drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read on public.orders
  for select to authenticated using (true);
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
  for update to authenticated using (true) with check (true);

-- ============================================================
--  Storage: bucket público para imágenes de producto
--  (créalo también desde Storage UI si prefieres; esto lo automatiza)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
  for select using (bucket_id = 'product-images');
