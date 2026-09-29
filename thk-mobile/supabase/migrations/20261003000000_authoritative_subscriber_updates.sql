-- Database-side defense in depth: client grants can include table-level UPDATE,
-- which is not neutralized by a column-level REVOKE alone.
alter table public.subscribers alter column status set default 'paused';
alter table public.subscribers alter column remaining_days set default 0;
alter table public.subscribers alter column payment_status drop default;
alter table public.subscribers alter column subscription_status drop default;
alter table public.subscribers alter column subscription_start drop default;

create or replace function private.guard_subscriber_billing_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_role text := coalesce((select auth.jwt()) ->> 'role', '');
begin
  if request_role = 'service_role'
    or coalesce(current_setting('thk.authorized_subscriber_update', true), '') = 'true' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status is distinct from 'paused'
      or coalesce(new.is_owner, false)
      or new.tap_charge_id is not null
      or new.last_payment_id is not null
      or new.payment_provider is not null
      or new.subscription_start is not null
      or new.current_period_end is not null
      or coalesce(new.remaining_days, 0) <> 0
      or coalesce(new.points, 0) <> 0
      or coalesce(new.points_balance, 0) <> 0
      or coalesce(new.referral_count, 0) <> 0
      or coalesce(new.current_streak, 0) <> 0
      or coalesce(new.longest_streak, 0) <> 0
      or new.payment_status is not null
      or new.subscription_status is not null then
      raise exception 'Subscription and reward state is managed by Triangle Healthy Kitchen.' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.is_owner is distinct from old.is_owner
    or new.tap_charge_id is distinct from old.tap_charge_id
    or new.last_payment_id is distinct from old.last_payment_id
    or new.payment_provider is distinct from old.payment_provider
    or new.subscription_start is distinct from old.subscription_start
    or new.current_period_end is distinct from old.current_period_end
    or new.remaining_days is distinct from old.remaining_days
    or new.points is distinct from old.points
    or new.points_balance is distinct from old.points_balance
    or new.referral_count is distinct from old.referral_count
    or new.current_streak is distinct from old.current_streak
    or new.longest_streak is distinct from old.longest_streak
    or new.payment_status is distinct from old.payment_status
    or new.subscription_status is distinct from old.subscription_status then
    raise exception 'Subscription and reward state is managed by Triangle Healthy Kitchen.' using errcode = '42501';
  end if;

  if new.status is distinct from old.status and new.status not in ('paused', 'cancelled') then
    raise exception 'A plan can only be activated after verified Tap payment.' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_subscriber_billing_fields() from public, anon, authenticated;
drop trigger if exists guard_subscriber_billing_fields on public.subscribers;
create trigger guard_subscriber_billing_fields
before insert or update on public.subscribers
for each row execute function private.guard_subscriber_billing_fields();

-- Reward redemption is atomic: lock inventory and points, create the redemption,
-- then record the debit in the immutable ledger.
create or replace function public.redeem_reward(p_reward_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_subscriber record;
  reward_item record;
  redemption_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select id, points_balance into user_subscriber
  from public.subscribers
  where user_id = (select auth.uid())
  for update;
  if not found then raise exception 'Subscriber profile not found' using errcode = 'P0002'; end if;

  select id, point_cost, stock_count into reward_item
  from public.rewards
  where id = p_reward_id and is_active is true
    and (expires_at is null or expires_at > now())
  for update;
  if not found then raise exception 'Reward is unavailable' using errcode = 'P0002'; end if;
  if reward_item.stock_count = 0 then raise exception 'Reward is out of stock' using errcode = '23514'; end if;
  if coalesce(user_subscriber.points_balance, 0) < reward_item.point_cost then
    raise exception 'Not enough points' using errcode = '23514';
  end if;

  insert into public.reward_redemptions (subscriber_id, reward_id, status)
  values (user_subscriber.id, reward_item.id, 'pending')
  returning id into redemption_id;

  if reward_item.stock_count > 0 then
    update public.rewards set stock_count = stock_count - 1 where id = reward_item.id;
  end if;
  perform set_config('thk.authorized_subscriber_update', 'true', true);
  update public.subscribers
  set points_balance = points_balance - reward_item.point_cost, updated_at = now()
  where id = user_subscriber.id;
  insert into public.points_ledger (subscriber_id, points_delta, event_type, idempotency_key)
  values (user_subscriber.id, -reward_item.point_cost, 'redemption', 'redemption:' || redemption_id::text);

  return jsonb_build_object('success', true, 'redemption_id', redemption_id);
end;
$$;

revoke all on function public.redeem_reward(uuid) from public, anon;
grant execute on function public.redeem_reward(uuid) to authenticated;
