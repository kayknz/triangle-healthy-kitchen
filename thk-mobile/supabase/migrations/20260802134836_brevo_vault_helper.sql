/*
# Brevo Vault Helper Function

## Purpose
Provides a SECURITY DEFINER function that retrieves the Brevo API key and sender email
from Supabase Vault. This allows edge functions to read the secrets via the service role
client without needing the secrets set as edge function environment variables.

## Changes
- Creates `get_brevo_config()` function in the `public` schema
- SECURITY DEFINER so it can read from vault.secrets (which the anon/authenticated roles cannot)
- Returns a JSON object with `api_key` and `sender_email` fields
- Grants EXECUTE to the `authenticated` and `anon` roles so edge functions using the service
  role key (which bypasses RLS) can call it

## Security
- The function is SECURITY DEFINER, running as the owner (postgres), which has access to vault
- Only returns the two specific secrets needed for email sending
- No destructive operations
*/

CREATE OR REPLACE FUNCTION public.get_brevo_config()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_api_key TEXT;
  v_sender_email TEXT;
BEGIN
  SELECT decrypted_secret INTO v_api_key
  FROM vault.decrypted_secrets
  WHERE name = 'BREVO_API_KEY'
  LIMIT 1;

  SELECT decrypted_secret INTO v_sender_email
  FROM vault.decrypted_secrets
  WHERE name = 'SENDER_EMAIL'
  LIMIT 1;

  RETURN json_build_object(
    'api_key', COALESCE(v_api_key, ''),
    'sender_email', COALESCE(v_sender_email, 'kevmulgeo@gmail.com')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_brevo_config() TO anon, authenticated;