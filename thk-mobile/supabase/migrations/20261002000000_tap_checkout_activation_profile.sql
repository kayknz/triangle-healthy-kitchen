-- Tap checkout uses QAR and only activates a member after the verified capture RPC.
update public.packages
set currency = 'QAR', updated_at = now()
where currency = 'QR';

alter table public.subscribers
  add column if not exists weight_kg numeric,
  add column if not exists height_cm numeric,
  add column if not exists fitness_goal text,
  add column if not exists onboarding_completed boolean not null default false;

-- Apply onboarding details only in the same database transaction that records
-- a verified captured payment. The checkout Edge Function is the only writer
-- of transaction metadata and the service role is the only RPC caller.
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

drop trigger if exists apply_captured_payment_profile on public.payment_transactions;
create trigger apply_captured_payment_profile
after update of status on public.payment_transactions
for each row execute function private.apply_captured_payment_profile();
