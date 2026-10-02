-- Keep the next service week selectable by rolling the latest complete menu
-- forward when leadership has not published a replacement yet.
create or replace function public.ensure_service_week_menu(
  p_week_start date,
  p_collection text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Qatar')::date;
  v_expected_week date;
  v_active_collection text;
  v_target_start timestamptz;
  v_source_start timestamptz;
  v_source_menu uuid;
  v_week_number integer;
  v_existing integer := 0;
  v_inserted integer := 0;
begin
  select active_season into v_active_collection from public.global_settings limit 1;
  if p_collection not in ('summer','autumn','ramadan') or p_collection is distinct from coalesce(v_active_collection,'autumn') then
    raise exception 'Only the active menu collection can be prepared.' using errcode = '22023';
  end if;

  v_expected_week := v_today + mod(6 - extract(isodow from v_today)::integer + 7, 7);
  if v_expected_week = v_today then v_expected_week := v_expected_week + 7; end if;
  if p_week_start is distinct from v_expected_week then
    raise exception 'Only the upcoming Qatar service week can be prepared.' using errcode = '22023';
  end if;
  v_target_start := p_week_start::timestamp at time zone 'Asia/Qatar';

  perform pg_advisory_xact_lock(hashtextextended(p_collection || ':' || p_week_start::text, 0));

  select count(*) into v_existing
  from public.menu_availability a
  where a.collection = p_collection and a.is_active
    and a.available_from >= v_target_start
    and a.available_from < v_target_start + interval '1 day';
  if v_existing > 0 then
    return jsonb_build_object('ready',true,'used_previous_menu',false,'entries',v_existing);
  end if;

  select a.available_from, a.monthly_menu_id
    into v_source_start, v_source_menu
  from public.menu_availability a
  join public.monthly_menu_documents md on md.id = a.monthly_menu_id
  where a.collection = p_collection and a.is_active
    and a.available_from < v_target_start
  order by a.available_from desc, md.created_at desc
  limit 1;

  if v_source_start is null or v_source_menu is null then
    return jsonb_build_object('ready',false,'used_previous_menu',false,'entries',0);
  end if;

  select coalesce(max(week_number),0) + 1 into v_week_number
  from public.menu_availability where monthly_menu_id = v_source_menu;

  insert into public.menu_availability
    (dish_id,week_number,day_of_week,meal_period,collection,monthly_menu_id,
     is_kitchen_choice,available_from,is_active,metadata)
  select source.dish_id, v_week_number, source.day_of_week, source.meal_period,
         p_collection, v_source_menu, source.is_kitchen_choice, v_target_start,
         true, coalesce(source.metadata,'{}'::jsonb) ||
           jsonb_build_object('fallback_from',v_source_start,'fallback_generated_at',now())
  from public.menu_availability source
  where source.collection = p_collection and source.is_active
    and source.monthly_menu_id = v_source_menu
    and source.available_from = v_source_start
  on conflict (monthly_menu_id,week_number,day_of_week,meal_period,dish_id)
    where monthly_menu_id is not null
  do update set is_active = true, is_kitchen_choice = excluded.is_kitchen_choice,
    available_from = excluded.available_from, metadata = excluded.metadata;

  get diagnostics v_inserted = row_count;
  return jsonb_build_object('ready',v_inserted > 0,'used_previous_menu',v_inserted > 0,
    'entries',v_inserted,'source_menu_id',v_source_menu,'source_week',v_source_start);
end;
$$;
revoke all on function public.ensure_service_week_menu(date,text) from public;
grant execute on function public.ensure_service_week_menu(date,text) to anon, authenticated, service_role;

-- Validate a selection against the menu scheduled for its actual service
-- Saturday. This also accepts a week materialized from the archived menu.
create or replace function public.enforce_weekly_menu_selection_window()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Qatar')::date;
  v_service_start date;
  v_target_start timestamptz;
  v_dish_exists boolean;
begin
  if coalesce(auth.role(),'') = 'service_role' or private.has_staff_role(array['ceo','admin','kitchen']) then return new; end if;
  if extract(isodow from v_today) = 5 then
    raise exception 'Weekly meal selections close Thursday at 11:59 PM Qatar time.' using errcode = 'P0001';
  end if;
  v_service_start := v_today + mod(6 - extract(isodow from v_today)::integer + 7, 7);
  if extract(isodow from v_today) = 6 then v_service_start := v_service_start + 7; end if;
  if new.week_start_date <> v_service_start then
    raise exception 'Selections can only be changed for the upcoming service week.' using errcode = 'P0001';
  end if;
  if new.dish_name = 'SKIP DAY' then return new; end if;
  v_target_start := v_service_start::timestamp at time zone 'Asia/Qatar';
  select exists (
    select 1 from public.menu_availability a join public.dishes d on d.id = a.dish_id
    where a.is_active and a.available_from >= v_target_start
      and a.available_from < v_target_start + interval '1 day'
      and a.day_of_week = new.day_of_week
      and a.meal_period = case when new.meal_type in ('snack','snacks','snack_2') then 'snacks' else new.meal_type end
      and a.collection = coalesce(new.menu_period, (select active_season from public.global_settings limit 1))
      and (d.id::text = new.dish_id or d.name = new.dish_name)
  ) into v_dish_exists;
  if not v_dish_exists then raise exception 'That dish is not in the scheduled menu for this service week.' using errcode = 'P0001'; end if;
  return new;
end;
$$;
notify pgrst,'reload schema';
