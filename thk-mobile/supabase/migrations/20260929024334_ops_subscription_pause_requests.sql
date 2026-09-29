-- Persist customer pause/resume requests so operations can review them on any
-- device. Only this staff RPC may change the subscription status.
create table if not exists public.subscription_pause_requests (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  request_type text not null check (request_type in ('pause', 'resume')),
  requested_date date not null,
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

create index if not exists subscription_pause_requests_pending_idx
  on public.subscription_pause_requests(created_at desc) where status = 'pending';
create unique index if not exists subscription_pause_requests_one_pending_per_subscriber_idx
  on public.subscription_pause_requests(subscriber_id) where status = 'pending';

alter table public.subscription_pause_requests enable row level security;
revoke all on public.subscription_pause_requests from public, anon;
grant select, insert on public.subscription_pause_requests to authenticated;

drop policy if exists customer_read_own_pause_requests on public.subscription_pause_requests;
create policy customer_read_own_pause_requests on public.subscription_pause_requests
  for select to authenticated
  using (
    exists (select 1 from public.subscribers s
            where s.id = subscriber_id and s.user_id = (select auth.uid()))
    or private.has_staff_role(array['ceo', 'admin'])
  );

drop policy if exists customer_submit_pause_requests on public.subscription_pause_requests;
create policy customer_submit_pause_requests on public.subscription_pause_requests
  for insert to authenticated
  with check (
    status = 'pending'
    and reviewed_at is null
    and reviewed_by is null
    and requested_date >= ((now() at time zone 'Asia/Qatar')::date + 1)
    and exists (select 1 from public.subscribers s
                where s.id = subscriber_id and s.user_id = (select auth.uid()))
  );

create or replace function public.review_subscription_pause_request(
  p_request_id uuid,
  p_decision text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_row public.subscription_pause_requests%rowtype;
  subscriber_row public.subscribers%rowtype;
begin
  if not private.has_staff_role(array['ceo', 'admin']) then
    raise exception 'Only CEO/Admin can review pause requests.' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'declined') then
    raise exception 'Decision must be approved or declined.' using errcode = '22023';
  end if;

  select * into request_row
  from public.subscription_pause_requests
  where id = p_request_id and status = 'pending'
  for update;
  if not found then
    raise exception 'This request is no longer pending.' using errcode = 'P0002';
  end if;

  if p_decision = 'approved' then
    select * into subscriber_row
    from public.subscribers
    where id = request_row.subscriber_id
    for update;
    if not found then
      raise exception 'Subscriber record not found.' using errcode = 'P0002';
    end if;

    if request_row.request_type = 'pause' then
      if subscriber_row.status <> 'active' then
        raise exception 'Only an active subscription can be paused.' using errcode = '23514';
      end if;
      perform set_config('thk.authorized_subscriber_update', 'true', true);
      update public.subscribers
      set status = 'paused', is_paused = true, paused_until = request_row.requested_date,
          updated_at = now()
      where id = request_row.subscriber_id;
    else
      if subscriber_row.status <> 'paused' then
        raise exception 'Only a paused subscription can be resumed.' using errcode = '23514';
      end if;
      if subscriber_row.tap_charge_id is null and subscriber_row.last_payment_id is null then
        raise exception 'A verified Tap payment is required before resuming this plan.' using errcode = '23514';
      end if;
      perform set_config('thk.authorized_subscriber_update', 'true', true);
      update public.subscribers
      set status = 'active', is_paused = false, paused_until = null, updated_at = now()
      where id = request_row.subscriber_id;
    end if;
  end if;

  update public.subscription_pause_requests
  set status = p_decision, reviewed_at = now(), reviewed_by = (select auth.uid())
  where id = request_row.id;
end;
$$;

revoke all on function public.review_subscription_pause_request(uuid, text) from public, anon;
grant execute on function public.review_subscription_pause_request(uuid, text) to authenticated;

notify pgrst, 'reload schema';
