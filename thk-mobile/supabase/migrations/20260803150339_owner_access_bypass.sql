/*
# Owner Access Bypass

## Purpose
Allows the app owners (specific email addresses) to access the full subscriber
dashboard without paying. When an owner signs in, a subscriber record is
auto-created with active status and owner_bypass as the payment provider.

## Changes
- Adds an is_owner column to subscribers table to flag owner accounts
- No RLS policy changes needed — owners authenticate normally via Supabase Auth
*/

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS is_owner boolean DEFAULT false;

-- Update RLS policies to allow owners to see their own record
-- (existing policies already check user_id = auth.uid(), so owners work automatically)