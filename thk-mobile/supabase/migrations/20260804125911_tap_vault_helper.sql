/*
# Tap Payments Vault Helper
*/

CREATE OR REPLACE FUNCTION public.get_tap_config()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_api_key TEXT;
  v_merchant_id TEXT;
BEGIN
  SELECT decrypted_secret INTO v_api_key
  FROM vault.decrypted_secrets
  WHERE name = 'TAP_SECRET_KEY'
  LIMIT 1;

  SELECT decrypted_secret INTO v_merchant_id
  FROM vault.decrypted_secrets
  WHERE name = 'TAP_MERCHANT_ID'
  LIMIT 1;

  RETURN json_build_object(
    'api_key', COALESCE(v_api_key, ''),
    'merchant_id', COALESCE(v_merchant_id, '')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tap_config() TO anon, authenticated;