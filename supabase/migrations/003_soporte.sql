-- ============================================================
--  Oucy Studios — migración 003: sistema de tickets de soporte.
--  Clientes (anónimos) abren tickets y consultan/responden su hilo
--  mediante funciones SECURITY DEFINER (ref + email). El admin
--  autenticado gestiona todo desde el backoffice. Idempotente.
-- ============================================================

-- ---------- Tablas ----------
create table if not exists public.tickets (
  id              uuid primary key default gen_random_uuid(),
  ref             text not null unique,
  name            text not null,
  email           text not null,
  subject         text not null,
  order_ref       text,
  status          text not null default 'open',    -- open | pending | answered | closed
  priority        text not null default 'normal',  -- low | normal | high
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references public.tickets(id) on delete cascade,
  author     text not null default 'customer',     -- customer | admin
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists ticket_messages_ticket_idx
  on public.ticket_messages(ticket_id, created_at);

-- ---------- RLS: solo el admin autenticado accede directamente ----------
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

drop policy if exists tickets_admin_all on public.tickets;
create policy tickets_admin_all on public.tickets for all to authenticated using (true) with check (true);

drop policy if exists ticket_messages_admin_all on public.ticket_messages;
create policy ticket_messages_admin_all on public.ticket_messages for all to authenticated using (true) with check (true);

drop trigger if exists tickets_touch on public.tickets;
create trigger tickets_touch before update on public.tickets
  for each row execute function public.touch_updated_at();

-- ---------- Funciones públicas (SECURITY DEFINER) ----------
-- El público NO tiene políticas de INSERT/SELECT: opera solo por estas
-- funciones, que validan email y evitan enumerar tickets ajenos.

-- Abrir un ticket. Devuelve la referencia (p.ej. OUCY-3F9A2C).
create or replace function public.open_ticket(
  p_name text, p_email text, p_subject text, p_order_ref text, p_body text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_ref text;
  v_id  uuid;
begin
  if coalesce(trim(p_email), '') = '' or coalesce(trim(p_name), '') = ''
     or coalesce(trim(p_subject), '') = '' or coalesce(trim(p_body), '') = '' then
    raise exception 'Faltan datos obligatorios';
  end if;
  loop
    v_ref := 'OUCY-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.tickets where ref = v_ref);
  end loop;
  insert into public.tickets (ref, name, email, subject, order_ref)
    values (v_ref, trim(p_name), lower(trim(p_email)), trim(p_subject),
            nullif(trim(coalesce(p_order_ref, '')), ''))
    returning id into v_id;
  insert into public.ticket_messages (ticket_id, author, body)
    values (v_id, 'customer', trim(p_body));
  return v_ref;
end;
$$;

-- Consultar el hilo de un ticket (ref + email deben coincidir).
create or replace function public.ticket_thread(p_ref text, p_email text)
returns json
language plpgsql security definer set search_path = public as $$
declare v json;
begin
  select json_build_object(
    'ref', t.ref,
    'subject', t.subject,
    'status', t.status,
    'order_ref', t.order_ref,
    'created_at', t.created_at,
    'messages', coalesce((
      select json_agg(json_build_object(
        'author', m.author, 'body', m.body, 'created_at', m.created_at
      ) order by m.created_at)
      from public.ticket_messages m where m.ticket_id = t.id
    ), '[]'::json)
  ) into v
  from public.tickets t
  where t.ref = upper(trim(p_ref)) and t.email = lower(trim(p_email));
  return v;  -- null si no coincide
end;
$$;

-- Responder a un ticket propio (ref + email).
create or replace function public.reply_ticket(p_ref text, p_email text, p_body text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if coalesce(trim(p_body), '') = '' then return false; end if;
  select id into v_id from public.tickets
    where ref = upper(trim(p_ref)) and email = lower(trim(p_email));
  if v_id is null then return false; end if;
  insert into public.ticket_messages (ticket_id, author, body)
    values (v_id, 'customer', trim(p_body));
  update public.tickets
    set status = case when status = 'closed' then 'open' else 'pending' end,
        last_message_at = now(), updated_at = now()
    where id = v_id;
  return true;
end;
$$;

revoke all on function public.open_ticket(text, text, text, text, text) from public;
grant execute on function public.open_ticket(text, text, text, text, text) to anon, authenticated;
revoke all on function public.ticket_thread(text, text) from public;
grant execute on function public.ticket_thread(text, text) to anon, authenticated;
revoke all on function public.reply_ticket(text, text, text) from public;
grant execute on function public.reply_ticket(text, text, text) to anon, authenticated;
