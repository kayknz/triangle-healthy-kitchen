do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'subscribers read own plan' and tablename = 'subscribers') then
    create policy "subscribers read own plan"
      on public.subscribers for select to authenticated
      using (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where policyname = 'subscribers read own deliveries' and tablename = 'rider_deliveries') then
    create policy "subscribers read own deliveries"
      on public.rider_deliveries for select to authenticated
      using (exists (select 1 from public.subscribers s where s.id = subscriber_id and s.user_id = auth.uid()));
  end if;
end $$;
