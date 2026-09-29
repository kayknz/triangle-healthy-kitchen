-- Restore the A-F portion reference used by kitchen planning.
alter table public.subscribers
  add column if not exists nutrition_category text
  check (nutrition_category is null or nutrition_category in ('A','B','C','D','E','F'));

create or replace view public.kitchen_subscribers_view
with (security_invoker = false, security_barrier = true)
as
  select id, full_name, status, package_id, package_name, area, zone_number,
         building_number, street, delivery_notes, allergies, dislikes,
         nutrition_category
  from public.subscribers
  where private.has_staff_role(array['ceo', 'admin', 'kitchen']);

create or replace view public.kitchen_production_view
with (security_invoker = false, security_barrier = true)
as
  select s.id as subscriber_id,
         s.full_name,
         s.package_id,
         s.package_name,
         s.area,
         s.zone_number,
         s.building_number,
         s.street,
         s.delivery_notes,
         s.allergies,
         s.dislikes,
         m.week_start_date,
         m.day_of_week,
         m.meal_type,
         coalesce(m.dish_name_snapshot, m.dish_name) as dish_name,
         m.dish_kcals,
         m.customizations,
         s.nutrition_category
  from public.weekly_menu_selections as m
  join public.subscribers as s on s.id = m.subscriber_id
  where s.status = 'active'
    and private.has_staff_role(array['ceo', 'admin', 'kitchen']);

grant select on public.kitchen_subscribers_view, public.kitchen_production_view to authenticated;
notify pgrst, 'reload schema';
