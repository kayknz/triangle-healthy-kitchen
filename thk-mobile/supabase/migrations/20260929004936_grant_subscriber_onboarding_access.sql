-- Subscriber self-service is constrained by RLS. Remove broad anonymous
-- table grants, and give signed-in clients only the commands required by
-- the existing self-service/provider policies.
alter table public.subscribers enable row level security;

revoke all on table public.subscribers from public, anon;
revoke truncate, references, trigger on table public.subscribers from authenticated;
grant select, insert, update, delete on table public.subscribers to authenticated;
