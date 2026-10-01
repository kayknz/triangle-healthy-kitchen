-- Preserve checkout allergies and meal-preparation notes when payment is verified.
create or replace function private.apply_captured_payment_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
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
        zone_number = coalesce(nullif(profile_data->>'zone_number', ''), zone_number),
        delivery_notes = coalesce(nullif(profile_data->>'delivery_notes', ''), delivery_notes),
        latitude = coalesce(nullif(profile_data->>'latitude', '')::double precision, latitude),
        longitude = coalesce(nullif(profile_data->>'longitude', '')::double precision, longitude),
        allergies = case when jsonb_typeof(profile_data->'allergies')='array' and jsonb_array_length(profile_data->'allergies')>0 then array(select jsonb_array_elements_text(profile_data->'allergies')) else allergies end,
        dislikes = case when jsonb_typeof(profile_data->'dislikes')='array' and jsonb_array_length(profile_data->'dislikes')>0 then array(select jsonb_array_elements_text(profile_data->'dislikes')) else dislikes end,
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

notify pgrst,'reload schema';

-- Kitchen clients can read only production aggregates, never customer rows or
-- the underlying customer-by-customer weekly menu selections.
drop view if exists public.kitchen_subscribers_view;
create view public.kitchen_subscribers_view
with (security_invoker = false, security_barrier = true) as
  select status from public.subscribers
  where private.has_staff_role(array['ceo','admin','kitchen']);
revoke all on public.kitchen_subscribers_view from public,anon;
grant select on public.kitchen_subscribers_view to authenticated;

drop policy if exists subscribers_manage_own_menu on public.weekly_menu_selections;
create policy customers_manage_own_menu on public.weekly_menu_selections
  for all to authenticated
  using (exists (select 1 from public.subscribers s where s.id=weekly_menu_selections.subscriber_id and s.user_id=auth.uid()))
  with check (exists (select 1 from public.subscribers s where s.id=weekly_menu_selections.subscriber_id and s.user_id=auth.uid()));
drop policy if exists leaders_read_menu_selections on public.weekly_menu_selections;
create policy leaders_read_menu_selections on public.weekly_menu_selections
  for select to authenticated using (private.has_staff_role(array['ceo','admin']));
