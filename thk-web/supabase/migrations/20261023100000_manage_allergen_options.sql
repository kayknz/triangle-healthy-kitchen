-- Shared, bilingual allergen options maintained by kitchen and leadership.
create table if not exists public.allergen_options (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text not null,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create unique index if not exists allergen_options_name_ci_key
  on public.allergen_options (lower(btrim(name)));

insert into public.allergen_options (name, name_ar, sort_order)
select seed.name, seed.name_ar, seed.sort_order
from (values
  ('Fish', 'السمك', 10),
  ('Dairy', 'منتجات الألبان', 20),
  ('Eggs', 'البيض', 30),
  ('Gluten', 'الغلوتين', 40),
  ('Seafood', 'المأكولات البحرية', 50),
  ('Sesame', 'السمسم', 60),
  ('Nuts', 'المكسرات', 70)
) as seed(name, name_ar, sort_order)
where not exists (
  select 1 from public.allergen_options existing
  where lower(btrim(existing.name)) = lower(btrim(seed.name))
);

alter table public.allergen_options enable row level security;
revoke all on public.allergen_options from public;
grant select on public.allergen_options to anon, authenticated;
grant insert, update on public.allergen_options to authenticated;

drop policy if exists allergen_options_read on public.allergen_options;
create policy allergen_options_read on public.allergen_options
  for select to anon, authenticated using (true);

drop policy if exists allergen_options_manage_staff on public.allergen_options;
create policy allergen_options_manage_staff on public.allergen_options
  for all to authenticated
  using (private.has_staff_role(array['ceo','admin','kitchen']))
  with check (private.has_staff_role(array['ceo','admin','kitchen']));
