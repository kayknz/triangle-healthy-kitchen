import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Payment configuration is incomplete.");
}

// Service-role client is used only inside this server-side Edge Function.
// Never expose SERVICE_ROLE_KEY to the client.
const adminClient = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method Not Allowed" },
      405,
    );
  }

  try {
    // ---------------------------------------------------------
    // 1. REQUIRE AUTHENTICATION
    // ---------------------------------------------------------

    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(
        { error: "Authentication required." },
        401,
      );
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();

    if (!accessToken) {
      return jsonResponse(
        { error: "Authentication required." },
        401,
      );
    }

    // Client using the user's JWT.
    const userClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(accessToken);

    if (userError || !user) {
      console.error("Authentication failure:", userError?.message);

      return jsonResponse(
        { error: "Invalid or expired authentication session." },
        401,
      );
    }

    const { data: tapConfig, error: tapConfigError } = await adminClient.rpc("get_tap_config");
    const tapSecretKey = tapConfig?.api_key;
    if (tapConfigError || typeof tapSecretKey !== "string" || !tapSecretKey) {
      console.error("Tap configuration unavailable.", tapConfigError?.message);
      return jsonResponse({ error: "Payment configuration unavailable." }, 503);
    }

    // ---------------------------------------------------------
    // 2. PARSE REQUEST
    // ---------------------------------------------------------

    let body: any;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        { error: "Invalid JSON request." },
        400,
      );
    }

    const packageId =
      (typeof body?.packageId === "string" && body.packageId.trim())
        ? body.packageId.trim()
        : (typeof body?.package_id === "string" && body.package_id.trim())
        ? body.package_id.trim()
        : "";

    let subscriberId =
      (typeof body?.subscriberId === "string" && body.subscriberId.trim())
        ? body.subscriberId.trim()
        : (typeof body?.subscriber_id === "string" && body.subscriber_id.trim())
        ? body.subscriber_id.trim()
        : "";

    if (!packageId) {
      return jsonResponse(
        { error: "packageId or package_id is required." },
        400,
      );
    }

    const { data: availablePackage, error: availablePackageError } = await adminClient
      .from("packages").select("id, active").eq("id", packageId).maybeSingle();
    if (availablePackageError) throw new Error(`Package lookup failed: ${availablePackageError.message}`);
    if (!availablePackage || !availablePackage.active) {
      return jsonResponse({ error: "This package is unavailable." }, 400);
    }

    // ---------------------------------------------------------
    // 3. RESOLVE OR CREATE A NON-ACTIVE SUBSCRIBER RECORD
    // ---------------------------------------------------------

    const { data: suppliedSubscriber, error: subscriberError } = await adminClient
      .from("subscribers")
      .select("id, user_id, email")
      .eq(subscriberId ? "id" : "user_id", subscriberId || user.id)
      .maybeSingle();

    if (subscriberError) {
      throw new Error(
        `Subscriber lookup failed: ${subscriberError.message}`,
      );
    }

    if (suppliedSubscriber && suppliedSubscriber.user_id !== user.id) {
      console.error(
        `SECURITY: User ${user.id} attempted payment for subscriber ${subscriberId}`,
      );

      return jsonResponse(
        { error: "Unauthorized subscriber access." },
        403,
      );
    }

    const profile = body?.profile && typeof body.profile === "object" ? body.profile : {};
    const safeText = (value: unknown, maxLength: number) =>
      typeof value === "string" ? value.trim().slice(0, maxLength) : "";
    const safeNumber = (value: unknown) => {
      if ((typeof value !== "number" && typeof value !== "string") || value === "") return null;
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    };
    let subscriber = suppliedSubscriber;
    if (!subscriber) {
      const fullName = safeText(profile.full_name, 120) || safeText(user.user_metadata?.full_name, 120) || "Triangle Member";
      const { data: createdSubscriber, error: createSubscriberError } = await adminClient
        .from("subscribers")
        .insert({
          user_id: user.id,
          full_name: fullName,
          email: user.email || safeText(profile.email, 254).toLowerCase() || null,
          phone: safeText(profile.phone, 40),
          package_id: packageId,
          package_name: "Pending payment",
          status: "paused",
        })
        .select("id, user_id, email")
        .single();
      if (createSubscriberError || !createdSubscriber) {
        throw new Error(`Subscriber setup failed: ${createSubscriberError?.message || "Unknown error"}`);
      }
      subscriber = createdSubscriber;
    }
    subscriberId = subscriber.id;

    const submittedBillingEmail = safeText(profile.email, 254).toLowerCase();
    if (!user.email && !subscriber.email && submittedBillingEmail) {
      const { data: updatedSubscriber, error: billingEmailError } = await adminClient
        .from("subscribers")
        .update({ email: submittedBillingEmail })
        .eq("id", subscriber.id)
        .eq("user_id", user.id)
        .select("id, user_id, email")
        .single();
      if (billingEmailError || !updatedSubscriber) {
        throw new Error(`Billing email could not be saved: ${billingEmailError?.message || "Unknown error"}`);
      }
      subscriber = updatedSubscriber;
    }

    // ---------------------------------------------------------
    // 4. LOAD AUTHORITATIVE PACKAGE
    // ---------------------------------------------------------
    //
    // IMPORTANT:
    // Never trust a client-provided amount.
    // The package database is the source of truth.
    //

    const {
      data: pkg,
      error: packageError,
    } = await adminClient
      .from("packages")
      .select(
        "id, name, price, currency, duration, active",
      )
      .eq("id", packageId)
      .maybeSingle();

    if (packageError) {
      throw new Error(
        `Package lookup failed: ${packageError.message}`,
      );
    }

    if (!pkg) {
      return jsonResponse(
        { error: "Package not found." },
        404,
      );
    }

    if (!pkg.active) {
      return jsonResponse(
        { error: "This package is no longer available." },
        400,
      );
    }

    const amount = Number(pkg.price);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error(
        "Invalid package price configuration.",
      );
    }

    const currency =
      String(pkg.currency || "QAR").toUpperCase();

    if (currency !== "QAR") {
      return jsonResponse({ error: "The selected package currency is not configured for Tap." }, 400);
    }

    const initialMenuSelections = Array.isArray(profile.initial_menu_selections)
      ? profile.initial_menu_selections.slice(0, 24).flatMap((choice: any) => {
        if (!choice || typeof choice !== "object") return [];
        const day = safeText(choice.day_of_week, 20);
        const meal = safeText(choice.meal_type, 20);
        const weekStart = safeText(choice.week_start_date, 10);
        const dishId = safeText(choice.dish_id, 80);
        if (!['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday'].includes(day)
          || !['breakfast','lunch','dinner','snack','snacks'].includes(meal)
          || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart) || !dishId) return [];
        return [{
          day_of_week: day,
          meal_type: meal === 'snacks' ? 'snack' : meal,
          week_start_date: weekStart,
          dish_id: dishId,
          dish_name: safeText(choice.dish_name, 160),
          dish_kcals: safeNumber(choice.dish_kcals) || 0,
          menu_period: safeText(choice.menu_period, 40),
        }];
      })
      : [];

    // ---------------------------------------------------------
    // 5. GET CUSTOMER EMAIL
    // ---------------------------------------------------------

    const customerEmail =
      user.email ||
      subscriber.email ||
      submittedBillingEmail ||
      "";

    if (!customerEmail) {
      return jsonResponse(
        {
          error:
            "A valid customer email address is required before payment.",
        },
        400,
      );
    }

    // ---------------------------------------------------------
    // 6. CREATE PAYMENT TRANSACTION
    // ---------------------------------------------------------
    //
    // The transaction is created BEFORE contacting Tap.
    // The transaction stores the authoritative package/amount.
    //

    const transactionMetadata = {
      package_id: pkg.id,
      package_name: pkg.name,
      package_duration: pkg.duration,
      subscriber_id: subscriber.id,
      user_id: user.id,
      initial_menu_selections: initialMenuSelections,
      profile: {
        full_name: safeText(profile.full_name, 120),
        phone: safeText(profile.phone, 40),
        age: safeNumber(profile.age),
        gender: ['male', 'female'].includes(profile.gender) ? profile.gender : null,
        bmi_report_path: safeText(profile.bmi_report_path, 255),
        weight_kg: safeNumber(profile.weight_kg),
        height_cm: safeNumber(profile.height_cm),
        fitness_goal: safeText(profile.fitness_goal, 80),
        building_number: safeText(profile.building_number, 80),
        street: safeText(profile.street, 160),
        area: safeText(profile.area, 120),
        zone_number: safeText(profile.zone_number, 40),
        delivery_notes: safeText(profile.delivery_notes, 500),
        latitude: safeNumber(profile.latitude),
        longitude: safeNumber(profile.longitude),
      },
    };

    const {
      data: transaction,
      error: transactionError,
    } = await adminClient
      .from("payment_transactions")
      .insert({
        subscriber_id: subscriber.id,
        amount,
        currency,
        status: "pending",
        metadata: transactionMetadata,
      })
      .select("id")
      .single();

    if (transactionError || !transaction) {
      throw new Error(
        `Payment transaction creation failed: ${
          transactionError?.message || "Unknown error"
        }`,
      );
    }

    // ---------------------------------------------------------
    // 7. BUILD TAP REQUEST
    // ---------------------------------------------------------
    //
    // Redirect URL is server-controlled.
    // Do not allow the client to redirect Tap to an arbitrary URL.
    //

    const origin =
      Deno.env.get("PUBLIC_APP_URL") ||
      "https://trianglehealthy-kitchen.vercel.app";

    const redirectUrl =
      `${origin}/payment/callback`;

    const tapPayload = {
      amount,
      currency,
      customer: {
        email: customerEmail,
      },
      source: {
        id: "src_all",
      },
      redirect: {
        url: redirectUrl,
      },
      post: {
        url: `${SUPABASE_URL}/functions/v1/tap-webhook`,
      },
      metadata: {
        subscriber_id: subscriber.id,
        transaction_id: transaction.id,
        package_id: pkg.id,
        user_id: user.id,
      },
      reference: {
        transaction: transaction.id,
      },
      description:
        `${pkg.name} - ${pkg.duration}`,
    };

    // ---------------------------------------------------------
    // 8. CREATE TAP CHARGE
    // ---------------------------------------------------------

    const tapResponse = await fetch(
      "https://api.tap.company/v2/charges/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tapSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tapPayload),
      },
    );

    const tapText = await tapResponse.text();

    let tapResult: any;

    try {
      tapResult = JSON.parse(tapText);
    } catch {
      tapResult = null;
    }

    if (!tapResponse.ok) {
      console.error(
        "Tap charge creation failed:",
        tapText,
      );

      await adminClient
        .from("payment_transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id);

      return jsonResponse(
        {
          error:
            "Payment provider rejected the payment request.",
        },
        502,
      );
    }

    const chargeId = tapResult?.id;

    if (!chargeId) {
      console.error(
        "Tap response did not contain a charge ID:",
        tapText,
      );

      await adminClient
        .from("payment_transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id);

      return jsonResponse(
        {
          error:
            "Payment provider returned an invalid response.",
        },
        502,
      );
    }

    // ---------------------------------------------------------
    // 9. STORE TAP CHARGE ID
    // ---------------------------------------------------------

    const {
      error: transactionUpdateError,
    } = await adminClient
      .from("payment_transactions")
      .update({
        tap_charge_id: chargeId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    if (transactionUpdateError) {
      console.error(
        "Failed to store Tap charge ID:",
        transactionUpdateError.message,
      );

      // The Tap charge exists, but our local record could not
      // be linked to it. Do NOT pretend the payment succeeded.
      return jsonResponse(
        {
          error:
            "Payment was created but could not be linked safely. Please contact support.",
        },
        500,
      );
    }

    // ---------------------------------------------------------
    // 10. AUDIT LOG
    // ---------------------------------------------------------

    await adminClient
      .from("payment_logs")
      .insert({
        tap_charge_id: chargeId,
        event_type: "charge_created",
        payload: {
          transaction_id: transaction.id,
          subscriber_id: subscriber.id,
          package_id: pkg.id,
          amount,
          currency,
        },
      });

    // ---------------------------------------------------------
    // 11. RETURN CHECKOUT URL
    // ---------------------------------------------------------

    const checkoutUrl =
      tapResult?.transaction?.url ||
      tapResult?.redirect?.url ||
      tapResult?.url;

    if (!checkoutUrl) {
      console.error(
        "Tap charge created but no checkout URL was returned:",
        tapText,
      );

      return jsonResponse(
        {
          error:
            "Payment provider did not return a checkout URL.",
        },
        502,
      );
    }

    return jsonResponse(
      {
        success: true,
        transaction_id: transaction.id,
        charge_id: chargeId,
        checkout_url: checkoutUrl,
        url: checkoutUrl,
        amount,
        currency,
        package_id: pkg.id,
      },
      200,
    );

  } catch (err: any) {
    console.error(
      "TAP CHECKOUT ERROR:",
      err?.message || err,
    );

    return jsonResponse(
      {
        error:
          err?.message ||
          "Unable to create payment.",
      },
      500,
    );
  }
});

// ---------------------------------------------------------
// RESPONSE HELPER
// ---------------------------------------------------------

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
}
