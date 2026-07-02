-- ============================================================
--  Oucy Studios — migración 005: reseñas de producto y
--  suscriptores (newsletter / muro). Idempotente.
-- ============================================================

-- ---------- Reseñas ----------
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name       text not null,
  rating     int  not null check (rating between 1 and 5),
  body       text not null default '',
  approved   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists reviews_product_idx on public.reviews(product_id, approved);

alter table public.reviews enable row level security;
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews for select using (approved = true);
drop policy if exists reviews_admin_all on public.reviews;
create policy reviews_admin_all on public.reviews for all to authenticated using (true) with check (true);

-- Enviar reseña (cliente anónimo). Fuerza approved=false (moderación).
create or replace function public.submit_review(
  p_product_id uuid, p_name text, p_rating int, p_body text
) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(trim(p_name), '') = '' or p_rating is null or p_rating < 1 or p_rating > 5 then
    return false;
  end if;
  if not exists (select 1 from public.products where id = p_product_id) then
    return false;
  end if;
  insert into public.reviews (product_id, name, rating, body)
    values (p_product_id, trim(p_name), p_rating, trim(coalesce(p_body, '')));
  return true;
end;
$$;
revoke all on function public.submit_review(uuid, text, int, text) from public;
grant execute on function public.submit_review(uuid, text, int, text) to anon, authenticated;

-- Notificación de nueva reseña (campanita)
create or replace function public.notify_new_review()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  select name into v_name from public.products where id = NEW.product_id;
  insert into public.notifications (kind, title, body, url)
  values ('review_new', 'Nueva reseña',
          coalesce(v_name, 'Producto') || ' · ' || NEW.rating || '★ de ' || NEW.name,
          '/admin/resenas');
  return NEW;
end;
$$;
drop trigger if exists reviews_notify on public.reviews;
create trigger reviews_notify after insert on public.reviews
  for each row execute function public.notify_new_review();

-- ---------- Suscriptores (newsletter / muro) ----------
create table if not exists public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  source     text not null default 'newsletter',   -- newsletter | prelaunch
  created_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
drop policy if exists subscribers_admin_read on public.subscribers;
create policy subscribers_admin_read on public.subscribers for all to authenticated using (true) with check (true);

-- Alta pública de correo (dedupe por email)
create or replace function public.subscribe_email(p_email text, p_source text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(trim(p_email), '') = '' or position('@' in p_email) = 0 then
    return false;
  end if;
  insert into public.subscribers (email, source)
    values (lower(trim(p_email)), coalesce(nullif(trim(p_source), ''), 'newsletter'))
    on conflict (email) do nothing;
  return true;
end;
$$;
revoke all on function public.subscribe_email(text, text) from public;
grant execute on function public.subscribe_email(text, text) to anon, authenticated;
