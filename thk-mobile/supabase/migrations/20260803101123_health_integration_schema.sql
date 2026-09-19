/*
# Health Data Integration Schema (Terra API)

## Purpose
Stores user connections to health data sources (Apple Health, Samsung Health,
Google Fit, Fitbit, Garmin, etc.) via the Terra API, and caches synced health
data (body weight, measurements, daily activity, sleep) so the subscriber
dashboard can display it without calling Terra on every page load.

## New Tables

### health_connections
- Links a subscriber to their Terra user ID and connected provider
- provider: which health app they connected (APPLE, SAMSUNG, GOOGLE, FITBIT, etc.)
- terra_user_id: unique ID assigned by Terra for this user
- status: active or disconnected
- connected_at, disconnected_at timestamps
- last_synced_at: when we last received data from Terra for this user

### health_data
- Caches the latest health data payload from Terra
- data_type: body, daily, activity, sleep
- payload: JSONB storing the raw Terra event data (weight, steps, calories, etc.)
- received_at: when the data was received from Terra
- One subscriber can have multiple data rows across types and dates

## Security
- RLS enabled on both tables
- Owner-scoped through subscribers table ownership check
- TO authenticated only — health data is private to the subscriber

## Notes
1. Both tables reference subscribers(id) with ON DELETE CASCADE
2. Terra webhook writes health_data rows using the service role key (bypasses RLS)
3. Subscriber dashboard reads health_data through authenticated RLS policies
*/

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

CREATE INDEX IF NOT EXISTS idx_health_data_subscriber_type ON health_data(subscriber_id, data_type, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_conn_terra_user ON health_connections(terra_user_id);