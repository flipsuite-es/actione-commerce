-- ============================================================
--  Oucy Studios — migración 007: cuentas de cliente.
--  Separa ADMIN de CLIENTE. Perfiles con rol, y todas las
--  políticas de "authenticated con acceso total" pasan a exigir
--  is_admin(); si no, los clientes heredarían el backoffice.
--  Idempotente.
-- ============================================================

-- ---------- Perfiles ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text default '',
  phone      text default '',
  role       text not null default 'customer',   -- customer | admin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Alta automática de perfil al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill de los usuarios ya existentes
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- Los usuarios que YA existían son el/los admin (aún no hay clientes)
update public.profiles set role = 'admin'
where id in (select id from auth.users);

-- ¿Es admin el usuario actual? (SECURITY DEFINER → puede leer profiles sin recursión de RLS)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- Editar el propio perfil (solo nombre y teléfono; nunca el rol)
create or replace function public.update_my_profile(p_full_name text, p_phone text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  update public.profiles
    set full_name = coalesce(p_full_name, full_name),
        phone     = coalesce(p_phone, phone),
        updated_at = now()
  where id = auth.uid();
end;
$$;
grant execute on function public.update_my_profile(text, text) to authenticated;

-- Políticas de perfiles: cada uno ve el suyo; el admin gestiona todos.
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select to authenticated using (id = auth.uid());
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------- Pedidos: enlazar con el usuario + lectura de cliente ----------
alter table public.orders add column if not exists user_id uuid references auth.users(id);
drop policy if exists orders_customer_read on public.orders;
create policy orders_customer_read on public.orders
  for select to authenticated
  using (user_id = auth.uid() or lower(email) = lower(coalesce(auth.email(), '')));

-- ============================================================
--  Reescribir todas las políticas admin (antes: to authenticated
--  using(true)) para exigir is_admin(). Público sin cambios.
-- ============================================================
drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_all on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists settings_admin_write on public.settings;
create policy settings_admin_write on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read on public.orders
  for select to authenticated using (public.is_admin());
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists coupons_admin_all on public.coupons;
create policy coupons_admin_all on public.coupons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists pages_admin_all on public.pages;
create policy pages_admin_all on public.pages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists tickets_admin_all on public.tickets;
create policy tickets_admin_all on public.tickets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists ticket_messages_admin_all on public.ticket_messages;
create policy ticket_messages_admin_all on public.ticket_messages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists notifications_admin_all on public.notifications;
create policy notifications_admin_all on public.notifications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists reviews_admin_all on public.reviews;
create policy reviews_admin_all on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists subscribers_admin_read on public.subscribers;
create policy subscribers_admin_read on public.subscribers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Storage: subir/editar/borrar imágenes de producto solo admin
drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());
