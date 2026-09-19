/*
# Dibsy Payment Integration Schema

## Purpose
Switches payment from Stripe to Dibsy (Qatar-based gateway supporting QAR,
Apple Pay, Google Pay, NAPS debit cards, and credit/debit cards).

## Changes
- Adds Dibsy-specific columns to subscribers table
- Creates vault helper function to fetch Dibsy API key

## New Columns on subscribers
- dibsy_customer_id: Dibsy customer reference
- dibsy_payment_id: Last payment ID for tracking
- dibsy_card_token: Vaulted card token for recurring charges
- payment_provider: 'dibsy' to distinguish from stripe

## Vault Helper
- get_dibsy_config(): Returns the Dibsy secret API key from vault
*/

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS dibsy_customer_id text,
  ADD COLUMN IF NOT EXISTS dibsy_payment_id text,
  ADD COLUMN IF NOT EXISTS dibsy_card_token text,
  ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'dibsy';

CREATE OR REPLACE FUNCTION public.get_dibsy_config()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_api_key TEXT;
BEGIN
  SELECT decrypted_secret INTO v_api_key
  FROM vault.decrypted_secrets
  WHERE name = 'DIBSY_API_KEY'
  LIMIT 1;

  RETURN json_build_object(
    'api_key', COALESCE(v_api_key, '')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dibsy_config() TO anon, authenticated;

-- Also store Dibsy webhook secret helper
CREATE OR REPLACE FUNCTION public.get_dibsy_webhook_secret()
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
  WHERE name = 'DIBSY_WEBHOOK_SECRET'
  LIMIT 1;

  RETURN COALESCE(v_secret, '');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dibsy_webhook_secret() TO anon, authenticated;