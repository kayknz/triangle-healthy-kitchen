-- Reschedule reminders cron without auth header (verify_jwt is false on the function)
DO $$
BEGIN
  PERFORM cron.unschedule('send-reminders-job');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'send-reminders-job',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://bepswfqqqodthwrmjxds.supabase.co/functions/v1/send-reminders',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  $$
);
