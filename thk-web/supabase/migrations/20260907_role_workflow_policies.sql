-- Keep rider presence persistent and visible to the owner dashboard.
alter table public.rider_applications
  add column if not exists is_online boolean not null default false;

-- Owner access is limited to the existing owner accounts used by the app.
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'owners read rider applications' and tablename = 'rider_applications') then
    create policy "owners read rider applications"
      on public.rider_applications for select to authenticated
      using ((auth.jwt() ->> 'email') in ('kevmulgeo@gmail.com', 'issashahid1@gmail.com', 'georgekmuliika@gmail.com', 'google-tester-staff@example.com', 'owner@triangle.qa'));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'riders read own application' and tablename = 'rider_applications') then
    create policy "riders read own application"
      on public.rider_applications for select to authenticated
      using (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where policyname = 'riders update own presence' and tablename = 'rider_applications') then
    create policy "riders update own presence"
      on public.rider_applications for update to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where policyname = 'owners manage rider deliveries' and tablename = 'rider_deliveries') then
    create policy "owners manage rider deliveries"
      on public.rider_deliveries for all to authenticated
      using ((auth.jwt() ->> 'email') in ('kevmulgeo@gmail.com', 'issashahid1@gmail.com', 'georgekmuliika@gmail.com', 'google-tester-staff@example.com', 'owner@triangle.qa'))
      with check ((auth.jwt() ->> 'email') in ('kevmulgeo@gmail.com', 'issashahid1@gmail.com', 'georgekmuliika@gmail.com', 'google-tester-staff@example.com', 'owner@triangle.qa'));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'riders manage own deliveries' and tablename = 'rider_deliveries') then
    create policy "riders manage own deliveries"
      on public.rider_deliveries for all to authenticated
      using (exists (select 1 from public.rider_applications ra where ra.id = rider_application_id and ra.user_id = auth.uid()))
      with check (exists (select 1 from public.rider_applications ra where ra.id = rider_application_id and ra.user_id = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'authenticated ledger trigger inserts' and tablename = 'loyalty_ledger') then
    create policy "authenticated ledger trigger inserts"
      on public.loyalty_ledger for insert to authenticated
      with check (auth.uid() is not null);
  end if;
end $$;
