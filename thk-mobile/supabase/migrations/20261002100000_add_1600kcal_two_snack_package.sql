-- Add the 1,600 kcal package and optional Friday service.
-- Both snack slots draw from the kitchen's published snacks menu.
-- Friday meal service is an opt-in QAR 199 monthly addition. Its meals are
-- selected and counted separately, while base plans retain their 24-day cycle.
alter table public.subscribers add column if not exists friday_delivery_addon boolean not null default false;
alter table public.weekly_menu_selections drop constraint if exists weekly_menu_selections_day_of_week_check;
alter table public.weekly_menu_selections add constraint weekly_menu_selections_day_of_week_check
  check (day_of_week in ('Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'));
alter table public.menu_availability drop constraint if exists menu_availability_day_of_week_check;
alter table public.menu_availability add constraint menu_availability_day_of_week_check
  check (day_of_week in ('Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'));

alter table public.packages
  drop constraint if exists packages_meal_periods_array_check;
alter table public.packages
  add constraint packages_meal_periods_array_check
  check (jsonb_typeof(meal_periods) = 'array' and jsonb_array_length(meal_periods) between 1 and 5);

insert into public.packages (
  id, name, kcals, price, currency, meals, duration, description, highlight, image,
  active, sort_order, meal_periods
) values (
  '1600kcal', '1600 kcal Plan', 1600, 2499, 'QAR', '3 Meals + 2 Snacks', '24 Service Days',
  'Three meals and two different snack choices each service day.', 'For active lifestyles',
  'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  true, 4, '["breakfast","lunch","dinner","snacks","snacks_2"]'::jsonb
)
on conflict (id) do update set
  name=excluded.name, kcals=excluded.kcals, price=excluded.price, currency=excluded.currency,
  meals=excluded.meals, duration=excluded.duration, description=excluded.description,
  highlight=excluded.highlight, image=excluded.image, active=excluded.active,
  sort_order=excluded.sort_order, meal_periods=excluded.meal_periods, updated_at=now();

alter table public.weekly_menu_selections
  drop constraint if exists weekly_menu_selections_meal_type_check;
alter table public.weekly_menu_selections
  add constraint weekly_menu_selections_meal_type_check
  check (meal_type in ('breakfast','lunch','dinner','snack','snacks','snack_2'));

update public.packages set sort_order=5 where id='daily_trial';
update public.packages set sort_order=6 where id='weekly_reset';
update public.packages
set meal_periods='["breakfast","lunch","dinner","snacks"]'::jsonb,
    meals='3 Meals + 1 Snack', updated_at=now()
where id in ('daily_trial','weekly_reset');
update public.packages
set meal_periods='["breakfast","lunch","dinner","snacks"]'::jsonb,
    meals='3 Meals + 1 Snack', updated_at=now()
where id in ('daily_trial','weekly_reset');

create or replace function private.enforce_package_meal_period()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  allowed_periods jsonb;
  target_package text;
  requested_period text;
  friday_delivery boolean := false;
begin
  select package_id, friday_delivery_addon into target_package, friday_delivery from public.subscribers where id = new.subscriber_id;
  select meal_periods into allowed_periods from public.packages where id = target_package;
  if allowed_periods is null then
    raise exception 'A valid meal package is required before choosing meals.' using errcode = '23514';
  end if;
  if new.day_of_week = 'Friday' and not coalesce(friday_delivery,false) then
    raise exception 'Friday selections require the monthly Friday delivery add-on.' using errcode = '23514';
  end if;
  requested_period := case
    when new.meal_type = 'snack_2' then 'snacks_2'
    when new.meal_type in ('snack','snacks') then 'snacks'
    else new.meal_type
  end;
  if not (allowed_periods ? requested_period) then
    raise exception 'This meal period is not included in your package.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_package_meal_period() from public, anon, authenticated;
drop trigger if exists enforce_package_meal_period on public.weekly_menu_selections;
create trigger enforce_package_meal_period before insert or update of meal_type, subscriber_id, day_of_week
  on public.weekly_menu_selections for each row execute function private.enforce_package_meal_period();

create or replace function public.enforce_weekly_menu_selection_window()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Qatar')::date;
  v_service_start date;
  v_menu_open date;
  v_dish_exists boolean;
begin
  if current_user in ('postgres','service_role') or private.has_staff_role(array['ceo','admin','kitchen']) then return new; end if;
  if extract(isodow from v_today) = 5 then
    raise exception 'Weekly meal selections close Thursday at 11:59 PM Qatar time.' using errcode = 'P0001';
  end if;
  v_service_start := v_today + mod(6 - extract(isodow from v_today)::integer + 7, 7);
  if extract(isodow from v_today) = 6 then v_service_start := v_service_start + 7; end if;
  if new.week_start_date <> v_service_start then
    raise exception 'Selections can only be changed for the upcoming service week.' using errcode = 'P0001';
  end if;
  if new.dish_name = 'SKIP DAY' then return new; end if;
  v_menu_open := v_today - mod(extract(isodow from v_today)::integer + 1, 7);
  select exists (
    select 1 from public.menu_availability a join public.dishes d on d.id = a.dish_id
    where a.is_active and a.day_of_week = new.day_of_week
      and a.meal_period = case when new.meal_type in ('snack','snacks','snack_2') then 'snacks' else new.meal_type end
      and a.collection = coalesce(new.menu_period, (select active_season from public.global_settings limit 1))
      and ((a.monthly_menu_id is not null
            and a.available_from at time zone 'Asia/Qatar' >= v_menu_open::timestamp
            and a.available_from at time zone 'Asia/Qatar' < (v_menu_open + 1)::timestamp)
        or (a.monthly_menu_id is null and not exists (
            select 1 from public.menu_availability released
            where released.monthly_menu_id is not null
              and released.available_from at time zone 'Asia/Qatar' >= v_menu_open::timestamp
              and released.available_from at time zone 'Asia/Qatar' < (v_menu_open + 1)::timestamp)))
      and (d.id::text = new.dish_id or d.name = new.dish_name)
  ) into v_dish_exists;
  if not v_dish_exists then raise exception 'That dish is not available in this released menu.' using errcode = 'P0001'; end if;
  return new;
end;
$$;

-- Add the second kitchen-choice default when a 1,600 kcal customer's weekly choice window closes.
create or replace function public.apply_kitchen_choice_defaults()
returns integer language plpgsql security definer set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Qatar')::date;
  v_inserted integer := 0;
begin
  if extract(isodow from v_today) <> 5 then return 0; end if;
  insert into public.weekly_menu_selections
    (subscriber_id,week_start_date,day_of_week,meal_type,dish_id,dish_name,dish_kcals,menu_period)
  select distinct on (s.id, ((m.available_from at time zone 'Asia/Qatar')::date + 7), m.day_of_week, slot.meal_type)
         s.id, ((m.available_from at time zone 'Asia/Qatar')::date + 7), m.day_of_week,
         slot.meal_type,
         case when slot.meal_type = 'snack_2' and snack_two.id is not null then snack_two.id::text else d.id::text end,
         case when slot.meal_type = 'snack_2' and snack_two.id is not null then snack_two.name else d.name end,
         case when slot.meal_type = 'snack_2' and snack_two.id is not null then snack_two.kcals else d.kcals end,
         m.collection
  from public.menu_availability m
  join public.dishes d on d.id = m.dish_id
  join public.subscribers s on s.status = 'active'
  join public.packages p on p.id = s.package_id
  left join lateral (
    select d2.id, d2.name, d2.kcals
    from public.menu_availability m2 join public.dishes d2 on d2.id = m2.dish_id
    where m.meal_period = 'snacks' and m2.is_active and m2.day_of_week = m.day_of_week
      and m2.collection = m.collection and m2.meal_period = 'snacks'
      and m2.available_from = m.available_from and d2.id <> d.id
    order by m2.is_kitchen_choice desc, d2.id
    limit 1
  ) snack_two on true
  cross join lateral (
    select case when m.meal_period = 'snacks' then 'snack' else m.meal_period end as meal_type
    union all
    select 'snack_2' where m.meal_period = 'snacks' and p.meal_periods ? 'snacks_2'
  ) slot
  where ((m.available_from at time zone 'Asia/Qatar')::date = v_today - 6)
    and m.is_active and m.is_kitchen_choice
    and (m.day_of_week <> 'Friday' or s.friday_delivery_addon)
    and m.meal_period in ('breakfast','lunch','dinner','snacks')
    and p.meal_periods ? case
      when slot.meal_type = 'snack_2' then 'snacks_2'
      when m.meal_period = 'snacks' then 'snacks'
      else m.meal_period
    end
  order by s.id, ((m.available_from at time zone 'Asia/Qatar')::date + 7), m.day_of_week, slot.meal_type, m.dish_id
  on conflict (subscriber_id,week_start_date,day_of_week,meal_type) do nothing;
  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;
revoke all on function public.apply_kitchen_choice_defaults() from public, anon, authenticated;
grant execute on function public.apply_kitchen_choice_defaults() to service_role;

create or replace function private.apply_captured_payment_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  profile_data jsonb := coalesce(new.metadata->'profile', '{}'::jsonb);
begin
  if new.status = 'captured' and old.status is distinct from 'captured' then
    update public.subscribers
    set package_id = new.metadata->>'package_id',
        friday_delivery_addon = coalesce((profile_data->>'friday_delivery_addon')::boolean,false),
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
          when new.metadata->>'package_id' in ('1100kcal', '1400kcal', '1500kcal', '1600kcal') then 24
          when new.metadata->>'package_id' = 'daily_trial' then 1
          when new.metadata->>'package_id' = 'weekly_reset' then 6
          else remaining_days
        end,
        payment_status = 'Paid', subscription_status = 'Active', onboarding_completed = true, updated_at = now()
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
create or replace function public.publish_catalogue_menu(
  p_title text,
  p_month_start date,
  p_collection text,
  p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_document_id uuid;
  v_available_on date;
  v_days_until_saturday integer;
  v_item jsonb;
  v_dish_id uuid;
  v_day text;
  v_meal text;
  v_week integer;
  v_kitchen_choice boolean;
  v_count integer := 0;
  v_repeat integer;
begin
  if not private.has_staff_role(array['ceo','admin']) then
    raise exception 'Only company leadership can publish monthly menus.' using errcode = '42501';
  end if;
  if p_collection not in ('summer','autumn','ramadan') then
    raise exception 'Invalid menu collection.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) <> 84 then
    raise exception 'Choose exactly three dishes for every day and meal slot.';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_items) as x(day_of_week text, meal_period text, dish_id uuid, kitchen_choice boolean)
    group by x.day_of_week, x.meal_period
    having count(*) <> 3
       or count(distinct x.dish_id) <> 3
       or count(*) filter (where x.kitchen_choice) <> 1
  ) or (select count(*) from (
      select x.day_of_week, x.meal_period
      from jsonb_to_recordset(p_items) as x(day_of_week text, meal_period text, dish_id uuid, kitchen_choice boolean)
      group by x.day_of_week, x.meal_period
    ) slots) <> 28 then
    raise exception 'Every day and meal slot must have three different dishes and one kitchen default.';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_items) as x(day_of_week text, meal_period text, dish_id uuid)
    where x.day_of_week not in ('Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday')
       or x.meal_period not in ('breakfast','lunch','dinner','snacks')
       or not exists (select 1 from public.dishes d where d.id = x.dish_id and d.is_active)
  ) then
    raise exception 'A selected dish is missing or inactive.';
  end if;

  v_available_on := (now() at time zone 'Asia/Qatar')::date;
  v_days_until_saturday := mod(6 - extract(isodow from v_available_on)::integer + 7, 7);
  if v_days_until_saturday = 0 then v_days_until_saturday := 7; end if;
  v_available_on := v_available_on + v_days_until_saturday;

  update public.menu_availability
     set is_active = false
   where collection = p_collection
     and available_from >= (v_available_on::timestamp at time zone 'Asia/Qatar')
     and available_from < ((v_available_on + 28)::timestamp at time zone 'Asia/Qatar');
  update public.monthly_menu_documents
     set status = 'archived'
   where collection = p_collection
     and available_from >= (v_available_on::timestamp at time zone 'Asia/Qatar')
     and available_from < ((v_available_on + 28)::timestamp at time zone 'Asia/Qatar');

  insert into public.monthly_menu_documents
    (title, month_start, source_filename, storage_path, source_type, collection, available_from, uploaded_by)
  values
    (left(trim(p_title),100), date_trunc('month',p_month_start)::date,
     'Dish catalogue selection', 'catalogue-menu/' || gen_random_uuid()::text,
     'catalogue', p_collection, v_available_on::timestamp at time zone 'Asia/Qatar', auth.uid())
  returning id into v_document_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_dish_id := (v_item->>'dish_id')::uuid;
    v_day := v_item->>'day_of_week';
    v_meal := v_item->>'meal_period';
    v_week := coalesce((v_item->>'week_number')::integer,1);
    v_kitchen_choice := coalesce((v_item->>'kitchen_choice')::boolean,false);
    if v_week <> 1 then raise exception 'Catalogue menus use one seven-day week repeated across the month.'; end if;
    for v_repeat in 1..4 loop
      insert into public.menu_availability
        (dish_id,week_number,day_of_week,meal_period,collection,monthly_menu_id,is_kitchen_choice,available_from,metadata)
      values
        (v_dish_id,v_repeat,v_day,v_meal,p_collection,v_document_id,v_kitchen_choice,
         (v_available_on + (v_repeat - 1) * 7)::timestamp at time zone 'Asia/Qatar',
         jsonb_build_object('source','dish_catalogue','month_start',date_trunc('month',p_month_start)::date))
      on conflict (monthly_menu_id,week_number,day_of_week,meal_period,dish_id)
        where monthly_menu_id is not null
      do update set is_active = true, is_kitchen_choice = excluded.is_kitchen_choice,
        available_from = excluded.available_from, metadata = excluded.metadata;
      v_count := v_count + 1;
    end loop;
  end loop;

  return jsonb_build_object('id',v_document_id,'available_from',v_available_on,'entries',v_count);
end;
$$;
revoke all on function public.publish_catalogue_menu(text,date,text,jsonb) from public, anon;
grant execute on function public.publish_catalogue_menu(text,date,text,jsonb) to authenticated;


create or replace function public.review_cash_payment(p_transaction_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  tx public.payment_transactions%rowtype;
  sub public.subscribers%rowtype;
  pkg public.packages%rowtype;
  service_days integer;
  starts_at timestamptz;
  profile_data jsonb;
  friday_delivery boolean := false;
begin
  if not private.has_staff_role(array['ceo','admin']) then
    raise exception 'Only Admin or CEO can confirm collected cash.' using errcode = '42501';
  end if;
  select * into tx from public.payment_transactions where id=p_transaction_id for update;
  if not found then raise exception 'Payment request not found.' using errcode = 'P0002'; end if;
  if tx.payment_provider <> 'cash' then raise exception 'This is not a cash payment.' using errcode = '22023'; end if;
  if tx.status = 'captured' then return jsonb_build_object('success',true,'note','already_verified'); end if;
  if tx.status <> 'pending' then raise exception 'Only pending cash requests can be verified.' using errcode = '22023'; end if;
  select * into sub from public.subscribers where id=tx.subscriber_id for update;
  if not found then raise exception 'Customer account has expired.' using errcode = 'P0002'; end if;
  select * into pkg from public.packages where id=tx.metadata->>'package_id' and active;
  friday_delivery := coalesce((tx.metadata#>>'{profile,friday_delivery_addon}')::boolean,false);
  if not found or abs(pkg.price + case when friday_delivery then 199 else 0 end - tx.amount)>0.01 or pkg.currency<>tx.currency then
    raise exception 'Cash amount does not match the selected package.' using errcode = '22023';
  end if;
  service_days := case
    when pkg.duration ilike '%1 day%' then 1
    when pkg.duration ilike '%1 week%' or pkg.duration ilike '%6 day%' then 6
    when pkg.duration ilike '%4 week%' or pkg.duration ilike '%24 service%' then 24
    else null end;
  if service_days is null then raise exception 'Package duration needs an Admin update.' using errcode = '22023'; end if;
  if friday_delivery and service_days <> 24 then raise exception 'Friday deliveries are available with monthly packages only.' using errcode = '22023'; end if;
  starts_at := case when sub.status='active' and sub.current_period_end>now() then sub.current_period_end else now() end;
  profile_data := coalesce(tx.metadata->'profile','{}'::jsonb);
  update public.subscribers set status='active',package_id=pkg.id,package_name=pkg.name,
    payment_provider='cash',payment_status='Paid',friday_delivery_addon=friday_delivery,subscription_start=coalesce(subscription_start,now()),
    subscription_status='Active',onboarding_completed=true,
    tap_charge_id=null,last_payment_id=tx.id::text,
    current_period_end=public.add_service_days(starts_at,service_days),
    remaining_days=service_days,
    full_name=coalesce(nullif(profile_data->>'full_name',''),full_name),
    phone=coalesce(nullif(profile_data->>'phone',''),phone),
    weight_kg=coalesce(nullif(profile_data->>'weight_kg','')::numeric,weight_kg),
    height_cm=coalesce(nullif(profile_data->>'height_cm','')::numeric,height_cm),
    fitness_goal=coalesce(nullif(profile_data->>'fitness_goal',''),fitness_goal),
    gender=coalesce(nullif(profile_data->>'gender',''),gender),
    age=coalesce(nullif(profile_data->>'age','')::integer,age),
    bmi_report_path=coalesce(nullif(profile_data->>'bmi_report_path',''),bmi_report_path),
    building_number=coalesce(nullif(profile_data->>'building_number',''),building_number),
    street=coalesce(nullif(profile_data->>'street',''),street),
    area=coalesce(nullif(profile_data->>'area',''),area),
    zone_number=coalesce(nullif(profile_data->>'zone_number',''),zone_number),
    delivery_notes=coalesce(nullif(profile_data->>'delivery_notes',''),delivery_notes),
    latitude=coalesce(nullif(profile_data->>'latitude','')::double precision,latitude),
    longitude=coalesce(nullif(profile_data->>'longitude','')::double precision,longitude),
    allergies=coalesce(array(select jsonb_array_elements_text(coalesce(tx.metadata#>'{profile,allergies}','[]'::jsonb))),allergies),
    dislikes=coalesce(array(select jsonb_array_elements_text(coalesce(tx.metadata#>'{profile,dislikes}','[]'::jsonb))),dislikes),
    updated_at=now() where id=sub.id;
  insert into public.weekly_menu_selections
    (subscriber_id,week_start_date,day_of_week,meal_type,dish_id,dish_name,dish_kcals,menu_period)
  select sub.id,(item->>'week_start_date')::date,item->>'day_of_week',item->>'meal_type',
    item->>'dish_id',item->>'dish_name',nullif(item->>'dish_kcals','')::numeric,item->>'menu_period'
  from jsonb_array_elements(coalesce(tx.metadata->'initial_menu_selections','[]'::jsonb)) item
  on conflict (subscriber_id,week_start_date,day_of_week,meal_type) do nothing;
  update public.payment_transactions set status='captured',updated_at=now() where id=tx.id;
  insert into public.payment_logs(tap_charge_id,event_type,payload,severity)
    values (null,'cash_payment_verified',jsonb_build_object('transaction_id',tx.id,'subscriber_id',tx.subscriber_id,'verified_by',auth.uid()),'info');
  return jsonb_build_object('success',true,'subscriber_id',tx.subscriber_id,'expiry',public.add_service_days(starts_at,service_days));
end;
$$;
revoke all on function public.review_cash_payment(uuid) from public,anon;
grant execute on function public.review_cash_payment(uuid) to authenticated;

notify pgrst,'reload schema';
