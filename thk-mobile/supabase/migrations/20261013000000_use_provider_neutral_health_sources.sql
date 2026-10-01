-- New builds record the source of health entries without a third-party
-- aggregator. Keep the legacy column/default so already-submitted app builds
-- can continue inserting until they have been replaced in the stores.
alter table public.health_data
  add column if not exists source text not null default 'manual';

alter table public.health_data
  alter column terra_user_id set default 'manual';

update public.health_data
set source = case
  when terra_user_id = 'native' then 'native'
  else 'manual'
end
where source = 'manual';

comment on column public.health_data.terra_user_id is
  'Deprecated compatibility field for already-submitted mobile builds; not connected to Terra. Use source for new records.';
