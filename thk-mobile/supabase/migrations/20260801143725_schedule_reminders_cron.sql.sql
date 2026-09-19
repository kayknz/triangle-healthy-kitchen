-- Install pg_cron extension (needed for scheduled reminders)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule the reminders edge function to run every 30 minutes.
-- It uses pg_net to invoke the edge function HTTP endpoint.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres;
GRANT USAGE ON SCHEMA extensions TO anon;

-- Remove any existing job with the same name
DO $$
BEGIN
  PERFORM cron.unschedule('send-reminders-job');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule reminders every 30 minutes
-- The edge function checks all pending/confirmed bookings and sends
-- 24h and 1h reminders via FormSubmit.co
SELECT cron.schedule(
  'send-reminders-job',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://bepswfqqqodthwrmjxds.supabase.co/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);
