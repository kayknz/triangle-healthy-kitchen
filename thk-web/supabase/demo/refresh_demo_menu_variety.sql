-- DEMO ONLY. Redistribute existing synthetic demo selections across menu
-- choices. Current published choices take precedence; where the current menu
-- offers only one dish, this uses the most recent older active menu choices.
-- Only subscriber rows marked is_demo=true with the reserved synthetic email
-- prefix are eligible. Live customer selections are never touched.

begin;

-- This one transaction runs in the SQL Editor. The service-role claim is
-- transaction-local so the database selection-window trigger permits this
-- demo-only correction after the weekly customer cutoff.
set local request.jwt.claim.role = 'service_role';

do $$
declare
  v_week_start date;
begin
  select min(m.week_start_date)
    into v_week_start
  from public.weekly_menu_selections m
  join public.subscribers s on s.id = m.subscriber_id
  where s.is_demo is true
    and s.user_id is null
    and s.email like 'thk-demo-%@example.invalid';

  if v_week_start is null then
    raise exception 'No synthetic demo selections found.';
  end if;

  with demo_slots as (
    select distinct m.day_of_week,
           case when m.meal_type in ('snack','snacks','snack_2') then 'snacks' else m.meal_type end as meal_period
    from public.weekly_menu_selections m
    join public.subscribers s on s.id = m.subscriber_id
    where s.is_demo is true and s.user_id is null
      and s.email like 'thk-demo-%@example.invalid'
      and m.week_start_date = v_week_start
  ), current_distinct as (
    select distinct a.day_of_week, a.meal_period, a.collection,
           d.id::text as dish_id, d.name as dish_name, d.kcals
    from public.menu_availability a
    join public.dishes d on d.id = a.dish_id
    left join public.monthly_menu_documents doc on doc.id = a.monthly_menu_id
    where a.is_active
      and a.available_from >= (v_week_start::timestamp at time zone 'Asia/Qatar')
      and a.available_from < ((v_week_start + 7)::timestamp at time zone 'Asia/Qatar')
      and (a.monthly_menu_id is null or doc.status = 'published')
  ), current_choices as (
    select *, count(*) over (partition by day_of_week, meal_period)::integer as choice_count
    from current_distinct
  ), current_counts as (
    select day_of_week, meal_period, max(choice_count)::integer as choice_count
    from current_choices group by day_of_week, meal_period
  ), archived_distinct as (
    select distinct a.day_of_week, a.meal_period, a.collection, a.available_from,
           d.id::text as dish_id, d.name as dish_name, d.kcals
    from public.menu_availability a
    join public.dishes d on d.id = a.dish_id
    where a.is_active
      and a.available_from < ((v_week_start - 7)::timestamp at time zone 'Asia/Qatar')
  ), archived_groups as (
    select day_of_week, meal_period, collection, available_from, count(*)::integer as choice_count
    from archived_distinct
    group by day_of_week, meal_period, collection, available_from
    having count(*) >= 2
  ), archived_ranked as (
    select *, row_number() over (partition by day_of_week, meal_period order by available_from desc, collection) as recency
    from archived_groups
  ), archived_choices as (
    select a.day_of_week, a.meal_period, a.collection, a.dish_id, a.dish_name, a.kcals, r.choice_count
    from archived_ranked r
    join archived_distinct a using (day_of_week, meal_period, collection, available_from)
    where r.recency = 1
  ), selected_choices as (
    select c.day_of_week, c.meal_period, c.collection, c.dish_id, c.dish_name, c.kcals
    from current_choices c
    join current_counts n using (day_of_week, meal_period)
    where n.choice_count >= 2
    union all
    select a.day_of_week, a.meal_period, a.collection, a.dish_id, a.dish_name, a.kcals
    from archived_choices a
    join demo_slots s using (day_of_week, meal_period)
    left join current_counts n using (day_of_week, meal_period)
    where coalesce(n.choice_count, 0) < 2
  ), numbered_choices as (
    select *, row_number() over (partition by day_of_week, meal_period order by dish_name, dish_id)::integer as choice_number,
              count(*) over (partition by day_of_week, meal_period)::integer as choice_count
    from selected_choices
  ), demo_rows as (
    select m.subscriber_id, m.week_start_date, m.day_of_week, m.meal_type,
           case when m.meal_type in ('snack','snacks','snack_2') then 'snacks' else m.meal_type end as meal_period,
           s.email,
           substring(s.email from 10 for 3)::integer as demo_number
    from public.weekly_menu_selections m
    join public.subscribers s on s.id = m.subscriber_id
    where s.is_demo is true and s.user_id is null
      and s.email like 'thk-demo-%@example.invalid'
      and substring(s.email from 10 for 3) ~ '^[0-9]{3}$'
      and m.week_start_date = v_week_start
  ), assignments as (
    select r.subscriber_id, r.week_start_date, r.day_of_week, r.meal_type,
           c.dish_id, c.dish_name, c.kcals, c.collection
    from demo_rows r
    join numbered_choices c using (day_of_week, meal_period)
    where c.choice_number = 1 + mod(r.demo_number - 1 + case when r.meal_type = 'snack_2' then 1 else 0 end, c.choice_count)
  )
  update public.weekly_menu_selections m
     set dish_id = a.dish_id,
         dish_name = a.dish_name,
         dish_name_snapshot = a.dish_name,
         dish_kcals = a.kcals,
         menu_period = a.collection
    from assignments a
   where m.subscriber_id = a.subscriber_id
     and m.week_start_date = a.week_start_date
     and m.day_of_week = a.day_of_week
     and m.meal_type = a.meal_type
     and m.dish_id is distinct from a.dish_id;

end $$;

commit;

select m.week_start_date, m.day_of_week, m.meal_type, m.dish_name,
       count(*) as demo_portions
from public.weekly_menu_selections m
join public.subscribers s on s.id = m.subscriber_id
where s.is_demo is true and s.user_id is null
  and s.email like 'thk-demo-%@example.invalid'
  and m.week_start_date = (
    select min(x.week_start_date)
    from public.weekly_menu_selections x
    join public.subscribers y on y.id = x.subscriber_id
    where y.is_demo is true and y.user_id is null
      and y.email like 'thk-demo-%@example.invalid'
  )
group by m.week_start_date, m.day_of_week, m.meal_type, m.dish_name
order by m.week_start_date, m.day_of_week, m.meal_type, m.dish_name;
