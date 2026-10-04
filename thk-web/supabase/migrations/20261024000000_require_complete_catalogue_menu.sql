-- Block incomplete catalogue menus at the database boundary as well as in the kitchen UI.
-- A publish requires all 7 service days × 4 meal periods × 3 distinct dishes,
-- and one kitchen default for every slot.

begin;

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

-- Also guard legacy/document publishing paths. The check is deferred until the
-- transaction commits so a publisher can create the document and its menu rows
-- in one RPC transaction, while incomplete documents are rolled back.
create or replace function private.assert_monthly_menu_complete()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_document_id uuid := new.id;
  v_week integer;
  v_day text;
  v_meal text;
begin
  for v_week in 1..4 loop
    foreach v_day in array array['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'] loop
      foreach v_meal in array array['breakfast','lunch','dinner','snacks'] loop
        if (select count(distinct ma.dish_id)
              from public.menu_availability ma
              join public.dishes d on d.id = ma.dish_id and d.is_active
             where ma.monthly_menu_id = v_document_id
               and ma.week_number = v_week
               and ma.day_of_week = v_day
               and ma.meal_period = v_meal
               and ma.is_active) <> 3
           or (select count(*)
                 from public.menu_availability ma
                 join public.dishes d on d.id = ma.dish_id and d.is_active
                where ma.monthly_menu_id = v_document_id
                  and ma.week_number = v_week
                  and ma.day_of_week = v_day
                  and ma.meal_period = v_meal
                  and ma.is_active
                  and ma.is_kitchen_choice) <> 1 then
          raise exception 'Monthly menu is incomplete: week %, %, % must have three active dishes and one kitchen default.',
            v_week, v_day, v_meal using errcode = '23514';
        end if;
      end loop;
    end loop;
  end loop;
  return null;
end;
$$;

drop trigger if exists monthly_menu_must_be_complete on public.monthly_menu_documents;
create constraint trigger monthly_menu_must_be_complete
after insert on public.monthly_menu_documents
deferrable initially deferred
for each row execute function private.assert_monthly_menu_complete();

notify pgrst, 'reload schema';

commit;
