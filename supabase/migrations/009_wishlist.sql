-- ============================================================
--  Oucy Studios — migración 009: favoritos por cuenta.
--  El cliente logueado guarda sus favoritos en la cuenta (además
--  del localStorage). Cada usuario gestiona solo los suyos.
--  Idempotente.
-- ============================================================

create table if not exists public.wishlist_items (
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  slug       text,
  name       text,
  price      numeric(10,2),
  image      text,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
alter table public.wishlist_items enable row level security;

drop policy if exists wishlist_self_all on public.wishlist_items;
create policy wishlist_self_all on public.wishlist_items
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
