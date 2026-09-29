-- Remove default DML grants from privileged views. The provider/transport
-- views are role-filtered read models; payment reconciliation and subscriber
-- streak summaries are not public client APIs.
revoke all on public.provider_bookings_view from public, anon, authenticated;
grant select on public.provider_bookings_view to authenticated;

revoke all on public.transport_subscribers_view from public, anon, authenticated;
grant select on public.transport_subscribers_view to authenticated;

revoke all on public.reconciliation_report from public, anon, authenticated;
revoke all on public.subscriber_streaks from public, anon, authenticated;
