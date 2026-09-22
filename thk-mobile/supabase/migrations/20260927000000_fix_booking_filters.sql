-- Fix 403 Forbidden for booking availability checks
-- PostgREST requires SELECT permission on columns used in filters (e.g. status)

GRANT SELECT (status) ON bookings TO anon, authenticated;

-- Ensure public can also see status to filter out cancelled ones in the UI
-- (This does not leak PII as Name/Email/Phone/Notes remain restricted)
