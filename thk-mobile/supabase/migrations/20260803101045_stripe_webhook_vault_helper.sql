/*
# Stripe Webhook Secret Vault Helper

## Purpose
Adds a SECURITY DEFINER function to retrieve the Stripe webhook signing secret
from Supabase Vault. This allows the stripe-webhook edge function to verify
webhook signatures using the correct secret, even when the env var is outdated.

## Changes
- Creates `get_stripe_webhook_secret()` function in the `public` schema
- SECURITY DEFINER so it can read from vault.secrets
- Returns the webhook secret as text
- Grants EXECUTE to anon and authenticated roles

## Security
- SECURITY DEFINER running as postgres (has vault access)
- Only returns the specific Stripe webhook secret
*/

CREATE OR REPLACE FUNCTION public.get_stripe_webhook_secret()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'STRIPE_WEBHOOK_SECRET_VAULT'
  LIMIT 1;

  RETURN COALESCE(v_secret, '');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_stripe_webhook_secret() TO anon, authenticated;