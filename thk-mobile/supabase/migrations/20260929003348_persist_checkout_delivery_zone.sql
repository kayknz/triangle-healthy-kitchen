-- Persist the customer's Qatar zone number with the rest of the delivery
-- address when the verified Tap capture activates their plan.
alter table public.subscribers
  add column if not exists zone_number text;

create or replace function private.apply_captured_payment_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_data jsonb := coalesce(new.metadata->'profile', '{}'::jsonb);
begin
  if new.status = 'captured' and old.status is distinct from 'captured' then
    update public.subscribers
    set package_id = new.metadata->>'package_id',
        package_name = new.metadata->>'package_name',
        full_name = coalesce(nullif(profile_data->>'full_name', ''), full_name),
        phone = coalesce(nullif(profile_data->>'phone', ''), phone),
        weight_kg = coalesce(nullif(profile_data->>'weight_kg', '')::numeric, weight_kg),
        height_cm = coalesce(nullif(profile_data->>'height_cm', '')::numeric, height_cm),
        fitness_goal = coalesce(nullif(profile_data->>'fitness_goal', ''), fitness_goal),
        building_number = coalesce(nullif(profile_data->>'building_number', ''), building_number),
        street = coalesce(nullif(profile_data->>'street', ''), street),
        area = coalesce(nullif(profile_data->>'area', ''), area),
        zone_number = coalesce(nullif(profile_data->>'zone_number', ''), zone_number),
        latitude = coalesce(nullif(profile_data->>'latitude', '')::double precision, latitude),
        longitude = coalesce(nullif(profile_data->>'longitude', '')::double precision, longitude),
        remaining_days = case
          when new.metadata->>'package_duration' in ('4 Weeks (28 boxes)', '4 Weeks (28 personalised boxes)') then 24
          when new.metadata->>'package_duration' in ('1 week', '1 Week', '1 Week (6 days)') then 6
          when new.metadata->>'package_duration' in ('1 day', '1 Day') then 1
          else remaining_days
        end,
        payment_status = 'Paid',
        subscription_status = 'Active',
        onboarding_completed = true,
        updated_at = now()
    where id = new.subscriber_id;
  end if;
  return new;
end;
$$;

revoke all on function private.apply_captured_payment_profile() from public, anon, authenticated;

-- Transport staff need zone information for routing, while this view continues
-- to exclude subscriber health and nutrition profile fields.
create or replace view public.transport_subscribers_view
with (security_invoker = false, security_barrier = true)
as
  select id, full_name, phone, status, area, building_number, street,
         latitude, longitude, delivery_notes, breakfast_window, lunch_window,
         dinner_window, package_id, package_name, zone_number
  from public.subscribers
  where private.has_staff_role(array['ceo', 'admin', 'transport']);
