-- Rider accounts enter the approval queue only after their email is verified.
-- This runs with auth.users privileges so signup does not depend on a client-side
-- insert that is blocked while the user has no authenticated session.
create or replace function public.create_verified_rider_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.raw_user_meta_data ->> 'role', '')) in ('driver', 'rider')
     and new.email_confirmed_at is not null then
    insert into public.rider_applications (user_id, email, full_name, phone, approved)
    values (
      new.id,
      lower(new.email),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      coalesce(new.phone, nullif(trim(new.raw_user_meta_data ->> 'phone'), '')),
      false
    )
    on conflict (user_id) do update
      set email = excluded.email,
          full_name = coalesce(excluded.full_name, rider_applications.full_name),
          phone = coalesce(excluded.phone, rider_applications.phone),
          updated_at = now();
  end if;
  return new;
end;
$$;

revoke all on function public.create_verified_rider_application() from public, anon, authenticated;

drop trigger if exists create_verified_rider_application on auth.users;
create trigger create_verified_rider_application
  after insert or update of email_confirmed_at on auth.users
  for each row
  when (new.email_confirmed_at is not null)
  execute function public.create_verified_rider_application();

-- Surface previously verified rider accounts that were created before the
-- approval record was reliably inserted. They still require manual approval.
insert into public.rider_applications (user_id, email, full_name, phone, approved)
select
  u.id,
  lower(u.email),
  nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
  coalesce(u.phone, nullif(trim(u.raw_user_meta_data ->> 'phone'), '')),
  false
from auth.users u
where lower(coalesce(u.raw_user_meta_data ->> 'role', '')) in ('driver', 'rider')
  and u.email_confirmed_at is not null
on conflict (user_id) do nothing;
