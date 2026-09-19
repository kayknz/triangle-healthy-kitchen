import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, prefer",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("--- Tap Protocol v8.2 (Auth-Locked / Web) ---");

    // ---------------------------------------------------------
    // 1. AUTHENTICATE THE REQUEST
    // ---------------------------------------------------------
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      throw new Error("Authorization required.");
    }

    const body = await req.json();

    const packageId = body.package_id;
    const subscriberId = body.subscriber_id;

    if (!packageId) {
      throw new Error("Package ID is required.");
    }

    if (!subscriberId) {
      throw new Error("Subscriber ID is required.");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing.");
    }

    // Client authenticated as the actual requesting user.
    const userClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized identity.");
    }

    // ---------------------------------------------------------
    // 2. SERVER-SIDE DATABASE CLIENT
    // ---------------------------------------------------------
    const supabase = createClient(
      SUPABASE_URL,
      SERVICE_ROLE_KEY
    );

    // ---------------------------------------------------------
    // 3. VERIFY SUBSCRIBER OWNERSHIP
    // ---------------------------------------------------------
    const { data: subCheck, error: subError } = await supabase
      .from("subscribers")
      .select("user_id")
      .eq("id", subscriberId)
      .single();

    if (subError || !subCheck) {
      throw new Error("Subscriber record not found.");
    }

    if (subCheck.user_id !== user.id) {
      throw new Error(
        "Identity mismatch: payment protocol restricted."
      );
    }

    // ---------------------------------------------------------
    // 4. USE AUTHENTICATED EMAIL
    // ---------------------------------------------------------
    const email = user.email;

    if (!email) {
      throw new Error("Authenticated email is required.");
    }

    // ---------------------------------------------------------
    // 5. AUTHORITATIVE PACKAGE PRICE
    // ---------------------------------------------------------
    const { data: pkg, error: pkgError } = await supabase
      .from("packages")
      .select("price, name")
      .eq("id", packageId)
      .single();

    if (pkgError || !pkg) {
      throw new Error("Invalid package.");
    }

    const amount = Number(pkg.price);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Invalid package price.");
    }

    // ---------------------------------------------------------
    // 6. TAP SECRET FROM SERVER ENVIRONMENT ONLY
    // ---------------------------------------------------------
    const TAP_SECRET_KEY = Deno.env.get("TAP_SECRET_KEY");

    if (!TAP_SECRET_KEY) {
      throw new Error("Tap configuration missing.");
    }

    // ---------------------------------------------------------
    // 7. CREATE AUTHORITATIVE PAYMENT TRANSACTION
    // ---------------------------------------------------------
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        subscriber_id: subscriberId,
        amount,
        currency: "QAR",
        status: "initiated",
        metadata: {
          package_id: packageId,
          package_name: pkg.name,
          authenticated_user_id: user.id,
        },
      })
      .select("id")
      .single();

    if (txError || !transaction) {
      console.error(
        "Transaction registration failed:",
        txError?.message
      );

      throw new Error(
        "Unable to register payment transaction."
      );
    }

    // ---------------------------------------------------------
    // 8. CREATE TAP CHARGE
    // ---------------------------------------------------------
    const tapPayload = {
      amount,
      currency: "QAR",
      threeDSecure: true,
      save_card: false,

      description: `Plan: ${pkg.name}`,

      statement_descriptor: "TRIANGLE",

      metadata: {
        subscriber_id: subscriberId,
        transaction_id: transaction.id,
        package_id: packageId,
      },

      // Legacy field support
      udf1: subscriberId,
      udf2: user.id,

      customer: {
        first_name:
          email.split("@")[0] || "Member",
        email,
      },

      source: {
        id: "src_card",
      },

      redirect: {
        url:
          body.success_url ||
          "https://triangle.qa",
      },
    };

    const response = await fetch(
      "https://api.tap.company/v2/charges",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${TAP_SECRET_KEY}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify(tapPayload),
      }
    );

    const result = await response.json();

    // ---------------------------------------------------------
    // 9. HANDLE TAP FAILURE
    // ---------------------------------------------------------
    if (!response.ok) {
      console.error(
        "Tap rejected charge:",
        JSON.stringify(result)
      );

      // Mark our transaction as failed.
      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          metadata: {
            package_id: packageId,
            package_name: pkg.name,
            authenticated_user_id: user.id,
            tap_error: result,
          },
        })
        .eq("id", transaction.id);

      return new Response(
        JSON.stringify({
          error: "Tap payment rejected.",
          details: result,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ---------------------------------------------------------
    // 10. VALIDATE TAP RESPONSE
    // ---------------------------------------------------------
    if (!result?.id) {
      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
        })
        .eq("id", transaction.id);

      throw new Error(
        "Tap returned an invalid charge response."
      );
    }

    // ---------------------------------------------------------
    // 11. UPDATE EXACT TRANSACTION
    // ---------------------------------------------------------
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        tap_charge_id: result.id,
        status: "pending",
      })
      .eq("id", transaction.id);

    if (updateError) {
      console.error(
        "Payment transaction update failed:",
        updateError.message
      );

      throw new Error(
        "Payment created but transaction tracking failed."
      );
    }

    console.log(
      "Charge Created:",
      result.id,
      "Transaction:",
      transaction.id
    );

    // ---------------------------------------------------------
    // 12. RETURN TAP CHECKOUT URL
    // ---------------------------------------------------------
    return new Response(
      JSON.stringify({
        url: result.transaction?.url,
        charge_id: result.id,
        transaction_id: transaction.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error(
      "TAP CHECKOUT CRASH:",
      err?.message || err
    );

    return new Response(
      JSON.stringify({
        error:
          err?.message ||
          "Payment checkout failed.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});