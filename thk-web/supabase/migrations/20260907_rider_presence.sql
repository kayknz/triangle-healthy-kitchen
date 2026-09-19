alter table public.rider_applications
  add column if not exists is_online boolean not null default false;

create index if not exists rider_applications_is_online_idx
  on public.rider_applications (is_online)
  where approved = true;
