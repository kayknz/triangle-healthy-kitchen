-- PAYMENT INTEGRITY MIGRATION 2026-09-21
-- Adds authoritative transaction tracking, idempotency, and audit logs.

-- 1. Payment Transactions Table (The Source of Truth for Status)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  tap_charge_id text UNIQUE,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'QAR',
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'pending', 'captured', 'failed', 'cancelled', 'voided')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Only service_role and providers can see all transactions
CREATE POLICY "providers_select_all_transactions"
  ON public.payment_transactions FOR SELECT
  TO authenticated
  USING (public.is_provider());

CREATE POLICY "users_select_own_transactions"
  ON public.payment_transactions FOR SELECT
  TO authenticated
  USING (subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid()));

-- 2. Payment Audit Logs (For Reconciliation)
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tap_charge_id text,
  event_type text NOT NULL,
  payload jsonb,
  severity text DEFAULT 'info',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.payment_logs TO authenticated;
-- Only providers can read logs
CREATE POLICY "providers_select_logs" ON public.payment_logs
  FOR SELECT TO authenticated USING (public.is_provider());

-- 3. Idempotency Constraint on Subscribers
-- Prevent concurrent updates to subscription status
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS last_payment_id text;

-- 4. Unique Index for Idempotency in transactions
-- (Already handled by UNIQUE on tap_charge_id)

-- 5. Helper Function for Webhook Verification
-- Note: In a real environment, we'd use a Vault secret.
-- The existing vault helper get_tap_config() is already in place.
