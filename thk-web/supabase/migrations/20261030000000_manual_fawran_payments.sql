begin;

alter table public.global_settings
  add column if not exists fawran_alias text,
  add column if not exists fawran_account_name text;

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
  payment_label text;
begin
  if not private.has_staff_role(array['ceo','admin']) then
    raise exception 'Only Admin or CEO can verify manual payments.' using errcode = '42501';
  end if;
  select * into tx from public.payment_transactions where id=p_transaction_id for update;
  if not found then raise exception 'Payment request not found.' using errcode = 'P0002'; end if;
  if tx.payment_provider not in ('cash','fawran') then raise exception 'This request is not a manual payment.' using errcode = '22023'; end if;
  if tx.status = 'captured' then return jsonb_build_object('success',true,'note','already_verified'); end if;
  if tx.status <> 'pending' then raise exception 'Only pending manual payments can be verified.' using errcode = '22023'; end if;
  select * into sub from public.subscribers where id=tx.subscriber_id for update;
  if not found then raise exception 'Customer account has expired.' using errcode = 'P0002'; end if;
  select * into pkg from public.packages where id=tx.metadata->>'package_id' and active;
  friday_delivery := coalesce((tx.metadata#>>'{profile,friday_delivery_addon}')::boolean,false);
  if not found or abs(pkg.price + case when friday_delivery then 199 else 0 end - tx.amount)>0.01 or pkg.currency<>tx.currency then
    raise exception 'Manual payment amount does not match the selected package.' using errcode = '22023';
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
  payment_label := case when tx.payment_provider = 'fawran' then 'Fawran transfer' else 'Cash collection' end;
  perform set_config('thk.authorized_subscriber_update', 'true', true);
  update public.subscribers set status='active',package_id=pkg.id,package_name=pkg.name,
    payment_provider=tx.payment_provider,payment_status='Paid',friday_delivery_addon=friday_delivery,subscription_start=coalesce(subscription_start,now()),
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
    values (null,case when tx.payment_provider='fawran' then 'fawran_transfer_verified' else 'cash_payment_verified' end,
      jsonb_build_object('transaction_id',tx.id,'subscriber_id',tx.subscriber_id,'verified_by',auth.uid(),'payment_method',payment_label),'info');
  return jsonb_build_object('success',true,'subscriber_id',tx.subscriber_id,'expiry',public.add_service_days(starts_at,service_days));
end;
$$;

revoke all on function public.review_cash_payment(uuid) from public, anon;
grant execute on function public.review_cash_payment(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
