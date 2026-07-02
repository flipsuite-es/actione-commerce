-- 011_proveedores.sql — Proveedores (multi-proveedor)
-- Prepara el catálogo para trabajar con varios proveedores (hoy Smile Joyas;
-- mañana los que hagan falta). El producto apunta a un proveedor y guarda su
-- referencia dentro del catálogo de ESE proveedor (`supplier_ref`), para hacer
-- reposiciones/nuevos pedidos. Uso interno del backoffice (no en la tienda).

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  notes text,
  lead_time_days int,          -- plazo de entrega aprox. (días)
  min_order numeric,           -- pedido mínimo (€), opcional
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.suppliers enable row level security;

-- Solo el admin gestiona proveedores (datos internos sensibles).
drop policy if exists suppliers_admin_all on public.suppliers;
create policy suppliers_admin_all on public.suppliers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- updated_at automático.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists suppliers_touch on public.suppliers;
create trigger suppliers_touch before update on public.suppliers
  for each row execute function public.touch_updated_at();

-- Enlace producto → proveedor. `supplier_ref` (ya existente, migración 010) es
-- el código de la pieza en el catálogo de ese proveedor.
alter table public.products
  add column if not exists supplier_id uuid references public.suppliers(id) on delete set null;

comment on column public.products.supplier_id is
  'Proveedor de la pieza (FK suppliers). La ref. en su catálogo va en supplier_ref.';

-- Proveedor inicial.
insert into public.suppliers (name, notes, active)
select 'Smile Joyas', 'Proveedor inicial de joyería de acero inoxidable.', true
where not exists (select 1 from public.suppliers where lower(name) = 'smile joyas');
