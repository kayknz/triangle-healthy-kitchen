-- DEMO ONLY. Run manually in the Supabase SQL Editor; this is not a migration.
-- Creates 60 clearly labelled synthetic, paused subscribers with no auth accounts
-- and no payment records, then gives them sample menu choices for the next service week.
-- Cleanup is limited to the synthetic email/name marker in cleanup_50_demo_customers.sql.
-- After inserting, also run refresh_demo_menu_variety.sql. It spreads existing
-- synthetic choices across available menu dishes, with an archived-menu fallback.

begin;

do $$
begin
  if exists (select 1 from public.subscribers where email like 'thk-demo-%@example.invalid') then
    raise exception 'THK demo rows already exist. Clean them up before seeding again.';
  end if;
  if not exists (select 1 from public.packages where active) then
    raise exception 'No active packages are available.';
  end if;
end
$$;

with packages_ranked as (
  select id, name,
         row_number() over (order by sort_order, id) as package_number,
         count(*) over () as package_count
  from public.packages where active
), demo_rows as (
  select g.n, p.id as package_id, p.name as package_name
  from generate_series(1, 60) as g(n)
  join packages_ranked p on p.package_number = 1 + mod(g.n - 1, p.package_count)
)
insert into public.subscribers (
  user_id, email, full_name, package_id, package_name, status, is_demo,
  gender, age, weight_kg, height_cm, fitness_goal, allergies, dislikes,
  nutrition_category, building_number, street, area, zone_number,
  delivery_notes, onboarding_completed
)
select null,
       'thk-demo-' || lpad(n::text, 3, '0') || '@example.invalid',
       'DEMO Customer ' || lpad(n::text, 3, '0'), package_id, package_name, 'paused', true,
       case when mod(n, 2) = 0 then 'female' else 'male' end,
       22 + mod(n * 7, 39), 48 + mod(n * 13, 54), 150 + mod(n * 11, 49),
       case mod(n, 4) when 0 then 'Build muscle' when 1 then 'Lose weight'
         when 2 then 'Improve health' else 'Maintain weight' end,
       case when mod(n, 9) = 0 then array['Dairy']::text[]
            when mod(n, 13) = 0 then array['Peanuts']::text[] else '{}'::text[] end,
       case when mod(n, 5) = 0 then array['Onions']::text[] else '{}'::text[] end,
       (array['A','B','C','D','E','F'])[1 + mod(n - 1, 6)],
       (100 + mod(n * 3, 80))::text, 'Demo Street ' || (1 + mod(n, 12)),
       (array['Lusail','The Pearl','West Bay','Al Sadd','Msheireb','Al Wakrah'])[1 + mod(n - 1, 6)],
       case when mod(n, 11) = 0 then null else (1 + mod(n - 1, 10))::text end,
       case when mod(n, 5) = 0 then 'DEMO: omit onions where possible'
            else 'DEMO DELIVERY — no real order' end,
       true
from demo_rows;

with service_week as (
  select min((m.available_from at time zone 'Asia/Qatar')::date) as week_start
  from public.menu_availability m
  left join public.monthly_menu_documents doc on doc.id = m.monthly_menu_id
  where m.is_active
    and (m.available_from at time zone 'Asia/Qatar')::date >= (now() at time zone 'Asia/Qatar')::date
    and (m.monthly_menu_id is null or doc.status = 'published')
), choices as (
  select m.day_of_week, m.meal_period, m.collection,
         d.id::text as dish_id, d.name as dish_name, d.kcals,
         row_number() over (partition by m.day_of_week, m.meal_period order by d.name, d.id)::integer as choice_number,
         count(*) over (partition by m.day_of_week, m.meal_period)::integer as choice_count
  from public.menu_availability m
  join public.dishes d on d.id = m.dish_id
  left join public.monthly_menu_documents doc on doc.id = m.monthly_menu_id
  cross join service_week w
  where m.is_active
    and m.available_from >= (w.week_start::timestamp at time zone 'Asia/Qatar')
    and m.available_from < ((w.week_start + 7)::timestamp at time zone 'Asia/Qatar')
    and (m.monthly_menu_id is null or doc.status = 'published')
), service_days(day_of_week) as (
  values ('Saturday'), ('Sunday'), ('Monday'), ('Tuesday'), ('Wednesday'), ('Thursday')
)
insert into public.weekly_menu_selections (
  subscriber_id, week_start_date, day_of_week, meal_type,
  dish_id, dish_name, dish_kcals, menu_period, dish_name_snapshot
)
select s.id, w.week_start, day.day_of_week,
       case when period.meal_period = 'snacks' then 'snack' else period.meal_period end,
       choice.dish_id, choice.dish_name, choice.kcals, choice.collection, choice.dish_name
from public.subscribers s
join public.packages p on p.id = s.package_id
cross join service_week w
join service_days day on (s.package_id <> 'daily_trial' or day.day_of_week = 'Saturday')
cross join lateral jsonb_array_elements_text(p.meal_periods) as period(meal_period)
join choices choice on choice.day_of_week = day.day_of_week
  and choice.meal_period = period.meal_period
  and choice.choice_number = 1 + mod(substring(s.email from 10 for 3)::integer - 1, choice.choice_count)
where s.email like 'thk-demo-%@example.invalid'
on conflict (subscriber_id, week_start_date, day_of_week, meal_type) do nothing;

commit;

select count(*) as demo_customers,
       count(*) filter (where status = 'paused') as paused_demo_customers
from public.subscribers where email like 'thk-demo-%@example.invalid';

select week_start_date, meal_type, dish_name, count(*) as weekly_servings
from public.weekly_menu_selections
where subscriber_id in (select id from public.subscribers where email like 'thk-demo-%@example.invalid')
group by week_start_date, meal_type, dish_name
order by week_start_date, meal_type, dish_name;
