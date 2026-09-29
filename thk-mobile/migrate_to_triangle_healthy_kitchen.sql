-- ============================================================================
-- Triangle Healthy Kitchen - Complete Authoritative Supabase Migration Script
-- ============================================================================
-- Copy and run this entire script in the Supabase SQL Editor.
-- All previous tables will be dropped and replaced with the complete THK operational schema.
-- ============================================================================

-- ============================================================================
-- 1. TEARDOWN (Drop old views & tables in reverse dependency order)
-- ============================================================================

DROP VIEW IF EXISTS provider_bookings_view CASCADE;
DROP TABLE IF EXISTS community_reactions CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS reward_redemptions CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS points_ledger CASCADE;
DROP TABLE IF EXISTS daily_activity_summaries CASCADE;
DROP TABLE IF EXISTS user_daily_goals CASCADE;
DROP TABLE IF EXISTS challenge_templates CASCADE;
DROP TABLE IF EXISTS regional_communities CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS phone_verifications CASCADE;
DROP TABLE IF EXISTS otp_requests CASCADE;
DROP TABLE IF EXISTS rider_deliveries CASCADE;
DROP TABLE IF EXISTS delivery_jobs CASCADE;
DROP TABLE IF EXISTS kitchen_jobs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS weekly_menu_selections CASCADE;
DROP TABLE IF EXISTS progress_entries CASCADE;
DROP TABLE IF EXISTS deletion_requests CASCADE;
DROP TABLE IF EXISTS rider_applications CASCADE;
DROP TABLE IF EXISTS subscribers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS global_settings CASCADE;

-- ============================================================================
-- 2. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 3. CORE OPERATIONAL TABLES
-- ============================================================================

-- Global Settings
CREATE TABLE global_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_season text NOT NULL DEFAULT 'summer',
  ramadan_mode boolean NOT NULL DEFAULT false,
  current_menu_period text DEFAULT '2026-W38',
  selection_deadline timestamptz,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO global_settings (active_season, ramadan_mode, current_menu_period)
VALUES ('summer', false, '2026-W38');

-- Regional Communities
CREATE TABLE regional_communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  weekly_team_target_pct integer DEFAULT 60,
  created_at timestamptz DEFAULT now()
);

-- Registrations (Pending Customer Applications)
CREATE TABLE registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text,
  email text,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  password_hash text,
  payload_json jsonb DEFAULT '{}'::jsonb,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers & Subscribers (Unified Table)
CREATE TABLE subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES registrations(id) ON DELETE SET NULL,
  phone text,
  email text,
  full_name text NOT NULL,
  package_id text NOT NULL DEFAULT '1400kcal',
  package_name text NOT NULL DEFAULT 'Weight Loss 1400 kcal',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'trialing', 'pending')),
  category text DEFAULT 'A' CHECK (category IN ('A', 'B', 'C', 'D', 'E', 'F', 'Standard')),
  meal_package_id text DEFAULT '3m',
  plan text DEFAULT '26 Days Monthly Protocol',
  payment_status text DEFAULT 'Paid',
  subscription_status text DEFAULT 'Active',
  remaining_days integer NOT NULL DEFAULT 26 CHECK (remaining_days >= 0),
  is_owner boolean DEFAULT false,
  is_paused boolean DEFAULT false,
  membership_type text DEFAULT 'subscriber',
  reward_tier text DEFAULT 'community',
  points_balance integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  preferred_region_id uuid REFERENCES regional_communities(id) ON DELETE SET NULL,
  building_number text,
  street text,
  area text,
  maid_number text,
  latitude double precision,
  longitude double precision,
  delivery_notes text,
  breakfast_window text DEFAULT '7-9 AM',
  lunch_window text DEFAULT '12-2 PM',
  dinner_window text DEFAULT '5-7 PM',
  allergies text[],
  dislikes text[],
  push_token text,
  payload_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Kitchen Jobs (Daily Prep Tasks)
CREATE TABLE kitchen_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'held_payment', 'paused', 'completed', 'canceled')),
  payload_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(subscriber_id, service_date)
);

-- Delivery Jobs (Daily Rider Dispatches)
CREATE TABLE delivery_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  zone text,
  area text,
  assigned_driver_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'held_payment', 'paused', 'in_transit', 'delivered', 'failed')),
  payload_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(subscriber_id, service_date)
);

-- Rider Applications & Profiles
CREATE TABLE rider_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  email text,
  full_name text,
  approved boolean NOT NULL DEFAULT false,
  approved_at timestamptz,
  is_online boolean DEFAULT false,
  current_lat double precision,
  current_lng double precision,
  last_active_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rider Deliveries (Assigned Stops)
CREATE TABLE rider_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_application_id uuid REFERENCES rider_applications(id) ON DELETE CASCADE,
  rider_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  delivery_date date NOT NULL,
  meal_type text NOT NULL DEFAULT 'lunch',
  time_window text DEFAULT '12-2 PM',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'failed')),
  notes text,
  proof_storage_path text,
  delivered_at timestamptz,
  assigned_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(subscriber_id, delivery_date, meal_type)
);

-- Weekly Menu Selections
CREATE TABLE weekly_menu_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday')),
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack','snacks')),
  dish_id text,
  dish_name text NOT NULL,
  dish_kcals integer,
  customizations jsonb DEFAULT '{}'::jsonb,
  menu_period text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subscriber_id, week_start_date, day_of_week, meal_type)
);

-- Progress Entries
CREATE TABLE progress_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  weight_kg numeric(5,1),
  waist_cm numeric(5,1),
  hip_cm numeric(5,1),
  notes text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Consultation Bookings
CREATE TABLE bookings (
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
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Notifications Log (Brevo API)
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  recipient text NOT NULL,
  recipient_role text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  provider text DEFAULT 'brevo',
  error text,
  created_at timestamptz DEFAULT now()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details_json jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Activity Challenges & Rewards Catalog
CREATE TABLE challenge_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text NOT NULL CHECK (activity_type IN ('steps', 'distance_walk', 'distance_run', 'active_minutes', 'workout')),
  daily_target numeric NOT NULL,
  weekly_threshold_days integer DEFAULT 5,
  difficulty text DEFAULT 'moderate',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE user_daily_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES challenge_templates(id),
  target_date date NOT NULL,
  current_value numeric DEFAULT 0,
  target_value numeric NOT NULL,
  is_completed boolean DEFAULT false,
  points_awarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subscriber_id, target_date)
);

CREATE TABLE daily_activity_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  local_date date NOT NULL,
  time_zone text DEFAULT 'Asia/Qatar',
  activity_type text NOT NULL,
  total_value numeric NOT NULL,
  unit text NOT NULL,
  source_platform text,
  verification_status text DEFAULT 'unverified',
  sync_timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(subscriber_id, local_date, activity_type)
);

CREATE TABLE points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  points_delta integer NOT NULL,
  source_goal_id uuid REFERENCES user_daily_goals(id),
  idempotency_key text UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL CHECK (tier IN ('community', 'reset', 'balance', 'perform')),
  name text NOT NULL,
  description text,
  point_cost integer NOT NULL,
  stock_count integer DEFAULT -1,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. HELPER FUNCTIONS
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

GRANT EXECUTE ON FUNCTION public.is_provider() TO authenticated, anon;

-- Qatar Service Days Function (Skips Fridays)
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
    IF extract(dow from v_current_time AT TIME ZONE 'Asia/Qatar') != 5 THEN
      v_remaining_days := v_remaining_days - 1;
    END IF;
  END LOOP;

  RETURN v_current_time;
END;
$$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_read_global_settings" ON global_settings FOR SELECT USING (true);
CREATE POLICY "providers_manage_global_settings" ON global_settings FOR ALL TO authenticated USING (public.is_provider());

ALTER TABLE regional_communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select_communities" ON regional_communities FOR SELECT TO authenticated USING (true);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_create_registration" ON registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "providers_manage_registrations" ON registrations FOR ALL TO authenticated USING (public.is_provider());

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_subscriber" ON subscribers FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_provider());
CREATE POLICY "insert_own_subscriber" ON subscribers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_provider());
CREATE POLICY "update_own_subscriber" ON subscribers FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_provider());
CREATE POLICY "providers_delete_subscriber" ON subscribers FOR DELETE TO authenticated USING (public.is_provider());

ALTER TABLE kitchen_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers_manage_kitchen_jobs" ON kitchen_jobs FOR ALL TO authenticated USING (public.is_provider());

ALTER TABLE delivery_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers_manage_delivery_jobs" ON delivery_jobs FOR ALL TO authenticated USING (public.is_provider());

ALTER TABLE rider_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riders_select_own_application" ON rider_applications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_provider());
CREATE POLICY "riders_insert_own_application" ON rider_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND approved = false);
CREATE POLICY "riders_update_own_application" ON rider_applications FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_provider());

ALTER TABLE rider_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riders_manage_assigned_deliveries" ON rider_deliveries FOR ALL TO authenticated USING (auth.uid() = rider_user_id OR public.is_provider());

ALTER TABLE weekly_menu_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscribers_manage_own_menu" ON weekly_menu_selections FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = weekly_menu_selections.subscriber_id AND subscribers.user_id = auth.uid()) OR public.is_provider());

ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscribers_manage_own_progress" ON progress_entries FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM subscribers WHERE subscribers.id = progress_entries.subscriber_id AND subscribers.user_id = auth.uid()) OR public.is_provider());

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
CREATE POLICY "providers_select_bookings" ON bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "providers_update_bookings" ON bookings FOR UPDATE TO authenticated USING (public.is_provider());

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers_read_notifications" ON notifications FOR SELECT TO authenticated USING (public.is_provider());

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers_read_audit_logs" ON audit_logs FOR SELECT TO authenticated USING (public.is_provider());

ALTER TABLE challenge_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select_challenge_templates" ON challenge_templates FOR SELECT TO authenticated USING (is_active = true);

ALTER TABLE user_daily_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_goals" ON user_daily_goals FOR SELECT TO authenticated USING (
  subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid())
);

ALTER TABLE daily_activity_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_activity" ON daily_activity_summaries FOR SELECT TO authenticated USING (
  subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid())
);

ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_ledger" ON points_ledger FOR SELECT TO authenticated USING (
  subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid())
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select_active_rewards" ON rewards FOR SELECT TO authenticated USING (is_active = true);

-- ============================================================================
-- 6. VIEWS & STORAGE BUCKET CONFIGURATION
-- ============================================================================

CREATE OR REPLACE VIEW provider_bookings_view AS
  SELECT * FROM bookings ORDER BY appointment_date ASC;

GRANT SELECT ON provider_bookings_view TO authenticated, anon;

-- Delivery Proof Storage Bucket Configuration
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-proofs', 'delivery-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Authenticated riders upload delivery proof" ON storage.objects;
CREATE POLICY "Authenticated riders upload delivery proof" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'delivery-proofs');

DROP POLICY IF EXISTS "Anyone view delivery proof" ON storage.objects;
CREATE POLICY "Anyone view delivery proof" ON storage.objects
  FOR SELECT TO authenticated, anon USING (bucket_id = 'delivery-proofs');

-- ============================================================================
-- 7. SEED DATA (Regional Communities, Challenges & Demo Registrations)
-- ============================================================================

INSERT INTO regional_communities (name, slug) VALUES
('Lusail', 'lusail'),
('Al Sadd', 'al-sadd'),
('Al Wakrah', 'al-wakrah'),
('West Bay', 'west-bay'),
('The Pearl', 'the-pearl'),
('Al Rayyan', 'al-rayyan')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO challenge_templates (activity_type, daily_target, difficulty) VALUES
('steps', 8000, 'moderate'),
('steps', 12000, 'premium'),
('distance_walk', 5, 'moderate'),
('active_minutes', 30, 'moderate')
ON CONFLICT DO NOTHING;

INSERT INTO registrations (id, name, email, phone, status) VALUES
('00000000-0000-0000-0000-000000000001', 'Fatima Al-Kuwari', 'fatima.qatar@example.com', '+97433123456', 'approved'),
('00000000-0000-0000-0000-000000000002', 'Rashid Al-Thani', 'rashid.lusail@example.com', '+97455889900', 'approved'),
('00000000-0000-0000-0000-000000000003', 'Mariya Hassan', 'mariya.pearl@example.com', '+97466778899', 'approved'),
('00000000-0000-0000-0000-000000000004', 'Tariq Al-Mansoori', 'tariq.westbay@example.com', '+97477112233', 'pending'),
('00000000-0000-0000-0000-000000000005', 'Nour Al-Sulaiti', 'nour.sadd@example.com', '+97433445566', 'pending')
ON CONFLICT (id) DO NOTHING;
