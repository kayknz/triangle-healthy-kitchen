/*
  # Rider deliveries

  Connects approved rider accounts to actual delivery assignments. Riders only
  see and update their own route rows; providers can assign and manage routes.
*/

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text;

CREATE TABLE IF NOT EXISTS rider_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_application_id uuid NOT NULL REFERENCES rider_applications(id) ON DELETE CASCADE,
  rider_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  delivery_date date NOT NULL DEFAULT CURRENT_DATE,
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

CREATE INDEX IF NOT EXISTS idx_rider_deliveries_rider_date
  ON rider_deliveries(rider_user_id, delivery_date, status);

CREATE INDEX IF NOT EXISTS idx_rider_deliveries_status_date
  ON rider_deliveries(status, delivery_date);
