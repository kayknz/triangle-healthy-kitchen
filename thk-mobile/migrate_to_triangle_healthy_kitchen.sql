-- ============================================================================
-- Triangle Healthy Kitchen - Complete Database Migration Script
-- ============================================================================
-- This script consolidates all migrations for the new Supabase project
-- Run this in the SQL Editor of your new Supabase project
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Install pg_cron extension (needed for scheduled reminders)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Install pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres;
GRANT USAGE ON SCHEMA extensions TO anon;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id text NOT NULL,
  package_name text NOT NULL,
  weight_kg numeric,
  height_cm numeric,
  fitness_goal text,
  exercise_routine text,
  wants_exercise_plan boolean NOT NULL DEFAULT false,
  dietary_restrictions text,
  health_notes text,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Bookings RLS policies
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending');

REVOKE INSERT ON bookings FROM anon, authenticated;
GRANT INSERT (
  package_id, package_name, weight_kg, height_cm, fitness_goal,
  exercise_routine, wants_exercise_plan, dietary_restrictions,
  health_notes, appointment_date, appointment_time,
  client_name, client_email, client_phone
) ON bookings TO anon, authenticated;

DROP POLICY IF EXISTS "provider_select_bookings" ON bookings;
CREATE POLICY "provider_select_bookings" ON bookings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "provider_update_bookings" ON bookings;
CREATE POLICY "provider_update_bookings" ON bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

REVOKE UPDATE ON bookings FROM authenticated;
GRANT UPDATE (status) ON bookings TO authenticated;

-- Double booking prevention
CREATE UNIQUE INDEX IF NOT EXISTS bookings_no_double_booking
ON bookings (appointment_date, appointment_time)
WHERE status NOT IN ('cancelled');

-- ============================================================================
-- SUBSCRIBER TABLES
-- ============================================================================

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id text NOT NULL,
  package_name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'trialing')),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  -- Delivery address
  building_number text,
  street text,
  area text,
  maid_number text,
  latitude double precision,
  longitude double precision,
  delivery_notes text,
  -- Breakfast/lunch/dinner delivery windows
  breakfast_window text DEFAULT '7-9 AM',
  lunch_window text DEFAULT '12-2 PM',
  dinner_window text DEFAULT '5-7 PM',
  -- Payment integration columns
  dibsy_customer_id text,
  dibsy_payment_id text,
  dibsy_card_token text,
  payment_provider text DEFAULT 'dibsy',
  tap_charge_id text,
  is_owner boolean DEFAULT false,
  full_name text,
  phone text,
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Subscribers RLS policies
DROP POLICY IF EXISTS "select_own_subscription" ON subscribers;
CREATE POLICY "select_own_subscription" ON subscribers FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_subscription" ON subscribers;
CREATE POLICY "insert_own_subscription" ON subscribers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_subscription" ON subscribers;
CREATE POLICY "update_own_subscription" ON subscribers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_subscription" ON subscribers;
CREATE POLICY "delete_own_subscription" ON subscribers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Weekly menu selections
CREATE TABLE IF NOT EXISTS weekly_menu_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday')),
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  dish_name text NOT NULL,
  dish_kcals integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subscriber_id, week_start_date, day_of_week, meal_type)
);

ALTER TABLE weekly_menu_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_menu_selections" ON weekly_menu_selections;
CREATE POLICY "select_own_menu_selections" ON weekly_menu_selections FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = weekly_menu_selections.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_menu_selections" ON weekly_menu_selections;
CREATE POLICY "insert_own_menu_selections" ON weekly_menu_selections FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = weekly_menu_selections.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_menu_selections" ON weekly_menu_selections;
CREATE POLICY "update_own_menu_selections" ON weekly_menu_selections FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = weekly_menu_selections.subscriber_id AND subscribers.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = weekly_menu_selections.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_menu_selections" ON weekly_menu_selections;
CREATE POLICY "delete_own_menu_selections" ON weekly_menu_selections FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = weekly_menu_selections.subscriber_id AND subscribers.user_id = auth.uid())
  );

-- Progress entries
CREATE TABLE IF NOT EXISTS progress_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  weight_kg numeric(5,1),
  waist_cm numeric(5,1),
  hip_cm numeric(5,1),
  notes text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_progress" ON progress_entries;
CREATE POLICY "select_own_progress" ON progress_entries FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = progress_entries.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_progress" ON progress_entries;
CREATE POLICY "insert_own_progress" ON progress_entries FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = progress_entries.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_progress" ON progress_entries;
CREATE POLICY "update_own_progress" ON progress_entries FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = progress_entries.subscriber_id AND subscribers.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = progress_entries.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_progress" ON progress_entries;
CREATE POLICY "delete_own_progress" ON progress_entries FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = progress_entries.subscriber_id AND subscribers.user_id = auth.uid())
  );

-- ============================================================================
-- HEALTH INTEGRATION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS health_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  terra_user_id text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected')),
  connected_at timestamptz DEFAULT now(),
  disconnected_at timestamptz,
  last_synced_at timestamptz,
  UNIQUE(subscriber_id)
);

ALTER TABLE health_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_health_connection" ON health_connections;
CREATE POLICY "select_own_health_connection" ON health_connections FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = health_connections.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_health_connection" ON health_connections;
CREATE POLICY "insert_own_health_connection" ON health_connections FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = health_connections.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_health_connection" ON health_connections;
CREATE POLICY "update_own_health_connection" ON health_connections FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = health_connections.subscriber_id AND subscribers.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = health_connections.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_health_connection" ON health_connections;
CREATE POLICY "delete_own_health_connection" ON health_connections FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = health_connections.subscriber_id AND subscribers.user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS health_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  terra_user_id text NOT NULL,
  data_type text NOT NULL CHECK (data_type IN ('body', 'daily', 'activity', 'sleep')),
  payload jsonb NOT NULL,
  received_at timestamptz DEFAULT now()
);

ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_health_data" ON health_data;
CREATE POLICY "select_own_health_data" ON health_data FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = health_data.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_health_data" ON health_data;
CREATE POLICY "insert_own_health_data" ON health_data FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = health_data.subscriber_id AND subscribers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_health_data" ON health_data;
CREATE POLICY "delete_own_health_data" ON health_data FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = health_data.subscriber_id AND subscribers.user_id = auth.uid())
  );

-- ============================================================================
-- NOTIFICATIONS AND REMINDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  recipient text NOT NULL,
  recipient_role text NOT NULL CHECK (recipient_role IN ('client', 'provider')),
  subject text NOT NULL,
  body_html text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'pending', 'failed')),
  provider text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_select_notifications" ON notifications;
CREATE POLICY "provider_select_notifications" ON notifications FOR SELECT
  TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('24h', '1h')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, reminder_type)
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_select_reminders" ON reminders;
CREATE POLICY "provider_select_reminders" ON reminders FOR SELECT
  TO authenticated USING (true);

-- ============================================================================
-- PACKAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  kcals integer NOT NULL CHECK (kcals > 0),
  price integer NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'QR',
  meals text NOT NULL,
  duration text NOT NULL,
  description text NOT NULL,
  highlight text NOT NULL,
  image text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_active_packages" ON packages;
CREATE POLICY "public_select_active_packages"
  ON packages FOR SELECT
  TO anon, authenticated
  USING (active = true);

INSERT INTO packages (
  id, name, kcals, price, currency, meals, duration, description, highlight, image, active, sort_order
) VALUES
  (
    '1100kcal',
    'Essential',
    1100,
    1700,
    'QR',
    '2 Meals + 1 Snack',
    '4 Weeks (28 boxes)',
    'A focused, calorie-controlled plan designed for steady, healthy weight loss.',
    'Best for weight loss',
    'https://images.pexels.com/photos/7660437/pexels-photo-7660437.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    true,
    1
  ),
  (
    '1400kcal',
    'Balance',
    1400,
    2000,
    'QR',
    '3 Main Meals',
    '4 Weeks (28 boxes)',
    'The perfect all-day meal plan for balanced nutrition and sustained energy.',
    'Most popular',
    'https://images.pexels.com/photos/19130868/pexels-photo-19130868.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    true,
    2
  ),
  (
    '1500kcal',
    'Performance',
    1500,
    2200,
    'QR',
    '3 Meals + 1 Snack',
    '4 Weeks (28 personalised boxes)',
    'A fully personalised plan for active lifestyles and performance goals.',
    'For active lifestyles',
    'https://images.pexels.com/photos/4929676/pexels-photo-4929676.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    true,
    3
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  kcals = EXCLUDED.kcals,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  meals = EXCLUDED.meals,
  duration = EXCLUDED.duration,
  description = EXCLUDED.description,
  highlight = EXCLUDED.highlight,
  image = EXCLUDED.image,
  active = EXCLUDED.active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ============================================================================
-- HELPER FUNCTIONS (Must be created before policies that reference them)
-- ============================================================================

-- Provider check function
CREATE OR REPLACE FUNCTION public.is_provider()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lower(coalesce(auth.jwt() ->> 'email', '')) IN (
      'kevmulgeo@gmail.com',
      'issashahid1@gmail.com',
      'georgekmuliika@gmail.com'
    )
    OR EXISTS (
      SELECT 1 FROM subscribers
      WHERE user_id = auth.uid() AND is_owner = true
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_provider() TO authenticated;

-- Brevo vault helper
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

-- Vault functions are service-role only for security
-- They access encrypted secrets and should not be exposed to clients
REVOKE EXECUTE ON FUNCTION public.get_brevo_config() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_brevo_config() TO service_role;

-- Stripe webhook vault helper
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

REVOKE EXECUTE ON FUNCTION public.get_stripe_webhook_secret() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_stripe_webhook_secret() TO service_role;

-- Terra vault helper
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

REVOKE EXECUTE ON FUNCTION public.get_terra_config() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_terra_config() TO service_role;

-- Dibsy vault helper
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

REVOKE EXECUTE ON FUNCTION public.get_dibsy_config() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dibsy_config() TO service_role;

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

REVOKE EXECUTE ON FUNCTION public.get_dibsy_webhook_secret() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dibsy_webhook_secret() TO service_role;

-- Tap vault helper
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

REVOKE EXECUTE ON FUNCTION public.get_tap_config() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tap_config() TO service_role;

-- ============================================================================
-- RIDER TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS rider_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  approved boolean NOT NULL DEFAULT false,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE rider_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "riders_insert_own_application" ON rider_applications;
CREATE POLICY "riders_insert_own_application"
  ON rider_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND approved = false);

DROP POLICY IF EXISTS "riders_select_own_application" ON rider_applications;
CREATE POLICY "riders_select_own_application"
  ON rider_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "providers_select_all_rider_applications" ON rider_applications;
CREATE POLICY "providers_select_all_rider_applications"
  ON rider_applications FOR SELECT
  TO authenticated
  USING (public.is_provider());

DROP POLICY IF EXISTS "providers_update_rider_applications" ON rider_applications;
CREATE POLICY "providers_update_rider_applications"
  ON rider_applications FOR UPDATE
  TO authenticated
  USING (public.is_provider())
  WITH CHECK (public.is_provider());

CREATE TABLE IF NOT EXISTS rider_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_application_id uuid NOT NULL REFERENCES rider_applications(id) ON DELETE CASCADE,
  rider_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  delivery_date date NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Qatar')::date,
  meal_type text NOT NULL DEFAULT 'lunch' CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
  time_window text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  notes text,
  proof_photo_url text,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscriber_id, delivery_date, meal_type)
);

ALTER TABLE rider_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "providers_manage_rider_deliveries" ON rider_deliveries;
CREATE POLICY "providers_manage_rider_deliveries"
  ON rider_deliveries FOR ALL
  TO authenticated
  USING (public.is_provider())
  WITH CHECK (public.is_provider());

DROP POLICY IF EXISTS "riders_select_own_deliveries" ON rider_deliveries;
CREATE POLICY "riders_select_own_deliveries"
  ON rider_deliveries FOR SELECT
  TO authenticated
  USING (
    rider_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM rider_applications
      WHERE rider_applications.id = rider_deliveries.rider_application_id
        AND rider_applications.user_id = auth.uid()
        AND rider_applications.approved = true
    )
  );

DROP POLICY IF EXISTS "riders_update_own_delivery_status" ON rider_deliveries;
CREATE POLICY "riders_update_own_delivery_status"
  ON rider_deliveries FOR UPDATE
  TO authenticated
  USING (
    rider_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM rider_applications
      WHERE rider_applications.id = rider_deliveries.rider_application_id
        AND rider_applications.user_id = auth.uid()
        AND rider_applications.approved = true
    )
  )
  WITH CHECK (
    rider_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM rider_applications
      WHERE rider_applications.id = rider_deliveries.rider_application_id
        AND rider_applications.user_id = auth.uid()
        AND rider_applications.approved = true
    )
  );

-- ============================================================================
-- PROVIDER ACCESS POLICIES
-- ============================================================================

-- Allow providers to read all subscriber data
DROP POLICY IF EXISTS "provider_select_all_subscribers" ON subscribers;
CREATE POLICY "provider_select_all_subscribers"
  ON subscribers FOR SELECT
  TO authenticated
  USING (public.is_provider());

DROP POLICY IF EXISTS "provider_select_all_menu_selections" ON weekly_menu_selections;
CREATE POLICY "provider_select_all_menu_selections"
  ON weekly_menu_selections FOR SELECT
  TO authenticated
  USING (public.is_provider());

DROP POLICY IF EXISTS "provider_select_all_progress" ON progress_entries;
CREATE POLICY "provider_select_all_progress"
  ON progress_entries FOR SELECT
  TO authenticated
  USING (public.is_provider());

DROP POLICY IF EXISTS "provider_select_all_health_data" ON health_data;
CREATE POLICY "provider_select_all_health_data"
  ON health_data FOR SELECT
  TO authenticated
  USING (public.is_provider());

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

-- Generic trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply trigger to subscribers table
DROP TRIGGER IF EXISTS handle_subscribers_updated_at ON subscribers;
CREATE TRIGGER handle_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Apply trigger to rider_applications table (if it has updated_at)
DROP TRIGGER IF EXISTS handle_rider_applications_updated_at ON rider_applications;
CREATE TRIGGER handle_rider_applications_updated_at
  BEFORE UPDATE ON rider_applications
  FOR EACH ROW
  WHEN (OLD.updated_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_updated_at();

-- Apply trigger to rider_deliveries table (if it has updated_at)
DROP TRIGGER IF EXISTS handle_rider_deliveries_updated_at ON rider_deliveries;
CREATE TRIGGER handle_rider_deliveries_updated_at
  BEFORE UPDATE ON rider_deliveries
  FOR EACH ROW
  WHEN (OLD.updated_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON bookings (appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON notifications (booking_id);
CREATE INDEX IF NOT EXISTS idx_reminders_booking_type ON reminders (booking_id, reminder_type);
CREATE INDEX IF NOT EXISTS idx_weekly_menu_subscriber_week ON weekly_menu_selections(subscriber_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_progress_subscriber ON progress_entries(subscriber_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_health_data_subscriber_type ON health_data(subscriber_id, data_type, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_conn_terra_user ON health_connections(terra_user_id);
CREATE INDEX IF NOT EXISTS idx_rider_applications_approved_created ON rider_applications(approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rider_deliveries_rider_date ON rider_deliveries(rider_user_id, delivery_date, status);
CREATE INDEX IF NOT EXISTS idx_rider_deliveries_status_date ON rider_deliveries(status, delivery_date);

-- ============================================================================
-- SCHEDULED REMINDERS (UPDATE URL FOR NEW PROJECT)
-- ============================================================================

-- Remove any existing job with the same name
DO $$
BEGIN
  PERFORM cron.unschedule('send-reminders-job');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule reminders every 30 minutes
-- Updated for Triangle Healthy Kitchen project (teguqlkfmchxucedxvpu)
SELECT cron.schedule(
  'send-reminders-job',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://teguqlkfmchxucedxvpu.supabase.co/functions/v1/send-reminders',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  $$
);
