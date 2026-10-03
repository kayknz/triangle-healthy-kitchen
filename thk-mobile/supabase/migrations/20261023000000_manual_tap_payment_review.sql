-- Admin and CEO can reconcile a Tap charge only after confirming its captured
-- status in the Tap dashboard. This records an auditable manual verification
-- and activates the subscription using the same captured-payment trigger.
create or replace function public.review_tap_payment_manually(p_transaction_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  tx public.payment_transactions%rowtype;
  sub public.subscribers%rowtype;
  pkg public.packages%rowtype;
  profile_data jsonb;
  service_days integer;
  starts_at timestamptz;
  new_expiry timestamptz;
  friday_delivery boolean := false;
  reward_points integer;
begin
  if not private.has_staff_role(array['ceo','admin']) then
    raise exception 'Only Admin or CEO can review Tap payments.' using errcode = '42501';
  end if;

  select * into tx from public.payment_transactions where id = p_transaction_id for update;
  if not found then raise exception 'Payment transaction not found.' using errcode = 'P0002'; end if;
  if tx.payment_provider <> 'tap' then raise exception 'This action is only for Tap payments.' using errcode = '22023'; end if;
  if tx.status = 'captured' then return jsonb_build_object('success', true, 'note', 'already_verified'); end if;
  if tx.status not in ('pending','initiated','failed') then raise exception 'Only an unconfirmed Tap payment can be reviewed.' using errcode = '22023'; end if;
  if nullif(tx.tap_charge_id, '') is null then raise exception 'Tap charge reference is missing; verify the charge in Tap before retrying.' using errcode = '22023'; end if;

  select * into pkg from public.packages where id = tx.metadata->>'package_id' and active;
  if not found then raise exception 'The selected package is unavailable.' using errcode = '22023'; end if;
  profile_data := coalesce(tx.metadata->'profile', '{}'::jsonb);
  friday_delivery := coalesce((profile_data->>'friday_delivery_addon')::boolean, false);
  if abs(pkg.price + case when friday_delivery then 199 else 0 end - tx.amount) > 0.01 or pkg.currency <> tx.currency then
    raise exception 'Payment amount or currency does not match the selected package.' using errcode = '22023';
  end if;

  service_days := case
    when pkg.duration ilike '%1 day%' then 1
    when pkg.duration ilike '%1 week%' or pkg.duration ilike '%6 day%' then 6
    when pkg.duration ilike '%4 week%' or pkg.duration ilike '%24 service%' then 24
    else null end;
  if service_days is null then raise exception 'Package duration needs an Admin update.' using errcode = '22023'; end if;
  if friday_delivery and service_days <> 24 then raise exception 'Friday delivery is only available on monthly packages.' using errcode = '22023'; end if;

  select * into sub from public.subscribers where id = tx.subscriber_id for update;
  if not found then raise exception 'Customer account was not found.' using errcode = 'P0002'; end if;
  starts_at := case when sub.status = 'active' and sub.current_period_end > now() then sub.current_period_end else now() end;
  new_expiry := public.add_service_days(starts_at, service_days);

  perform set_config('thk.authorized_subscriber_update', 'true', true);
  update public.subscribers set
    status = 'active', payment_provider = 'tap', payment_status = 'Paid',
    subscription_status = 'Active', package_id = pkg.id, package_name = pkg.name,
    friday_delivery_addon = friday_delivery,
    tap_charge_id = tx.tap_charge_id, last_payment_id = tx.tap_charge_id,
    subscription_start = coalesce(subscription_start, now()), current_period_end = new_expiry,
    remaining_days = service_days, onboarding_completed = true, updated_at = now()
  where id = sub.id;

  -- The captured-payment trigger applies the validated checkout profile and
  -- persists the meal selections. The RPC's staff check guards this transition.
  update public.payment_transactions set status = 'captured', updated_at = now() where id = tx.id;

  reward_points := floor(tx.amount * 0.1);
  insert into public.points_ledger (subscriber_id, points_delta, event_type, idempotency_key, tap_charge_id)
  values (sub.id, reward_points, 'tap_payment_activation', 'tap_activation:' || tx.tap_charge_id, tx.tap_charge_id)
  on conflict (idempotency_key) do nothing;

  insert into public.payment_logs (tap_charge_id, event_type, payload, severity)
  values (tx.tap_charge_id, 'tap_payment_manually_verified',
    jsonb_build_object('transaction_id', tx.id, 'subscriber_id', sub.id, 'verified_by', auth.uid(), 'verification_source', 'tap_dashboard'), 'info');

  return jsonb_build_object('success', true, 'subscriber_id', sub.id, 'expiry', new_expiry);
end;
$$;

revoke all on function public.review_tap_payment_manually(uuid) from public, anon;
grant execute on function public.review_tap_payment_manually(uuid) to authenticated;
