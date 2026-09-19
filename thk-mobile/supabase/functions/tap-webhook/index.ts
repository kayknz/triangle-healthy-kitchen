import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TAP_WEBHOOK_SECRET = Deno.env.get("TAP_WEBHOOK_SECRET")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    // Tap Status Protocol: CAPTURED | FAILED | CANCELLED | VOID
    const status = event.status;
    const metadata = event.metadata || {};
    // Support both modern metadata and legacy UDF fields
    const subscriberId = metadata.subscriber_id || event.udf1;
    const chargeId = event.id;

    console.log(`Processing Webhook for Charge: ${chargeId} - Status: ${status} - Subscriber: ${subscriberId}`);

    if (!subscriberId) {
      return new Response(JSON.stringify({ received: true, note: "non-subscriber charge" }), { status: 200, headers: corsHeaders });
    }

    if (status === "CAPTURED") {
      // 1. Fetch Subscriber to determine duration
      const { data: sub } = await supabase
        .from("subscribers")
        .select("duration")
        .eq("id", subscriberId)
        .single();

      const duration = sub?.duration || "4_weeks";

      // 2. Calculate Period End clinical precision
      let days = 24; // Default Monthly (Business Days)
      if (duration === "1_day") days = 1;
      if (duration === "1_week") days = 6;

      const updateData = {
        status: "active",
        payment_provider: "tap",
        tap_charge_id: chargeId,
        subscription_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };

      await supabase
        .from("subscribers")
        .update(updateData)
        .eq("id", subscriberId);

      // 3. Log to Loyalty Ledger
      await supabase.from("loyalty_ledger").insert({
        subscriber_id: subscriberId,
        points: Math.floor(event.amount * 0.1), // 10% cash back in points
        reason: "Subscription Activation"
      });

    } else if (status === "FAILED" || status === "VOIDED") {
      await supabase
        .from("subscribers")
        .update({ status: "paused", updated_at: new Date().toISOString() })
        .eq("id", subscriberId);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
  }
});
