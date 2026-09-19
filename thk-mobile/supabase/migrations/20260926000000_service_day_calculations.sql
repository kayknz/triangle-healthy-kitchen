-- SERVICE DAY CALCULATIONS MIGRATION 2026-09-26
-- Implements business rule: Friday is a non-service day.
-- 1 week = 6 service days, 4 weeks = 24 service days.

/**
 * Adds N service days to a starting timestamp, skipping Fridays.
 */
CREATE OR REPLACE FUNCTION public.add_service_days(
  p_start_time timestamptz,
  p_service_days integer
) RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_current_time timestamptz := p_start_time;
  v_remaining_days integer := p_service_days;
BEGIN
  IF p_service_days <= 0 THEN
    RETURN p_start_time;
  END IF;

  WHILE v_remaining_days > 0 LOOP
    v_current_time := v_current_time + interval '1 day';
    -- PostgreSQL extract(dow) returns 5 for Friday (0=Sun, 6=Sat)
    IF extract(dow from v_current_time AT TIME ZONE 'Asia/Qatar') != 5 THEN
      v_remaining_days := v_remaining_days - 1;
    END IF;
  END LOOP;

  RETURN v_current_time;
END;
$$;

/**
 * AUTHORITATIVE PAYMENT PROCESSING FUNCTION
 * Handles entire transaction lifecycle atomically using package-driven duration and currency.
 */
CREATE OR REPLACE FUNCTION public.process_tap_captured_payment(
  p_tap_charge_id text,
  p_received_amount numeric,
  p_received_currency text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx record;
  v_sub record;
  v_pkg record;
  v_package_id text;
  v_service_days integer;
  v_points integer;
  v_duration text;
  v_start_time timestamptz;
  v_new_expiry timestamptz;
  v_ledger_id uuid;
BEGIN
  -- 1. Lock the payment transaction row (Source of Truth)
  SELECT * FROM payment_transactions
  WHERE tap_charge_id = p_tap_charge_id
  FOR UPDATE INTO v_tx;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found in audit ledger.');
  END IF;

  -- 2. Idempotency Check
  IF v_tx.status = 'captured' THEN
    RETURN jsonb_build_object('success', true, 'note', 'idempotent_duplicate');
  END IF;

  -- 3. Integrity Check: Webhook Payload vs Internal Intent
  IF ABS(v_tx.amount - p_received_amount) > 0.01 OR v_tx.currency != p_received_currency THEN
    RETURN jsonb_build_object('success', false, 'error', 'Financial integrity mismatch.');
  END IF;

  -- 4. Authoritative Package Discovery
  v_package_id := v_tx.metadata->>'package_id';
  IF v_package_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction missing package protocol metadata.');
  END IF;

  SELECT * FROM packages WHERE id = v_package_id INTO v_pkg;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referenced package is obsolete or invalid.');
  END IF;

  -- 5. Package-Currency Integrity Check
  IF v_pkg.currency != v_tx.currency THEN
    RETURN jsonb_build_object('success', false, 'error', 'Currency protocol violation.');
  END IF;

  -- 6. Authoritative Price Verification
  IF ABS(v_pkg.price - v_tx.amount) > 0.01 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Price protocol violation.');
  END IF;

  -- 7. Lock the Subscriber row
  SELECT * FROM subscribers
  WHERE id = v_tx.subscriber_id
  FOR UPDATE INTO v_sub;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscriber identity lost.');
  END IF;

  -- 8. Business Logic: Authoritative Service Day Allowance from Package Duration
  v_duration := v_pkg.duration;
  v_service_days := NULL;

  -- Explicit package duration mappings
  IF v_duration = '4 Weeks (28 boxes)' OR v_duration = '4 Weeks (28 personalised boxes)' THEN
    v_service_days := 24;
  ELSIF v_duration = '1 week' OR v_duration = '1 Week' OR v_duration = '1 Week (6 days)' THEN
    v_service_days := 6;
  ELSIF v_duration = '1 day' OR v_duration = '1 Day' THEN
    v_service_days := 1;
  END IF;

  IF v_service_days IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unsupported subscription duration protocol: ' || COALESCE(v_duration, 'NULL'));
  END IF;

  -- 9. Calculate Expiry (Preserving remaining time)
  IF v_sub.status = 'active' AND v_sub.current_period_end > now() THEN
    v_start_time := v_sub.current_period_end;
  ELSE
    v_start_time := now();
  END IF;

  v_new_expiry := public.add_service_days(v_start_time, v_service_days);

  -- 10. Atomic State Update
  UPDATE subscribers
  SET
    status = 'active',
    payment_provider = 'tap',
    tap_charge_id = p_tap_charge_id,
    last_payment_id = p_tap_charge_id,
    subscription_start = COALESCE(subscription_start, now()),
    current_period_end = v_new_expiry,
    updated_at = now()
  WHERE id = v_sub.id;

  -- 11. Authoritative Transaction Update
  UPDATE payment_transactions
  SET status = 'captured', updated_at = now()
  WHERE id = v_tx.id;

  -- 12. Authoritative Reward Fulfillment (Exactly Once)
  v_points := FLOOR(p_received_amount * 0.1); -- 10% cash back

  INSERT INTO points_ledger (
    subscriber_id,
    points_delta,
    event_type,
    idempotency_key,
    tap_charge_id
  ) VALUES (
    v_sub.id,
    v_points,
    'tap_payment_activation',
    'tap_activation:' || p_tap_charge_id,
    p_tap_charge_id
  ) ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_ledger_id;

  -- 13. Update Subscriber Balance ONLY if a new ledger row was actually inserted
  IF v_ledger_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name = 'points_balance') THEN
      UPDATE subscribers SET points_balance = COALESCE(points_balance, 0) + v_points WHERE id = v_sub.id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'subscriber_id', v_sub.id,
    'points_awarded', CASE WHEN v_ledger_id IS NOT NULL THEN v_points ELSE 0 END,
    'expiry', v_new_expiry,
    'service_days', v_service_days
  );
END;
$$;

-- Security Lockdown
REVOKE ALL ON FUNCTION public.process_tap_captured_payment(text, numeric, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_tap_captured_payment(text, numeric, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_tap_captured_payment(text, numeric, text) TO service_role;
