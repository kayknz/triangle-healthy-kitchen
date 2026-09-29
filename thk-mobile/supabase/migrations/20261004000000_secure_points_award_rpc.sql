-- The legacy points accrual RPC is server-only. Lock down its grants and
-- mark its balance write as an authorized database operation.
create or replace function public.accrue_points(
  p_subscriber_id uuid,
  p_points integer,
  p_reason text,
  p_idempotency_key text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.jwt()) ->> 'role', '') <> 'service_role' then
    raise exception 'Points can only be awarded by the server.' using errcode = '42501';
  end if;

  insert into public.points_ledger (subscriber_id, points_delta, event_type, idempotency_key)
  values (p_subscriber_id, p_points, p_reason, p_idempotency_key);

  perform set_config('thk.authorized_subscriber_update', 'true', true);
  update public.subscribers
  set points_balance = points_balance + p_points
  where id = p_subscriber_id;

  return found;
exception
  when unique_violation then return false;
end;
$$;
revoke all on function public.accrue_points(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.accrue_points(uuid, integer, text, text) to service_role;
