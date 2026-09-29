-- Shared Supabase migration: staff authorization for web operations and
-- least-privilege booking access. Staff rows are written by trusted services.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create table if not exists private.staff_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('ceo', 'admin', 'kitchen', 'transport', 'driver')),
  created_at timestamptz not null default now()
);

alter table private.staff_members enable row level security;
revoke all on private.staff_members from public, anon, authenticated;
grant select, insert, update, delete on private.staff_members to service_role;

-- Preserve known staff role assignments without changing auth email/password
-- records. The user ids are resolved from the existing auth accounts.
insert into private.staff_members (user_id, role)
select id,
  case lower(email)
    when 'kevmulgeo@gmail.com' then 'ceo'
    when 'issashahid1@gmail.com' then 'admin'
    when 'georgekmuliika@gmail.com' then 'transport'
    when 'kitchen@trianglehk.com' then 'kitchen'
    when 'driver@trianglehk.com' then 'driver'
  end
from auth.users
where lower(email) in (
  'kevmulgeo@gmail.com',
  'issashahid1@gmail.com',
  'georgekmuliika@gmail.com',
  'kitchen@trianglehk.com',
  'driver@trianglehk.com'
)
on conflict (user_id) do nothing;

-- Preserve any additional owners from the existing server-side owner flag.
-- This does not trust user-editable metadata or modify any auth email/password.
insert into private.staff_members (user_id, role)
select user_id, 'ceo'
from public.subscribers
where is_owner is true and user_id is not null
on conflict (user_id) do nothing;

create or replace function private.has_staff_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.staff_members as staff
    where staff.user_id = (select auth.uid())
      and staff.role = any (allowed_roles)
  );
$$;

revoke all on function private.has_staff_role(text[]) from public, anon;
grant execute on function private.has_staff_role(text[]) to authenticated;

-- The web client may ask for its own assigned role; no user id can be supplied.
create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select staff.role
  from private.staff_members as staff
  where staff.user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_staff_role() from public, anon;
grant execute on function public.current_staff_role() to authenticated;

-- Keep the existing provider authorization paths, while adding server-assigned
-- CEO/admin roles. The existing account email allowlist is intentionally kept.
create or replace function public.is_provider()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    lower(coalesce((select auth.jwt()) ->> 'email', '')) in (
      'kevmulgeo@gmail.com',
      'issashahid1@gmail.com',
      'georgekmuliika@gmail.com'
    )
    or exists (
      select 1 from public.subscribers
      where user_id = (select auth.uid()) and is_owner is true
    )
    or private.has_staff_role(array['ceo', 'admin']);
$$;

revoke all on function public.is_provider() from public, anon;
grant execute on function public.is_provider() to authenticated;

-- Remove the blanket booking policies from the web alignment migration and
-- older policies that could otherwise continue to grant broad row visibility.
do $$
declare
  policy record;
begin
  for policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'bookings'
  loop
    execute format('drop policy %I on public.bookings', policy.policyname);
  end loop;
end;
$$;

alter table public.bookings enable row level security;

-- Public booking forms need only availability fields and pending submissions.
revoke all on public.bookings from public, anon, authenticated;
grant select (appointment_date, appointment_time, status) on public.bookings to anon, authenticated;
grant insert (
  package_id, package_name, weight_kg, height_cm, fitness_goal,
  exercise_routine, wants_exercise_plan, dietary_restrictions,
  health_notes, appointment_date, appointment_time,
  client_name, client_email, client_phone
) on public.bookings to anon, authenticated;
grant select (id, status) on public.bookings to authenticated;
grant update (status) on public.bookings to authenticated;

create policy bookings_read_availability
  on public.bookings for select to anon, authenticated
  using (true);

create policy bookings_public_create_pending
  on public.bookings for insert to anon, authenticated
  with check (status = 'pending');

create policy bookings_staff_update_status
  on public.bookings for update to authenticated
  using (private.has_staff_role(array['ceo', 'admin', 'kitchen']))
  with check (private.has_staff_role(array['ceo', 'admin', 'kitchen']));

-- Existing dashboard query, with private details limited to kitchen operations
-- and company leadership. Transport managers and drivers cannot read client PII.
create or replace view public.provider_bookings_view
with (security_invoker = false, security_barrier = true)
as
  select *
  from public.bookings
  where private.has_staff_role(array['ceo', 'admin', 'kitchen']);

revoke all on public.provider_bookings_view from public, anon;
grant select on public.provider_bookings_view to authenticated;

-- Transport receives delivery-safe subscriber fields via a restricted view;
-- health and nutrition profile fields remain unavailable to that role.
create or replace view public.transport_subscribers_view
with (security_invoker = false, security_barrier = true)
as
  select id, full_name, phone, status, area, building_number, street,
         latitude, longitude, delivery_notes, breakfast_window, lunch_window,
         dinner_window, package_id, package_name
  from public.subscribers
  where private.has_staff_role(array['ceo', 'admin', 'transport']);

revoke all on public.transport_subscribers_view from public, anon;
grant select on public.transport_subscribers_view to authenticated;

-- CEO/admin continue through the existing is_provider() policies. Add explicit
-- transport read access for approved-driver records and assigned route rows.
grant select on public.rider_applications to authenticated;
drop policy if exists transport_read_rider_applications on public.rider_applications;
create policy transport_read_rider_applications
  on public.rider_applications for select to authenticated
  using (private.has_staff_role(array['ceo', 'admin', 'transport']));

drop policy if exists transport_manage_rider_deliveries on public.rider_deliveries;
create policy transport_manage_rider_deliveries
  on public.rider_deliveries for all to authenticated
  using (private.has_staff_role(array['ceo', 'admin', 'transport']))
  with check (private.has_staff_role(array['ceo', 'admin', 'transport']));

-- A role-checked RPC assigns delivery rows without granting route reassignment
-- columns to driver clients, whose existing column-level limits stay intact.
create or replace function public.assign_rider_delivery(
  p_subscriber_id uuid,
  p_rider_application_id uuid,
  p_delivery_date date,
  p_meal_type text default 'lunch'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_rider_user_id uuid;
  assigned_delivery_id uuid;
begin
  if not private.has_staff_role(array['ceo', 'admin', 'transport']) then
    raise exception 'Not authorized to assign deliveries' using errcode = '42501';
  end if;

  if p_meal_type not in ('breakfast', 'lunch', 'dinner', 'snacks') then
    raise exception 'Invalid meal type' using errcode = '22023';
  end if;

  select user_id into target_rider_user_id
  from public.rider_applications
  where id = p_rider_application_id and approved is true;

  if target_rider_user_id is null then
    raise exception 'Rider is not approved' using errcode = '22023';
  end if;

  insert into public.rider_deliveries (
    subscriber_id, rider_application_id, rider_user_id,
    delivery_date, meal_type, status
  ) values (
    p_subscriber_id, p_rider_application_id, target_rider_user_id,
    p_delivery_date, p_meal_type, 'pending'
  )
  on conflict (subscriber_id, delivery_date, meal_type)
  do update set
    rider_application_id = excluded.rider_application_id,
    rider_user_id = excluded.rider_user_id,
    status = 'pending',
    updated_at = now()
  returning id into assigned_delivery_id;

  return assigned_delivery_id;
end;
$$;

revoke all on function public.assign_rider_delivery(uuid, uuid, date, text) from public, anon;
grant execute on function public.assign_rider_delivery(uuid, uuid, date, text) to authenticated;
