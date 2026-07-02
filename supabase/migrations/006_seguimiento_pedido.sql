-- ============================================================
--  Oucy Studios — migración 006: seguimiento de pedido para el
--  cliente. Consulta pública por referencia (8 primeros del id)
--  + correo, mediante función SECURITY DEFINER. Idempotente.
-- ============================================================

create or replace function public.order_status(p_ref text, p_email text)
returns json
language plpgsql security definer set search_path = public as $$
declare v json;
begin
  select json_build_object(
    'ref', upper(left(o.id::text, 8)),
    'status', o.status,
    'tracking', o.tracking,
    'total', o.total,
    'created_at', o.created_at,
    'items', coalesce(o.items, '[]'::jsonb)
  ) into v
  from public.orders o
  where left(o.id::text, 8) = lower(trim(p_ref))
    and lower(o.email) = lower(trim(p_email))
  order by o.created_at desc
  limit 1;
  return v;  -- null si no coincide
end;
$$;

revoke all on function public.order_status(text, text) from public;
grant execute on function public.order_status(text, text) to anon, authenticated;
