-- Save the customer's initial menu after Tap confirms payment, matching the
-- cash-verification path. Payment capture and activation stay in one transaction.
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

    insert into public.weekly_menu_selections
      (subscriber_id,week_start_date,day_of_week,meal_type,dish_id,dish_name,dish_kcals,menu_period,dish_name_snapshot)
    select new.subscriber_id,(item->>'week_start_date')::date,item->>'day_of_week',item->>'meal_type',
      item->>'dish_id',item->>'dish_name',nullif(item->>'dish_kcals','')::numeric,item->>'menu_period',item->>'dish_name'
    from jsonb_array_elements(coalesce(new.metadata->'initial_menu_selections','[]'::jsonb)) item
    on conflict (subscriber_id,week_start_date,day_of_week,meal_type) do update set
      dish_id=excluded.dish_id,dish_name=excluded.dish_name,dish_kcals=excluded.dish_kcals,
      menu_period=excluded.menu_period,dish_name_snapshot=excluded.dish_name_snapshot;
  end if;
  return new;
end;
$$;

notify pgrst,'reload schema';
