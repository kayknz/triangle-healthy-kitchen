-- Operations dashboard access and role-safe production data.
-- Transport needs zone_number for routing. Kitchen receives only the fields
-- required to prepare and pack meals, never the wider subscriber profile.

create or replace view public.transport_subscribers_view
with (security_invoker = false, security_barrier = true)
as
  select id, full_name, phone, status, area, building_number, street,
         latitude, longitude, delivery_notes, breakfast_window, lunch_window,
         dinner_window, package_id, package_name, zone_number
  from public.subscribers
  where private.has_staff_role(array['ceo', 'admin', 'transport']);

revoke all on public.transport_subscribers_view from public, anon;
grant select on public.transport_subscribers_view to authenticated;

create or replace view public.kitchen_subscribers_view
with (security_invoker = false, security_barrier = true)
as
  select id, full_name, status, package_id, package_name, area, zone_number,
         building_number, street, delivery_notes, allergies, dislikes
  from public.subscribers
  where private.has_staff_role(array['ceo', 'admin', 'kitchen']);

revoke all on public.kitchen_subscribers_view from public, anon;
grant select on public.kitchen_subscribers_view to authenticated;

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
         m.customizations
  from public.weekly_menu_selections as m
  join public.subscribers as s on s.id = m.subscriber_id
  where s.status = 'active'
    and private.has_staff_role(array['ceo', 'admin', 'kitchen']);

revoke all on public.kitchen_production_view from public, anon;
grant select on public.kitchen_production_view to authenticated;

-- The menu is public to read, but only company leadership may change its
-- authoritative dish catalogue or schedule. Existing customer select policies
-- remain in place.
drop policy if exists staff_manage_dishes on public.dishes;
create policy staff_manage_dishes on public.dishes
  for all to authenticated
  using (private.has_staff_role(array['ceo', 'admin']))
  with check (private.has_staff_role(array['ceo', 'admin']));

drop policy if exists staff_manage_menu_availability on public.menu_availability;
create policy staff_manage_menu_availability on public.menu_availability
  for all to authenticated
  using (private.has_staff_role(array['ceo', 'admin']))
  with check (private.has_staff_role(array['ceo', 'admin']));

-- Staff may see inactive plans in the plan editor; only leadership may change
-- the public catalogue.
drop policy if exists staff_read_all_packages on public.packages;
create policy staff_read_all_packages on public.packages
  for select to authenticated
  using (private.has_staff_role(array['ceo', 'admin', 'kitchen', 'transport']));

drop policy if exists leaders_manage_packages on public.packages;
create policy leaders_manage_packages on public.packages
  for all to authenticated
  using (private.has_staff_role(array['ceo', 'admin']))
  with check (private.has_staff_role(array['ceo', 'admin']));

grant select, insert, update, delete on public.dishes, public.menu_availability,
  public.packages to authenticated;
grant select on public.kitchen_subscribers_view, public.kitchen_production_view,
  public.transport_subscribers_view to authenticated;

notify pgrst, 'reload schema';
