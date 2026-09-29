-- Persist the subscriber's real per-meal delivery window on each rider stop.
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
  target_time_window text;
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

  select case p_meal_type
    when 'breakfast' then breakfast_window
    when 'dinner' then dinner_window
    else lunch_window
  end into target_time_window
  from public.subscribers
  where id = p_subscriber_id and status = 'active';
  if not found then
    raise exception 'Active customer not found' using errcode = 'P0002';
  end if;

  insert into public.rider_deliveries (
    subscriber_id, rider_application_id, rider_user_id,
    delivery_date, meal_type, time_window, status
  ) values (
    p_subscriber_id, p_rider_application_id, target_rider_user_id,
    p_delivery_date, p_meal_type, target_time_window, 'pending'
  )
  on conflict (subscriber_id, delivery_date, meal_type)
  do update set
    rider_application_id = excluded.rider_application_id,
    rider_user_id = excluded.rider_user_id,
    time_window = excluded.time_window,
    status = 'pending',
    updated_at = now()
  returning id into assigned_delivery_id;

  return assigned_delivery_id;
end;
$$;

revoke all on function public.assign_rider_delivery(uuid, uuid, date, text) from public, anon;
grant execute on function public.assign_rider_delivery(uuid, uuid, date, text) to authenticated;
