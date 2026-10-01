-- Remove legacy provider-only RPCs. Tap is the sole payment gateway; health
-- tracking remains available through the app's native/manual data paths.
drop function if exists public.get_dibsy_config();
drop function if exists public.get_dibsy_webhook_secret();
drop function if exists public.get_stripe_webhook_secret();
drop function if exists public.get_terra_config();

-- The Terra connection table is unused and was verified empty before cleanup.
do $$
begin
  if to_regclass('public.health_connections') is not null then
    if exists (select 1 from public.health_connections) then
      raise exception 'health_connections contains records; export/review them before removing this legacy table';
    end if;
    drop table public.health_connections;
  end if;
end
$$;
