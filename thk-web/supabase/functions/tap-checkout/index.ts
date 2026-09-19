import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    console.log("--- Tap Protocol v8.0 (Legacy Comp) ---");
    const body = await req.json();

    const email = body.user_email || body.email;
    const amount = Number(body.amount) || 175;

    // Switch to Card-only source to avoid ApplePay/GooglePay loading timeouts
    const tapPayload = {
      amount: amount,
      currency: "QAR",
      threeDSecure: true,
      save_card: false,
      description: `Plan: ${body.package_name || 'Standard'}`,
      statement_descriptor: "TRIANGLE",
      // Legacy Field Support
      udf1: body.subscriber_id || "na",
      udf2: body.user_id || "na",
      customer: {
        first_name: email.split("@")[0] || "Member",
        email: email
      },
      source: { id: "src_card" }, // Changed from src_all to fix loading timeout
      redirect: { url: body.success_url || "https://triangle.qa" }
    };

    const response = await fetch("https://api.tap.company/v2/charges", {
      method: "POST",
      headers: {
        "Authorization": "Bearer sk_test_LAPJw2fEqyCmsHMBhDxjuzZk",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tapPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Tap Rejected:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "Tap Rejection", details: result }), { status: 400, headers: corsHeaders });
    }

    console.log("Charge Created:", result.id);
    return new Response(JSON.stringify({ url: result.transaction?.url }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("CRASH:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
