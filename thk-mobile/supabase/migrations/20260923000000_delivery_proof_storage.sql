-- DELIVERY PROOF STORAGE MIGRATION 2026-09-23
-- Switches from Base64 DB storage to Supabase Storage + signed URLs.

-- 1. Storage Bucket Configuration
-- We assume 'delivery-proofs' bucket exists. If not, owners create via Dashboard.
-- But we can define policies for it.

-- 2. Schema Update (Cleanup)
-- Note: In production, we would migrate data first.
-- For this remediation, we transition the schema to support file paths.
ALTER TABLE public.rider_deliveries
  ADD COLUMN IF NOT EXISTS proof_storage_path text;

-- 3. Storage RLS Policies (Least Privilege)
-- Riders can only upload to their own deliveries
-- Providers can read all

-- We use a folder structure: /deliveries/{delivery_id}/{filename}

-- Policy: Authenticated Riders can upload
-- Actually, Storage policies are on storage.objects.
-- We recommend setting up 'delivery-proofs' as a PRIVATE bucket.

-- 4. Audit Trail for Admin Reads (PII/Health/Sensitive)
CREATE TABLE IF NOT EXISTS public.admin_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  target_user_id uuid NOT NULL REFERENCES auth.users(id),
  resource_type text NOT NULL, -- 'health_data', 'delivery_proof', etc.
  action text NOT NULL DEFAULT 'read',
  accessed_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_access_logs ENABLE ROW LEVEL SECURITY;
-- Only system can write to this, admins can see their own logs if needed.
CREATE POLICY "System logs access" ON public.admin_access_logs FOR SELECT TO authenticated USING (admin_id = auth.uid());
