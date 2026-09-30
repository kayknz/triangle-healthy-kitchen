-- Monthly menu publishing with a private PDF source and authoritative dishes.
create table if not exists public.monthly_menu_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  month_start date not null,
  source_filename text not null,
  storage_path text not null unique,
  collection text not null check (collection in ('summer','autumn','ramadan')),
  available_from timestamptz not null,
  status text not null default 'published' check (status in ('published','archived')),
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.menu_availability
  add column if not exists monthly_menu_id uuid references public.monthly_menu_documents(id) on delete cascade,
  add column if not exists is_kitchen_choice boolean not null default false,
  add column if not exists available_from timestamptz not null default '2020-01-01 00:00:00+00';

alter table public.menu_availability
  drop constraint if exists menu_availability_week_number_day_of_week_meal_period_collection_dish_id_key;
-- PostgreSQL truncates long generated constraint names; this is the actual
-- name used by the existing production schema.
alter table public.menu_availability
  drop constraint if exists menu_availability_week_number_day_of_week_meal_period_colle_key;
create unique index if not exists menu_availability_monthly_unique
  on public.menu_availability (monthly_menu_id, week_number, day_of_week, meal_period, dish_id)
  where monthly_menu_id is not null;
create unique index if not exists menu_availability_legacy_unique
  on public.menu_availability (week_number, day_of_week, meal_period, collection, dish_id)
  where monthly_menu_id is null;

alter table public.monthly_menu_documents enable row level security;
drop policy if exists monthly_menu_read_published on public.monthly_menu_documents;
create policy monthly_menu_read_published on public.monthly_menu_documents
  for select to authenticated, anon using (status = 'published' and available_from <= now());
drop policy if exists monthly_menu_leaders_manage on public.monthly_menu_documents;
create policy monthly_menu_leaders_manage on public.monthly_menu_documents
  for all to authenticated
  using (private.has_staff_role(array['ceo','admin']))
  with check (private.has_staff_role(array['ceo','admin']));
grant select, insert, update, delete on public.monthly_menu_documents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('monthly-menu-pdfs','monthly-menu-pdfs',false,20971520,array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 20971520,
  allowed_mime_types = array['application/pdf'];

drop policy if exists monthly_menu_pdf_leaders_insert on storage.objects;
create policy monthly_menu_pdf_leaders_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'monthly-menu-pdfs' and private.has_staff_role(array['ceo','admin']));
drop policy if exists monthly_menu_pdf_leaders_update on storage.objects;
create policy monthly_menu_pdf_leaders_update on storage.objects for update to authenticated
  using (bucket_id = 'monthly-menu-pdfs' and private.has_staff_role(array['ceo','admin']))
  with check (bucket_id = 'monthly-menu-pdfs' and private.has_staff_role(array['ceo','admin']));
drop policy if exists monthly_menu_pdf_leaders_delete on storage.objects;
create policy monthly_menu_pdf_leaders_delete on storage.objects for delete to authenticated
  using (bucket_id = 'monthly-menu-pdfs' and private.has_staff_role(array['ceo','admin']));
drop policy if exists monthly_menu_pdf_leaders_read on storage.objects;
create policy monthly_menu_pdf_leaders_read on storage.objects for select to authenticated
  using (bucket_id = 'monthly-menu-pdfs' and private.has_staff_role(array['ceo','admin']));
drop policy if exists monthly_menu_pdf_read_published on storage.objects;
create policy monthly_menu_pdf_read_published on storage.objects for select to authenticated, anon
  using (bucket_id = 'monthly-menu-pdfs' and exists (
    select 1 from public.monthly_menu_documents d
    where d.storage_path = name and d.status = 'published' and d.available_from <= now()
  ));

create or replace function public.publish_monthly_menu(
  p_title text, p_month_start date, p_source_filename text, p_storage_path text,
  p_collection text, p_items jsonb, p_repeat_single_week boolean default false
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_document_id uuid;
  v_item jsonb;
  v_dish_id uuid;
  v_slug text;
  v_name text;
  v_day text;
  v_meal text;
  v_kcals integer;
  v_week integer;
  v_available_on date;
  v_days_until_saturday integer;
  v_first_release date;
  v_repeat integer;
  v_count integer := 0;
begin
  if not private.has_staff_role(array['ceo','admin']) then
    raise exception 'Only company leadership can publish monthly menus.' using errcode = '42501';
  end if;
  if p_collection not in ('summer','autumn','ramadan') then raise exception 'Invalid menu collection.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 24 then
    raise exception 'The PDF preview must contain at least 24 meal choices.';
  end if;

  v_available_on := (now() at time zone 'Asia/Qatar')::date;
  v_days_until_saturday := mod(6 - extract(isodow from v_available_on)::integer + 7, 7);
  if v_days_until_saturday = 0 then v_days_until_saturday := 7; end if;
  v_available_on := v_available_on + v_days_until_saturday;
  v_first_release := v_available_on;

  -- A replacement monthly PDF owns its four upcoming release weeks. Retire
  -- older menu rows in that same window so clients never see duplicate dishes.
  update public.menu_availability
     set is_active = false
   where collection = p_collection
     and available_from >= (v_first_release::timestamp at time zone 'Asia/Qatar')
     and available_from < ((v_first_release + 28)::timestamp at time zone 'Asia/Qatar');
  update public.monthly_menu_documents
     set status = 'archived'
   where collection = p_collection
     and available_from >= (v_first_release::timestamp at time zone 'Asia/Qatar')
     and available_from < ((v_first_release + 28)::timestamp at time zone 'Asia/Qatar');

  insert into public.monthly_menu_documents
    (title, month_start, source_filename, storage_path, collection, available_from, uploaded_by)
  values
    (left(trim(p_title),100), date_trunc('month',p_month_start)::date, left(p_source_filename,255),
     p_storage_path, p_collection, v_available_on::timestamp at time zone 'Asia/Qatar', auth.uid())
  returning id into v_document_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_name := left(trim(v_item->>'name'),160);
    v_day := v_item->>'day_of_week';
    v_meal := v_item->>'meal_period';
    v_kcals := greatest(0, least(5000, coalesce((v_item->>'kcals')::integer,0)));
    v_week := coalesce((v_item->>'week_number')::integer,1);
    if v_day not in ('Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday')
      or v_meal not in ('breakfast','lunch','dinner','snacks')
      or v_name = '' or v_kcals = 0 or v_week not between 1 and 4 then
      raise exception 'Invalid parsed menu entry.';
    end if;
    v_slug := trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'));
    if v_slug = '' then v_slug := 'menu-' || substr(md5(v_name),1,12); end if;
    select id into v_dish_id from public.dishes where slug = v_slug or lower(name) = lower(v_name) limit 1;
    if v_dish_id is null then
      insert into public.dishes (slug,name,kcals,macros,allergens)
      values (v_slug,v_name,v_kcals,'{"protein":0,"carbs":0,"fats":0}'::jsonb,'{}'::text[])
      returning id into v_dish_id;
    else
      update public.dishes set kcals = v_kcals, is_active = true where id = v_dish_id;
    end if;
    for v_repeat in select generate_series(1,case when p_repeat_single_week then 4 else 1 end) loop
      insert into public.menu_availability
        (dish_id,week_number,day_of_week,meal_period,collection,monthly_menu_id,is_kitchen_choice,available_from,metadata)
      values (v_dish_id, case when p_repeat_single_week then v_repeat else v_week end,
        v_day,v_meal,p_collection,v_document_id,coalesce((v_item->>'kitchen_choice')::boolean,false),
        (v_available_on + (case when p_repeat_single_week then v_repeat else v_week end - 1) * 7)::timestamp at time zone 'Asia/Qatar',
        jsonb_build_object('source','monthly_pdf','month_start',date_trunc('month',p_month_start)::date))
      on conflict (monthly_menu_id,week_number,day_of_week,meal_period,dish_id)
        where monthly_menu_id is not null
      do update set is_active = true, is_kitchen_choice = excluded.is_kitchen_choice,
        available_from = excluded.available_from,
        metadata = excluded.metadata;
      v_count := v_count + 1;
    end loop;
    v_dish_id := null;
  end loop;

  return jsonb_build_object('id',v_document_id,'available_from',v_available_on,'entries',v_count);
end;
$$;
revoke all on function public.publish_monthly_menu(text,date,text,text,text,jsonb,boolean) from public, anon;
grant execute on function public.publish_monthly_menu(text,date,text,text,text,jsonb,boolean) to authenticated;

-- Ingredient order is calculated from recipe ingredients and paid customer
-- selections. Quantities are recipe amounts per serving, maintained in the
-- existing meal_ingredient_config registry.
alter table public.meal_ingredient_config
  add column if not exists quantity_per_serving numeric(12,3) not null default 0,
  add column if not exists unit text not null default 'g';
update public.meal_ingredient_config set quantity_per_serving = 0 where quantity_per_serving is null;
update public.meal_ingredient_config set unit = 'g' where unit is null or btrim(unit) = '';
drop policy if exists leaders_manage_ingredients on public.ingredients;
create policy leaders_manage_ingredients on public.ingredients
  for all to authenticated using (private.has_staff_role(array['ceo','admin']))
  with check (private.has_staff_role(array['ceo','admin']));
drop policy if exists leaders_manage_meal_ingredient_config on public.meal_ingredient_config;
create policy leaders_manage_meal_ingredient_config on public.meal_ingredient_config
  for all to authenticated using (private.has_staff_role(array['ceo','admin']))
  with check (private.has_staff_role(array['ceo','admin']));
grant select,insert,update,delete on public.ingredients, public.meal_ingredient_config to authenticated;

create or replace view public.kitchen_ingredient_order_view
with (security_invoker = false, security_barrier = true)
as
  select m.week_start_date,
         i.id as ingredient_id,
         i.name as ingredient_name,
         i.name_ar as ingredient_name_ar,
         mic.unit,
         sum(mic.quantity_per_serving)::numeric(12,3) as quantity_to_order,
         count(*)::integer as meal_servings
  from public.weekly_menu_selections m
  join public.subscribers s on s.id = m.subscriber_id and s.status = 'active'
  join public.dishes d on d.id::text = m.dish_id or d.slug = m.dish_id or lower(d.name) = lower(m.dish_name)
  join public.meal_ingredient_config mic on mic.dish_slug = d.slug
  join public.ingredients i on i.slug = mic.ingredient_slug
  where m.dish_name <> 'SKIP DAY'
    and mic.quantity_per_serving > 0
    and private.has_staff_role(array['ceo','admin','kitchen'])
  group by m.week_start_date, i.id, i.name, i.name_ar, mic.unit;

revoke all on public.kitchen_ingredient_order_view from public, anon;
grant select on public.kitchen_ingredient_order_view to authenticated;

-- When the Thursday selection window has closed, fill missing meals with the
-- chef-designated choice so production planning is complete for Friday prep.
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
  select distinct on (s.id, ((m.available_from at time zone 'Asia/Qatar')::date + 7), m.day_of_week, m.meal_period) s.id,
         ((m.available_from at time zone 'Asia/Qatar')::date + 7),
         m.day_of_week,
         case when m.meal_period = 'snacks' then 'snack' else m.meal_period end,
         d.id::text,d.name,d.kcals,m.collection
  from public.menu_availability m
  join public.dishes d on d.id = m.dish_id
  join public.subscribers s on s.status = 'active'
  where ((m.available_from at time zone 'Asia/Qatar')::date = v_today - 6)
    and m.is_active and m.is_kitchen_choice
    and m.meal_period in ('breakfast','lunch','dinner','snacks')
  order by s.id, ((m.available_from at time zone 'Asia/Qatar')::date + 7), m.day_of_week, m.meal_period, m.dish_id
  on conflict (subscriber_id,week_start_date,day_of_week,meal_type) do nothing;
  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;
revoke all on function public.apply_kitchen_choice_defaults() from public, anon, authenticated;
grant execute on function public.apply_kitchen_choice_defaults() to service_role;

create or replace function public.enforce_weekly_menu_selection_window()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Qatar')::date;
  v_day_number integer;
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
    select 1 from public.menu_availability a
      join public.dishes d on d.id = a.dish_id
    where a.is_active
      and a.day_of_week = new.day_of_week
      and a.meal_period = case when new.meal_type in ('snack','snacks') then 'snacks' else new.meal_type end
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
drop trigger if exists validate_weekly_menu_selection_window on public.weekly_menu_selections;
create trigger validate_weekly_menu_selection_window
  before insert or update on public.weekly_menu_selections
  for each row execute function public.enforce_weekly_menu_selection_window();

create table if not exists public.weekly_menu_reminders (
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  week_start_date date not null,
  sent_at timestamptz not null default now(),
  primary key (subscriber_id,week_start_date)
);
alter table public.weekly_menu_reminders enable row level security;
revoke all on public.weekly_menu_reminders from public, anon, authenticated;
grant select,insert on public.weekly_menu_reminders to service_role;

-- Qatar Friday 00:10 (Thursday 21:10 UTC), after the Thursday 23:59 menu cutoff.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
do $$ begin
  perform cron.unschedule('thk-kitchen-choice-defaults');
exception when others then null;
end $$;
select cron.schedule('thk-kitchen-choice-defaults','10 21 * * 4',
  $$select public.apply_kitchen_choice_defaults();$$);

-- The same Brevo-backed function sends the Wednesday menu deadline reminder.
do $$ begin
  perform cron.unschedule('send-reminders-job');
exception when others then null;
end $$;
select cron.schedule('send-reminders-job','*/30 * * * *',
  $$select net.http_post(
      url := 'https://teguqlkfmchxucedxvpu.supabase.co/functions/v1/send-reminders',
      headers := jsonb_build_object('Content-Type','application/json'),
      body := '{}'::jsonb
    );$$);

notify pgrst, 'reload schema';
