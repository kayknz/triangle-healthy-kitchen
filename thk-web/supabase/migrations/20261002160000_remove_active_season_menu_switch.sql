-- Menu releases are authoritative. The old global active_season setting could
-- hide a published menu and block signup, so choose the scheduled release (or
-- roll the newest prior/archived release forward) for the requested week.
create or replace function public.ensure_service_week_menu(
  p_week_start date,
  p_collection text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Qatar')::date;
  v_expected_week date;
  v_target_start timestamptz;
  v_target_menu uuid;
  v_target_collection text;
  v_source_start timestamptz;
  v_source_menu uuid;
  v_source_collection text;
  v_week_number integer;
  v_inserted integer := 0;
  v_slots integer := 0;
  v_friday_slots integer := 0;
begin
  v_expected_week := v_today + mod(6 - extract(isodow from v_today)::integer + 7, 7);
  if v_expected_week = v_today then v_expected_week := v_expected_week + 7; end if;
  if p_week_start is distinct from v_expected_week then
    raise exception 'Only the upcoming Qatar service week can be prepared.' using errcode = '22023';
  end if;

  v_target_start := p_week_start::timestamp at time zone 'Asia/Qatar';
  perform pg_advisory_xact_lock(hashtextextended('service-menu:' || p_week_start::text, 0));

  -- Prefer a menu explicitly scheduled for this week, independent of the old
  -- active_season toggle. Otherwise the prior week's archive is the source.
  select md.id, md.collection
    into v_target_menu, v_target_collection
  from public.menu_availability a
  join public.monthly_menu_documents md on md.id = a.monthly_menu_id
  where a.is_active
    and a.available_from >= v_target_start
    and a.available_from < v_target_start + interval '1 day'
  order by md.created_at desc, a.available_from desc
  limit 1;

  select a.available_from, a.monthly_menu_id, a.collection
    into v_source_start, v_source_menu, v_source_collection
  from public.menu_availability a
  join public.monthly_menu_documents md on md.id = a.monthly_menu_id
  where a.available_from < v_target_start
    and (v_target_menu is null or a.monthly_menu_id <> v_target_menu)
  order by a.available_from desc,
           (md.status = 'archived') desc,
           md.created_at desc
  limit 1;

  if v_target_collection is null then
    v_target_collection := v_source_collection;
  end if;

  if v_source_start is not null and v_source_menu is not null and v_target_collection is not null then
    select coalesce(max(week_number),0) + 1 into v_week_number
    from public.menu_availability where monthly_menu_id = v_source_menu;

    insert into public.menu_availability
      (dish_id,week_number,day_of_week,meal_period,collection,monthly_menu_id,
       is_kitchen_choice,available_from,is_active,metadata)
    select source.dish_id, v_week_number, source.day_of_week, source.meal_period,
           v_target_collection, v_source_menu, source.is_kitchen_choice, v_target_start,
           true, coalesce(source.metadata,'{}'::jsonb) || jsonb_build_object(
             'fallback_from',v_source_start,
             'fallback_from_collection',v_source_collection,
             'fallback_generated_at',now())
    from public.menu_availability source
    where source.monthly_menu_id = v_source_menu
      and source.collection = v_source_collection
      and source.available_from = v_source_start
      and not exists (
        select 1 from public.menu_availability target
        where target.is_active
          and target.available_from >= v_target_start
          and target.available_from < v_target_start + interval '1 day'
          and target.collection = v_target_collection
          and target.day_of_week = source.day_of_week
          and target.meal_period = source.meal_period
      )
    on conflict (monthly_menu_id,week_number,day_of_week,meal_period,dish_id)
      where monthly_menu_id is not null
    do update set is_active = true, is_kitchen_choice = excluded.is_kitchen_choice,
      available_from = excluded.available_from, collection = excluded.collection,
      metadata = excluded.metadata;
    get diagnostics v_inserted = row_count;
  end if;

  select count(distinct a.day_of_week || '|' || a.meal_period),
         count(distinct a.day_of_week || '|' || a.meal_period) filter (where a.day_of_week = 'Friday')
    into v_slots, v_friday_slots
  from public.menu_availability a
  where a.is_active and a.collection = v_target_collection
    and a.available_from >= v_target_start
    and a.available_from < v_target_start + interval '1 day';

  return jsonb_build_object('ready',v_slots >= 24,'used_previous_menu',v_inserted > 0,
    'entries_added',v_inserted,'available_slots',v_slots,'friday_slots',v_friday_slots,
    'collection',v_target_collection,'source_menu_id',v_source_menu,
    'source_week',v_source_start,'source_collection',v_source_collection);
end;
$$;
revoke all on function public.ensure_service_week_menu(date,text) from public;
grant execute on function public.ensure_service_week_menu(date,text) to anon, authenticated, service_role;

-- Selection validity depends on the actual menu on that service week, not a
-- separate, possibly stale, season flag.
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
      and (new.menu_period is null or a.collection = new.menu_period)
      and (d.id::text = new.dish_id or d.name = new.dish_name)
  ) into v_dish_exists;
  if not v_dish_exists then raise exception 'That dish is not in the scheduled menu for this service week.' using errcode = 'P0001'; end if;
  return new;
end;
$$;
notify pgrst,'reload schema';
