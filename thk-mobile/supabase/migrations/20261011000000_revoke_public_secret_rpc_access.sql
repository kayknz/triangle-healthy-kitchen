-- Vault-backed configuration is only for trusted Edge Functions.
-- PostgreSQL grants EXECUTE to PUBLIC by default, so revoking only anon and
-- authenticated does not remove the effective access those API roles inherit.
do $$
declare
  fn regprocedure;
begin
  foreach fn in array array[
    'public.get_brevo_config()'::regprocedure,
    'public.get_dibsy_config()'::regprocedure,
    'public.get_dibsy_webhook_secret()'::regprocedure,
    'public.get_stripe_webhook_secret()'::regprocedure,
    'public.get_tap_config()'::regprocedure,
    'public.get_terra_config()'::regprocedure
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end
$$;

-- Trigger-only functions are not callable through the Data API.
revoke all on function public.enforce_weekly_menu_selection_window() from public, anon, authenticated;
revoke all on function public.handle_new_rider_signup() from public, anon, authenticated;
