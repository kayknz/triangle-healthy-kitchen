-- Client payment, package limits, kitchen production totals, daily delivery,
-- and 30-day inactive-customer retention.

alter table public.packages
  add column if not exists meal_periods jsonb not null
    default '["breakfast","lunch","dinner","snacks"]'::jsonb;
alter table public.packages
  drop constraint if exists packages_meal_periods_array_check;
alter table public.packages
  add constraint packages_meal_periods_array_check
    check (jsonb_typeof(meal_periods) = 'array' and jsonb_array_length(meal_periods) between 1 and 4);
update public.packages set meal_periods = case id
  when '1100kcal' then '["lunch","dinner","snacks"]'::jsonb
  when '1400kcal' then '["breakfast","lunch","dinner"]'::jsonb
  when '2m1s' then '["lunch","dinner","snacks"]'::jsonb
  when '3m' then '["breakfast","lunch","dinner"]'::jsonb
  else '["breakfast","lunch","dinner","snacks"]'::jsonb
end;

alter table public.global_settings
  add column if not exists portion_ranges jsonb not null default
    '{"A":{"min_grams":null,"max_grams":null},"B":{"min_grams":null,"max_grams":null},"C":{"min_grams":null,"max_grams":null},"D":{"min_grams":null,"max_grams":null},"E":{"min_grams":null,"max_grams":null},"F":{"min_grams":null,"max_grams":null}}'::jsonb;

-- The database enforces the meal slots configured by leadership, even if a
-- client tampers with the web or mobile request.
create or replace function private.enforce_package_meal_period()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  allowed_periods jsonb;
  target_package text;
begin
  select package_id into target_package from public.subscribers where id = new.subscriber_id;
  select meal_periods into allowed_periods from public.packages where id = target_package;
  if allowed_periods is null then
    raise exception 'A valid meal package is required before choosing meals.' using errcode = '23514';
  end if;
  if not (allowed_periods ? (case when new.meal_type in ('snack','snacks') then 'snacks' else new.meal_type end)) then
    raise exception 'This meal period is not included in your package.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_package_meal_period() from public, anon, authenticated;
drop trigger if exists enforce_package_meal_period on public.weekly_menu_selections;
create trigger enforce_package_meal_period before insert or update of meal_type, subscriber_id
  on public.weekly_menu_selections for each row execute function private.enforce_package_meal_period();

-- Customer data is no longer exposed to kitchen staff. Kitchen production is
-- an anonymous aggregation by day, dish, modifications, allergy flags, and A-F.
drop view if exists public.kitchen_subscribers_view;
create view public.kitchen_subscribers_view
with (security_invoker = false, security_barrier = true) as
  select id, status, allergies, dislikes, nutrition_category
  from public.subscribers
  where private.has_staff_role(array['ceo','admin','kitchen']);

drop view if exists public.kitchen_production_view;
create view public.kitchen_production_view
with (security_invoker = false, security_barrier = true) as
  select m.week_start_date,
         m.day_of_week,
         m.meal_type,
         coalesce(m.dish_name_snapshot, m.dish_name) as dish_name,
         m.dish_kcals,
         coalesce(m.customizations, '{}'::jsonb) as customizations,
         coalesce(s.nutrition_category, 'Needs category') as nutrition_category,
         count(*)::integer as servings,
         s.allergies as allergy_flags,
         s.dislikes as food_notes
  from public.weekly_menu_selections m
  join public.subscribers s on s.id = m.subscriber_id
  where s.status = 'active'
    and private.has_staff_role(array['ceo','admin','kitchen'])
    and m.dish_name <> 'SKIP DAY'
  group by m.week_start_date, m.day_of_week, m.meal_type,
           coalesce(m.dish_name_snapshot, m.dish_name), m.dish_kcals,
           coalesce(m.customizations, '{}'::jsonb), coalesce(s.nutrition_category, 'Needs category'),
           s.allergies, s.dislikes;
revoke all on public.kitchen_subscribers_view, public.kitchen_production_view from public, anon;
grant select on public.kitchen_subscribers_view, public.kitchen_production_view to authenticated;

-- A single stop carries every meal for one customer on one service date.
with ranked as (
  select id, row_number() over (
    partition by subscriber_id, delivery_date
    order by (status = 'delivered') desc, updated_at desc nulls last, assigned_at desc nulls last, id
  ) as rn
  from public.rider_deliveries
)
delete from public.rider_deliveries d using ranked r where d.id=r.id and r.rn>1;
alter table public.rider_deliveries drop constraint if exists rider_deliveries_subscriber_id_delivery_date_meal_type_key;
update public.rider_deliveries set meal_type = 'all', time_window = 'One daily delivery';
create unique index if not exists rider_deliveries_one_stop_per_customer_day
  on public.rider_deliveries(subscriber_id, delivery_date);

create or replace function public.assign_rider_delivery(
  p_subscriber_id uuid,
  p_rider_application_id uuid,
  p_delivery_date date,
  p_meal_type text default 'all'
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  target_rider_user_id uuid;
  assigned_delivery_id uuid;
begin
  if not private.has_staff_role(array['ceo','admin','transport']) then
    raise exception 'Not authorized to assign deliveries' using errcode = '42501';
  end if;
  select user_id into target_rider_user_id from public.rider_applications
    where id = p_rider_application_id and approved is true;
  if target_rider_user_id is null then raise exception 'Rider is not approved' using errcode = '22023'; end if;
  if not exists (select 1 from public.subscribers where id=p_subscriber_id and status='active') then
    raise exception 'Active customer not found' using errcode = 'P0002';
  end if;
  insert into public.rider_deliveries (
    subscriber_id,rider_application_id,rider_user_id,delivery_date,meal_type,time_window,status
  ) values (
    p_subscriber_id,p_rider_application_id,target_rider_user_id,p_delivery_date,'all','One daily delivery','pending'
  ) on conflict (subscriber_id,delivery_date) do update set
    rider_application_id=excluded.rider_application_id,
    rider_user_id=excluded.rider_user_id,
    meal_type='all',time_window='One daily delivery',status='pending',updated_at=now()
  returning id into assigned_delivery_id;
  return assigned_delivery_id;
end;
$$;
revoke all on function public.assign_rider_delivery(uuid,uuid,date,text) from public,anon;
grant execute on function public.assign_rider_delivery(uuid,uuid,date,text) to authenticated;

-- Generalize the transaction ledger to include pre-paid cash collections.
alter table public.payment_transactions add column if not exists payment_provider text not null default 'tap';
alter table public.payment_transactions alter column subscriber_id drop not null;
alter table public.payment_transactions drop constraint if exists payment_transactions_subscriber_id_fkey;
alter table public.payment_transactions add constraint payment_transactions_subscriber_id_fkey
  foreign key (subscriber_id) references public.subscribers(id) on delete set null;

create or replace function public.review_cash_payment(p_transaction_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  tx public.payment_transactions%rowtype;
  sub public.subscribers%rowtype;
  pkg public.packages%rowtype;
  service_days integer;
  starts_at timestamptz;
  profile_data jsonb;
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
  if not found or abs(pkg.price-tx.amount)>0.01 or pkg.currency<>tx.currency then
    raise exception 'Cash amount does not match the selected package.' using errcode = '22023';
  end if;
  service_days := case
    when pkg.duration ilike '%1 day%' then 1
    when pkg.duration ilike '%1 week%' or pkg.duration ilike '%6 day%' then 6
    when pkg.duration ilike '%4 week%' or pkg.duration ilike '%24 service%' then 24
    else null end;
  if service_days is null then raise exception 'Package duration needs an Admin update.' using errcode = '22023'; end if;
  starts_at := case when sub.status='active' and sub.current_period_end>now() then sub.current_period_end else now() end;
  profile_data := coalesce(tx.metadata->'profile','{}'::jsonb);
  update public.subscribers set status='active',package_id=pkg.id,package_name=pkg.name,
    payment_provider='cash',payment_status='Paid',subscription_start=coalesce(subscription_start,now()),
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
    allergies=case when jsonb_typeof(tx.metadata#>'{profile,allergies}')='array' and jsonb_array_length(tx.metadata#>'{profile,allergies}')>0 then array(select jsonb_array_elements_text(tx.metadata#>'{profile,allergies}')) else allergies end,
    dislikes=case when jsonb_typeof(tx.metadata#>'{profile,dislikes}')='array' and jsonb_array_length(tx.metadata#>'{profile,dislikes}')>0 then array(select jsonb_array_elements_text(tx.metadata#>'{profile,dislikes}')) else dislikes end,
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

-- Remove inactive customer personal data after a 30-day renewal grace window.
-- Preserve only de-identified amounts, currency, status, and dates for audit.
alter table public.subscribers alter column user_id drop not null;
create or replace function private.delete_expired_client_data()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  client record;
  deleted_count integer := 0;
begin
  for client in
    select s.id,s.user_id,s.bmi_report_path
    from public.subscribers s
    where s.user_id is not null
      and s.is_owner is not true
      and s.current_period_end is not null
      and s.current_period_end < now() - interval '30 days'
      and not exists (select 1 from private.staff_members st where st.user_id=s.user_id)
      and not exists (select 1 from public.rider_applications r where r.user_id=s.user_id)
  loop
    delete from public.payment_logs l using public.payment_transactions p
      where p.subscriber_id=client.id
        and (l.tap_charge_id=p.tap_charge_id or l.payload->>'transaction_id'=p.id::text);
    update public.payment_transactions set subscriber_id=null,metadata='{}'::jsonb
      where subscriber_id=client.id;
    if client.bmi_report_path is not null then
      delete from storage.objects where bucket_id='bmi-reports' and name=client.bmi_report_path;
    end if;
    delete from auth.users where id=client.user_id;
    deleted_count := deleted_count + 1;
  end loop;
  return deleted_count;
end;
$$;
revoke all on function private.delete_expired_client_data() from public,anon,authenticated;
do $$
begin
  if not exists (select 1 from cron.job where jobname='delete-expired-client-data-daily') then
    perform cron.schedule('delete-expired-client-data-daily','30 0 * * *',
      'select private.delete_expired_client_data()');
  end if;
end;
$$;

notify pgrst,'reload schema';
