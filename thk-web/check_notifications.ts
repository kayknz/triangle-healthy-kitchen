import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://teguqlkfmchxucedxvpu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZ3VxbGtmbWNoeHVjZWR4dnB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDUzMDYsImV4cCI6MjEwMjgyMTMwNn0.A5lIMp4K698blgpJIPWWkRThLuhYzsBJlnsq-SIoDWI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Checking notifications...');
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching notifications:', error);
  } else {
    console.log('Recent Notifications:', JSON.stringify(data, null, 2));
  }
}

check();
