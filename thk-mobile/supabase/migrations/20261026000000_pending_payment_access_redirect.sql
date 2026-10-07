-- Let signed-in customers discover their own outstanding payment request so
-- the apps can route them to the approval status screen instead of checkout.
create or replace function public.my_pending_payment_request()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'payment_provider', p.payment_provider,
    'status', p.status,
    'amount', p.amount,
    'currency', p.currency,
    'created_at', p.created_at
  )
  from public.payment_transactions p
  join public.subscribers s on s.id = p.subscriber_id
  where s.user_id = auth.uid()
    and p.status in ('pending', 'initiated')
  order by p.created_at desc
  limit 1;
$$;
revoke all on function public.my_pending_payment_request() from public, anon;
grant execute on function public.my_pending_payment_request() to authenticated;

-- Prevent concurrent checkout attempts from opening multiple new pending
-- transactions for the same subscriber. Existing historical records are left
-- untouched by limiting this index to transactions created after rollout.
create unique index if not exists payment_transactions_one_open_request_per_subscriber
  on public.payment_transactions (subscriber_id)
  where subscriber_id is not null
    and status in ('pending', 'initiated')
    and created_at >= timestamptz '2026-10-07 00:00:00+00';
