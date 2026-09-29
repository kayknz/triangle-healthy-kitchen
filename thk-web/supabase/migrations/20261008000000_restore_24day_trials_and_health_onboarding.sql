-- Align plan durations with the 24 delivered service days and restore trial plans.
update public.packages
set duration = case id
  when '1100kcal' then '4 Weeks (28 boxes)'
  when '1400kcal' then '4 Weeks (28 boxes)'
  when '1500kcal' then '4 Weeks (28 personalised boxes)'
end,
updated_at = now()
where id in ('1100kcal', '1400kcal', '1500kcal');

insert into public.packages (
  id, name, kcals, price, currency, meals, duration, description, highlight, image, active, sort_order
) values
  ('daily_trial', 'One Day Trial', 1500, 175, 'QAR', 'Full day supply', '1 Day',
   'Try a full day of Triangle meals before choosing a longer plan.', 'Try us for a day',
   'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=1000', true, 4),
  ('weekly_reset', 'Six Day Trial', 1500, 1050, 'QAR', '6 day supply', '1 Week (6 days)',
   'Try six service days of meals during your work week.', 'Try us for a week',
   'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=1000', true, 5)
on conflict (id) do update set
  name = excluded.name, kcals = excluded.kcals, price = excluded.price,
  currency = excluded.currency, meals = excluded.meals, duration = excluded.duration,
  description = excluded.description, highlight = excluded.highlight, image = excluded.image,
  active = excluded.active, sort_order = excluded.sort_order, updated_at = now();

-- Store assessment data and an authenticated user's private BMI report reference.
alter table public.subscribers
  add column if not exists age integer,
  add column if not exists gender text,
  add column if not exists bmi_report_path text;

create or replace function public.complete_subscriber_onboarding(p_gender text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_email text := coalesce((select auth.jwt()) ->> 'email', '');
  caller_name text := coalesce(nullif((select auth.jwt()) -> 'user_metadata' ->> 'full_name', ''), 'Member');
begin
  if caller_id is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if p_gender not in ('male', 'female') then raise exception 'Choose male or female to continue.' using errcode = '22023'; end if;

  insert into public.subscribers (user_id, email, full_name, package_id, package_name, status, gender, taste_profile, onboarding_completed)
  values (caller_id, caller_email, caller_name, 'pending', 'Plan pending', 'paused', p_gender, jsonb_build_object('gender', p_gender), true)
  on conflict (user_id) do update
    set gender = excluded.gender,
        taste_profile = coalesce(public.subscribers.taste_profile, '{}'::jsonb) || excluded.taste_profile,
        onboarding_completed = true,
        updated_at = now();
end;
$$;
revoke all on function public.complete_subscriber_onboarding(text) from public, anon;
grant execute on function public.complete_subscriber_onboarding(text) to authenticated;

insert into storage.buckets (id, name, public)
values ('bmi-reports', 'bmi-reports', false)
on conflict (id) do update set public = false;

drop policy if exists "subscribers_upload_own_bmi_report" on storage.objects;
create policy "subscribers_upload_own_bmi_report" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'bmi-reports'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "subscribers_and_leaders_read_bmi_report" on storage.objects;
create policy "subscribers_and_leaders_read_bmi_report" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'bmi-reports'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or private.has_staff_role(array['ceo', 'admin'])
    )
  );

drop policy if exists "subscribers_delete_own_bmi_report" on storage.objects;
create policy "subscribers_delete_own_bmi_report" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'bmi-reports'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Tap's verified-capture trigger is the only path that activates a selected plan.
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
        gender = coalesce(nullif(profile_data->>'gender', ''), gender),
        age = coalesce(nullif(profile_data->>'age', '')::integer, age),
        bmi_report_path = coalesce(nullif(profile_data->>'bmi_report_path', ''), bmi_report_path),
        building_number = coalesce(nullif(profile_data->>'building_number', ''), building_number),
        street = coalesce(nullif(profile_data->>'street', ''), street),
        area = coalesce(nullif(profile_data->>'area', ''), area),
        latitude = coalesce(nullif(profile_data->>'latitude', '')::double precision, latitude),
        longitude = coalesce(nullif(profile_data->>'longitude', '')::double precision, longitude),
        remaining_days = case
          when new.metadata->>'package_id' in ('1100kcal', '1400kcal', '1500kcal') then 24
          when new.metadata->>'package_id' = 'daily_trial' then 1
          when new.metadata->>'package_id' = 'weekly_reset' then 6
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

notify pgrst, 'reload schema';
