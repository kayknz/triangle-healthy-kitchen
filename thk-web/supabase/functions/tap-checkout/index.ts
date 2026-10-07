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

    const paymentMethod = body?.payment_method === 'cash' ? 'cash' : 'tap';

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
      .from("packages").select("id, active, duration, meal_periods").eq("id", packageId).maybeSingle();
    if (availablePackageError) throw new Error(`Package lookup failed: ${availablePackageError.message}`);
    if (!availablePackage || !availablePackage.active) {
      return jsonResponse({ error: "This package is unavailable." }, 400);
    }
    const fridayDeliveryRequested = body?.profile?.friday_delivery_addon === true;
    const requestedSelections = body?.profile?.initial_menu_selections;
    if (!Array.isArray(requestedSelections) || requestedSelections.length === 0 || requestedSelections.length > 35) {
      return jsonResponse({ error: "Choose meals from the published menu before requesting payment." }, 400);
    }
    const allowedPeriods: string[] = Array.isArray(availablePackage.meal_periods) ? availablePackage.meal_periods : ['breakfast','lunch','dinner','snacks'];
    const durationLabel = String(availablePackage.duration || '').toLowerCase();
    const isMonthlyPackage = durationLabel.includes('4 week') || durationLabel.includes('24 service');
    const requiredServiceDays = durationLabel.includes('1 day') ? 1 : durationLabel.includes('1 week') || durationLabel.includes('6 day') || durationLabel.includes('4 week') || durationLabel.includes('24 service') ? 6 : 0;
    if (!requiredServiceDays || (fridayDeliveryRequested && !isMonthlyPackage) || allowedPeriods.length * (requiredServiceDays + (fridayDeliveryRequested ? 1 : 0)) > 35) {
      return jsonResponse({ error: "This package needs a valid service duration and meal limit before checkout." }, 400);
    }
    const todayInQatar = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Qatar', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const serviceStart = new Date(`${todayInQatar}T12:00:00Z`);
    serviceStart.setUTCDate(serviceStart.getUTCDate() + ((6 - serviceStart.getUTCDay() + 7) % 7 || 7));
    const expectedWeek = serviceStart.toISOString().slice(0, 10);
    const { data: preparedMenu, error: fallbackError } = await adminClient.rpc('ensure_service_week_menu', { p_week_start: expectedWeek });
    if (fallbackError) throw new Error(`Previous menu fallback failed: ${fallbackError.message}`);
    const menuCollection = preparedMenu?.collection;
    if (!menuCollection || !preparedMenu?.ready) throw new Error('No published menu is available for the selected service week.');
    const releaseStart = new Date(`${expectedWeek}T00:00:00+03:00`).toISOString();
    const nextWeekDate = new Date(`${expectedWeek}T12:00:00Z`);
    nextWeekDate.setUTCDate(nextWeekDate.getUTCDate() + 1);
    const releaseEnd = new Date(`${nextWeekDate.toISOString().slice(0, 10)}T00:00:00+03:00`).toISOString();
    const { data: menuRows, error: menuError } = await adminClient.from('menu_availability')
      .select('dish_id,day_of_week,meal_period,collection,available_from')
      .eq('is_active', true).eq('collection', menuCollection)
      .gte('available_from', releaseStart).lt('available_from', releaseEnd)
      .order('available_from', { ascending: false }).limit(1000);
    if (menuError) throw new Error(`Published menu lookup failed: ${menuError.message}`);
    const releasedChoices = new Set((menuRows || [])
      .map((row: any) => `${row.day_of_week}|${row.meal_period}|${row.dish_id}`));
    const selectedSlots = new Set<string>();
    const selectedDays = new Set<string>();
    const snackChoices = new Map<string, string>();
    let selectedWeek = '';
    for (const choice of requestedSelections) {
      const day = typeof choice?.day_of_week === 'string' ? choice.day_of_week : '';
      const mealType = choice?.meal_type;
      const meal = mealType === 'snack' || mealType === 'snack_2' ? 'snacks' : mealType;
      const week = typeof choice?.week_start_date === 'string' ? choice.week_start_date : '';
      const validMenuDays = fridayDeliveryRequested ? ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'] : ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday'];
      if (!validMenuDays.includes(day)
        || !['breakfast','lunch','dinner','snack','snacks','snack_2'].includes(mealType)
        || !(allowedPeriods.includes(meal) || (mealType === 'snack_2' && allowedPeriods.includes('snacks_2'))) || typeof choice?.dish_id !== 'string' || !choice.dish_id
        || week !== expectedWeek || (selectedWeek && selectedWeek !== week)) {
        return jsonResponse({ error: "A selected meal does not match this package or the published weekly menu." }, 400);
      }
      selectedWeek = week;
      if (!releasedChoices.has(`${day}|${meal}|${choice.dish_id}`)) {
        return jsonResponse({ error: "One of your selected dishes is not in the currently published menu." }, 400);
      }
      const key = `${week}|${day}|${mealType}`;
      if (selectedSlots.has(key)) return jsonResponse({ error: "Choose only one dish for each meal period." }, 400);
      selectedSlots.add(key);
      if (mealType === 'snack' || mealType === 'snacks' || mealType === 'snack_2') {
        const snackKey = `${week}|${day}`;
        const priorSnack = snackChoices.get(snackKey);
        if (priorSnack === choice.dish_id) return jsonResponse({ error: 'Choose two different dishes for the two snack periods.' }, 400);
        snackChoices.set(snackKey, choice.dish_id);
      }
      selectedDays.add(`${week}|${day}`);
    }
    const requiredMenuDays = requiredServiceDays + (fridayDeliveryRequested ? 1 : 0);
    if (selectedDays.size !== requiredMenuDays || selectedSlots.size !== requiredMenuDays * allowedPeriods.length) {
      return jsonResponse({ error: "Choose every meal included in the selected plan for its service days." }, 400);
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
    const initialMenuSelections = Array.isArray(profile.initial_menu_selections)
      ? profile.initial_menu_selections.slice(0, 35).flatMap((choice: any) => {
          if (!choice || typeof choice !== 'object') return [];
          const day = safeText(choice.day_of_week, 20);
          const meal = safeText(choice.meal_type, 20);
          const dishId = safeText(choice.dish_id, 80);
          const dishName = safeText(choice.dish_name, 160);
          const weekStart = safeText(choice.week_start_date, 10);
          if (!(fridayDeliveryRequested ? ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'] : ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday']).includes(day) || !['breakfast','lunch','dinner','snack','snack_2'].includes(meal) || !dishId || !dishName || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) return [];
          return [{ day_of_week: day, meal_type: meal, dish_id: dishId, dish_name: dishName, dish_kcals: safeNumber(choice.dish_kcals), menu_period: safeText(choice.menu_period, 30) || 'autumn', week_start_date: weekStart }];
        })
      : [];
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

    // A customer with an unresolved payment request must not open another
    // checkout. This check gives a useful response; a database unique index
    // below also closes the race between simultaneous requests.
    const { data: openPayment, error: openPaymentError } = await adminClient
      .from('payment_transactions')
      .select('id, payment_provider, status')
      .eq('subscriber_id', subscriber.id)
      .in('status', ['pending', 'initiated'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (openPaymentError) throw new Error(`Pending payment lookup failed: ${openPaymentError.message}`);
    if (openPayment) {
      return jsonResponse({
        pending_approval: true,
        transaction_id: openPayment.id,
        message: 'You already have a payment or activation request awaiting review. Please wait for account approval instead of starting another checkout.',
      }, 409);
    }

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

    const amount = Number(pkg.price) + (fridayDeliveryRequested ? 199 : 0);

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
        friday_delivery_addon: fridayDeliveryRequested,
        phone: safeText(profile.phone, 40),
        age: safeNumber(profile.age),
        gender: ['male', 'female'].includes(profile.gender) ? profile.gender : null,
        bmi_report_path: safeText(profile.bmi_report_path, 255),
        weight_kg: safeNumber(profile.weight_kg),
        height_cm: safeNumber(profile.height_cm),
        fitness_goal: safeText(profile.fitness_goal, 80),
        allergies: Array.isArray(profile.allergies) ? profile.allergies.slice(0, 30).map((value: unknown) => safeText(value, 80)).filter(Boolean) : [],
        dislikes: Array.isArray(profile.dislikes) ? profile.dislikes.slice(0, 30).map((value: unknown) => safeText(value, 120)).filter(Boolean) : [],
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
        payment_provider: paymentMethod,
        metadata: transactionMetadata,
      })
      .select("id")
      .single();

    if (transactionError || !transaction) {
      if (transactionError?.code === '23505') {
        return jsonResponse({ pending_approval: true, message: 'A payment or activation request is already awaiting review. Please wait for account approval instead of starting another checkout.' }, 409);
      }
      throw new Error(
        `Payment transaction creation failed: ${
          transactionError?.message || "Unknown error"
        }`,
      );
    }

    if (paymentMethod === 'cash') {
      await adminClient.from('payment_logs').insert({
        tap_charge_id: null,
        event_type: 'cash_collection_requested',
        payload: { transaction_id: transaction.id, subscriber_id: subscriber.id, amount, currency, package_id: pkg.id },
        severity: 'info',
      });
      return jsonResponse({ cash_pending: true, transaction_id: transaction.id, message: 'We will reach out to activate your account after cash is collected and verified.' }, 200);
    }

    const { data: tapConfig, error: tapConfigError } = await adminClient.rpc("get_tap_config");
    const tapSecretKey = tapConfig?.api_key;
    if (tapConfigError || typeof tapSecretKey !== "string" || !tapSecretKey) {
      await adminClient.from('payment_transactions').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', transaction.id);
      console.error("Tap configuration unavailable.", tapConfigError?.message);
      return jsonResponse({ error: "Payment configuration unavailable." }, 503);
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
      "https://trianglehealthykitchen.vercel.app";

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
