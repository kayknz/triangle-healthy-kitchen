begin;

create or replace function public.set_preferred_community(p_region_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  prior_authorized_update text := current_setting('thk.authorized_subscriber_update', true);
begin
  if caller_id is null then
    raise exception 'Sign in to join a tribe.' using errcode = '42501';
  end if;

  if p_region_id is not null and not exists (
    select 1 from public.regional_communities where id = p_region_id
  ) then
    raise exception 'That community is not available. Refresh and choose another tribe.' using errcode = '22023';
  end if;

  perform set_config('thk.authorized_subscriber_update', 'true', true);
  update public.subscribers
  set preferred_region_id = p_region_id,
      updated_at = now()
  where user_id = caller_id;

  if not found then
    perform set_config('thk.authorized_subscriber_update', coalesce(prior_authorized_update, ''), true);
    raise exception 'Member profile not found. Choose a plan and complete signup first.' using errcode = 'P0002';
  end if;

  perform set_config('thk.authorized_subscriber_update', coalesce(prior_authorized_update, ''), true);
end;
$$;

revoke all on function public.set_preferred_community(uuid) from public, anon;
grant execute on function public.set_preferred_community(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
