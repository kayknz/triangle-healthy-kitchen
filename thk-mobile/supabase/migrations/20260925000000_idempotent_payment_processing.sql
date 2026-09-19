-- IDEMPOTENT PAYMENT PROCESSING MIGRATION 2026-09-25
-- Ensures Tap payments are processed exactly once at the database level.
-- Implements business rule: Friday is a non-service day.
-- 1 week = 6 service days, 4 weeks = 24 service days.

-- 1. Helper function for service-day logic
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
    -- We use AT TIME ZONE 'Asia/Qatar' to ensure Doha calendar consistency
    IF extract(dow from v_current_time AT TIME ZONE 'Asia/Qatar') != 5 THEN
      v_remaining_days := v_remaining_days - 1;
    END IF;
  END LOOP;

  RETURN v_current_time;
END;
$$;

-- 2. Hardening rewards/loyalty tables
-- Consolidated into points_ledger with a unique constraint for Tap charges.
ALTER TABLE public.points_ledger ADD COLUMN IF NOT EXISTS tap_charge_id text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_points_ledger_tap_charge_id
  ON public.points_ledger(tap_charge_id)
  WHERE tap_charge_id IS NOT NULL;

-- 3. Authoritative Payment Processing Function
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
  v_service_days integer;
  v_points integer;
  v_package_id text;
  v_start_time timestamptz;
  v_new_expiry timestamptz;
  v_ledger_id uuid;
BEGIN
  -- A. Lock the payment transaction row (Source of Truth)
  SELECT * FROM payment_transactions
  WHERE tap_charge_id = p_tap_charge_id
  FOR UPDATE INTO v_tx;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found in audit ledger.');
  END IF;

  -- B. Idempotency Check: Already processed?
  IF v_tx.status = 'captured' THEN
    RETURN jsonb_build_object('success', true, 'note', 'idempotent_duplicate');
  END IF;

  -- C. Integrity Check: Webhook Payload vs Internal Transaction Intent
  IF ABS(v_tx.amount - p_received_amount) > 0.01 OR v_tx.currency != p_received_currency THEN
    RETURN jsonb_build_object('success', false, 'error', 'Financial integrity mismatch.');
  END IF;

  -- D. Authoritative Package Discovery
  v_package_id := v_tx.metadata->>'package_id';
  IF v_package_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction missing package protocol metadata.');
  END IF;

  SELECT * FROM packages WHERE id = v_package_id INTO v_pkg;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referenced package is obsolete or invalid.');
  END IF;

  -- E. Authoritative Price Verification
  -- Transaction amount must exactly match the official package price
  IF ABS(v_pkg.price - v_tx.amount) > 0.01 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Price protocol violation detected.');
  END IF;

  -- F. Lock the Subscriber row (Target of extension)
  SELECT * FROM subscribers
  WHERE id = v_tx.subscriber_id
  FOR UPDATE INTO v_sub;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscriber identity lost.');
  END IF;

  -- G. Business Logic: Authoritative Service Day Allowance
  -- Mapping durations strictly to service days. Friday is excluded.
  IF v_pkg.duration = '1_day' THEN
    v_service_days := 1;
  ELSIF v_pkg.duration = '1_week' THEN
    v_service_days := 6;
  ELSIF v_pkg.duration = '4_weeks' THEN
    v_service_days := 24;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Unsupported subscription duration protocol: ' || COALESCE(v_pkg.duration, 'NULL'));
  END IF;

  -- H. Calculate Expiry (Preserving remaining time)
  IF v_sub.status = 'active' AND v_sub.current_period_end > now() THEN
    v_start_time := v_sub.current_period_end;
  ELSE
    v_start_time := now();
  END IF;

  v_new_expiry := public.add_service_days(v_start_time, v_service_days);

  -- I. Atomic State Update
  UPDATE subscribers
  SET
    status = 'active',
    payment_provider = 'tap',
    tap_charge_id = p_tap_charge_id,
    last_payment_id = p_tap_charge_id,
    subscription_start = LEAST(subscription_start, now()), -- Maintain original start if earlier
    current_period_end = v_new_expiry,
    updated_at = now()
  WHERE id = v_sub.id;

  -- J. Authoritative Transaction Update
  UPDATE payment_transactions
  SET status = 'captured', updated_at = now()
  WHERE id = v_tx.id;

  -- K. Authoritative Reward Fulfillment (Exactly Once)
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
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_ledger_id;

  -- L. Update Subscriber Balance ONLY if a new ledger entry was created
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
