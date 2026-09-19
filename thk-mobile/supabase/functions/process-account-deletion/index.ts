import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // 1. Authorization Verification
    const authHeader = req.headers.get('Authorization')!;
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized Access.");

    const { userId } = await req.json();

    // Only allow users to delete themselves, unless service role is used (handled by createClient above)
    // But since this function uses SERVICE_ROLE_KEY internally to perform the deletion,
    // we must ensure the REQUESTER is allowed to trigger it.
    if (user.id !== userId) {
      // Check if requester is a provider/admin
      const { data: requesterSub } = await supabase
        .from('subscribers')
        .select('is_owner')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!requesterSub?.is_owner) {
        throw new Error("Identity Mismatch: Privilege Escalation Prevented.");
      }
    }

    console.log(`[EXECUTE] Clinical Purge Protocol for User: ${userId}`);

    if (!userId) throw new Error("Identity reference null.");

    // 1. Identify Subscriber
    const { data: sub } = await supabase
      .from('subscribers')
      .select('id, email')
      .eq('user_id', userId)
      .maybeSingle();

    const subId = sub?.id;
    const subEmail = sub?.email;

    // 2. Systematic Scouring of Clinical Data for Subscriber
    if (subId) {
      console.log(`[EXECUTE] Scouring Clinical Data for Subscriber: ${subId}`);

      const subTables = [
        'weekly_menu_selections',
        'health_data',
        'health_connections',
        'rider_deliveries',
        'loyalty_ledger',
        'progress_entries'
      ];

      for (const table of subTables) {
        await supabase.from(table).delete().eq('subscriber_id', subId);
      }
    }

    // 2.5 Scouring Bookings (PII Leak Prevention)
    if (subEmail) {
      console.log(`[EXECUTE] Scouring Lead Protocols for Email: ${subEmail}`);
      await supabase.from('bookings').delete().eq('client_email', subEmail);
    }

    // 3. Clear Deletion Requests (CRITICAL: References auth.users with NO ACTION)
    console.log(`[EXECUTE] Scouring Security Manifest...`);
    await supabase.from('deletion_requests').delete().eq('user_id', userId);

    // 4. Clear Rider Applications
    console.log(`[EXECUTE] Scouring Fleet Records...`);
    await supabase.from('rider_applications').delete().eq('user_id', userId);

    // 5. Terminate Subscriber Profile
    console.log(`[EXECUTE] Terminating Parent Profile...`);
    await supabase.from('subscribers').delete().eq('user_id', userId);

    // 6. Hard Wipe of Auth Credentials (The Ultimate Purge)
    console.log(`[EXECUTE] Scouring Auth Layer...`);
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      if (!authError.message.toLowerCase().includes('not found')) {
        throw new Error(`Auth Layer Wipe Failed: ${authError.message}`);
      }
    }

    console.log(`[EXECUTE] Clinical Purge Successful.`);
    return new Response(JSON.stringify({ success: true, message: "Identity and biological data scoured." }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error(`[EXECUTE] FATAL PROTOCOL ERROR: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message || "Total System Rejection." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
