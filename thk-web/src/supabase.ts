import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://teguqlkfmchxucedxvpu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZ3VxbGtmbWNoeHVjZWR4dnB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDUzMDYsImV4cCI6MjEwMjgyMTMwNn0.A5lIMp4K698blgpJIPWWkRThLuhYzsBJlnsq-SIoDWI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const NOTIFICATION_EDGE_FUNCTION = `${supabaseUrl}/functions/v1/send-booking-notification`;
