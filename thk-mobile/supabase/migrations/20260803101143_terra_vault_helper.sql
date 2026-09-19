/*
# Terra Config Vault Helper

## Purpose
Retrieves Terra API credentials (dev ID and API key) from Supabase Vault
so edge functions can call the Terra API without hardcoding secrets.

## Changes
- Creates `get_terra_config()` function in the `public` schema
- SECURITY DEFINER to read from vault.secrets
- Returns JSON with dev_id and api_key fields
- Grants EXECUTE to anon and authenticated
*/

CREATE OR REPLACE FUNCTION public.get_terra_config()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_api_key TEXT;
  v_dev_id TEXT;
BEGIN
  SELECT decrypted_secret INTO v_api_key
  FROM vault.decrypted_secrets
  WHERE name = 'TERRA_API_KEY'
  LIMIT 1;

  SELECT decrypted_secret INTO v_dev_id
  FROM vault.decrypted_secrets
  WHERE name = 'TERRA_DEV_ID'
  LIMIT 1;

  RETURN json_build_object(
    'api_key', COALESCE(v_api_key, ''),
    'dev_id', COALESCE(v_dev_id, '')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_terra_config() TO anon, authenticated;