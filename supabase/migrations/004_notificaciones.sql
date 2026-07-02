-- ============================================================
--  Oucy Studios — migración 004: notificaciones internas.
--  Los eventos de la tienda (nuevo ticket, respuesta de cliente,
--  nuevo pedido) generan avisos internos que el admin ve en la
--  campanita del backoffice. Sin correos externos. Idempotente.
-- ============================================================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,              -- ticket_new | ticket_reply | order_new
  title      text not null,
  body       text,
  url        text,                       -- ruta admin destino
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_unread_idx
  on public.notifications(read, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists notifications_admin_all on public.notifications;
create policy notifications_admin_all on public.notifications
  for all to authenticated using (true) with check (true);

-- ---------- Triggers (SECURITY DEFINER → insertan saltándose RLS) ----------

-- Nuevo ticket de soporte
create or replace function public.notify_new_ticket()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (kind, title, body, url)
  values ('ticket_new', 'Nuevo ticket de soporte',
          NEW.name || ' · ' || NEW.subject,
          '/admin/soporte/' || NEW.id);
  return NEW;
end;
$$;
drop trigger if exists tickets_notify on public.tickets;
create trigger tickets_notify after insert on public.tickets
  for each row execute function public.notify_new_ticket();

-- Respuesta de un cliente (no el primer mensaje, que es la apertura)
create or replace function public.notify_ticket_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_count int; v_name text; v_subject text;
begin
  if NEW.author <> 'customer' then return NEW; end if;
  select count(*) into v_count from public.ticket_messages where ticket_id = NEW.ticket_id;
  if v_count <= 1 then return NEW; end if;  -- primer mensaje = apertura, ya notificada
  select name, subject into v_name, v_subject from public.tickets where id = NEW.ticket_id;
  insert into public.notifications (kind, title, body, url)
  values ('ticket_reply', 'Respuesta de cliente',
          v_name || ' · ' || v_subject,
          '/admin/soporte/' || NEW.ticket_id);
  return NEW;
end;
$$;
drop trigger if exists ticket_messages_notify on public.ticket_messages;
create trigger ticket_messages_notify after insert on public.ticket_messages
  for each row execute function public.notify_ticket_reply();

-- Nuevo pedido
create or replace function public.notify_new_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (kind, title, body, url)
  values ('order_new', 'Nuevo pedido',
          coalesce(NEW.name, NEW.email, 'Cliente') || ' · '
            || to_char(coalesce(NEW.total, 0), 'FM999999990.00') || ' €',
          '/admin/pedidos/' || NEW.id);
  return NEW;
end;
$$;
drop trigger if exists orders_notify on public.orders;
create trigger orders_notify after insert on public.orders
  for each row execute function public.notify_new_order();
