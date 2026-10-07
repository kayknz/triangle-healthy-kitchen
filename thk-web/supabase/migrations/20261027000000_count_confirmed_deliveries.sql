-- A delivered rider stop is one daily package, regardless of how many meals
-- it contains. Keep a permanent marker per stop so later status corrections or
-- retries cannot consume another service day.
alter table public.rider_deliveries
  add column if not exists package_day_consumed_at timestamptz;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'rider_deliveries'
     ) then
    alter publication supabase_realtime add table public.rider_deliveries;
  end if;
end;
$$;

update public.rider_deliveries
set package_day_consumed_at = coalesce(delivered_at, updated_at, now())
where status = 'delivered' and package_day_consumed_at is null;

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
    update public.rider_deliveries
    set package_day_consumed_at = coalesce(new.delivered_at, now())
    where id = new.id and package_day_consumed_at is null;

    if not found then return new; end if;

    perform set_config('thk.authorized_subscriber_update', 'true', true);
    update public.subscribers
    set points = coalesce(points, 0) + 10,
        remaining_days = greatest(coalesce(remaining_days, 0) - 1, 0)
    where id = new.subscriber_id;

    insert into public.loyalty_ledger (subscriber_id, points, reason)
    values (new.subscriber_id, 10, 'Meal Delivered');

    perform set_config('thk.authorized_subscriber_update', coalesce(prior_authorized_update, ''), true);
  end if;
  return new;
end;
$$;
revoke all on function public.reward_delivery_points() from public, anon, authenticated;
