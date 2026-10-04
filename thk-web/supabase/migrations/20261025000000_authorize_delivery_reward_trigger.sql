-- Delivery completion earns loyalty points through the same authorized database path
-- used by other reward operations. This prevents the subscriber billing/reward guard
-- from aborting the delivery status update itself.
create or replace function public.reward_delivery_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  prior_authorized_update text := current_setting('thk.authorized_subscriber_update', true);
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    perform set_config('thk.authorized_subscriber_update', 'true', true);
    update public.subscribers
    set points = coalesce(points, 0) + 10
    where id = new.subscriber_id;

    insert into public.loyalty_ledger (subscriber_id, points, reason)
    values (new.subscriber_id, 10, 'Meal Delivered');

    perform set_config('thk.authorized_subscriber_update', coalesce(prior_authorized_update, ''), true);
  end if;
  return new;
end;
$$;
revoke all on function public.reward_delivery_points() from public, anon, authenticated;
