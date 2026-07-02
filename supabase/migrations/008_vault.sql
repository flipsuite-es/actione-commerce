-- ============================================================
--  Oucy Studios — migración 008: gestor de contraseñas (bóveda).
--  Solo admin (RLS is_admin). La contraseña se guarda CIFRADA
--  (AES-256-GCM) desde la app; la DB solo ve el texto cifrado.
--  Idempotente.
-- ============================================================

create table if not exists public.vault_entries (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  url        text,
  username   text,
  secret_enc text not null default '',   -- contraseña cifrada (base64)
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.vault_entries enable row level security;

drop policy if exists vault_admin_all on public.vault_entries;
create policy vault_admin_all on public.vault_entries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists vault_touch on public.vault_entries;
create trigger vault_touch before update on public.vault_entries
  for each row execute function public.touch_updated_at();
