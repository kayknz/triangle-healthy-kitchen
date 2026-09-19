import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, hashstring",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const TAP_WEBHOOK_SECRET = Deno.env.get("TAP_WEBHOOK_SECRET");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Supabase configuration missing.");
}

const supabase = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
);

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Convert a hexadecimal signature into bytes.
 */
function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.trim();

  if (
    !normalized ||
    !/^[0-9a-fA-F]+$/.test(normalized) ||
    normalized.length % 2 !== 0
  ) {
    throw new Error("Invalid webhook signature format.");
  }

  const bytes = new Uint8Array(normalized.length / 2);

  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(
      normalized.slice(i, i + 2),
      16,
    );
  }

  return bytes;
}

/**
 * Constant-time byte comparison.
 */
function constantTimeEqual(
  a: Uint8Array,
  b: Uint8Array,
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let difference = 0;

  for (let i = 0; i < a.length; i++) {
    difference |= a[i] ^ b[i];
  }

  return difference === 0;
}

/**
 * Tap expects the amount formatted to exactly two decimal places
 * when constructing the webhook hashstring.
 */
function formatTapAmount(amount: unknown): string {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    throw new Error("Invalid payment amount.");
  }

  return numericAmount.toFixed(2);
}

/**
 * Build Tap's documented webhook hashstring.
 *
 * x_id{id}
 * x_amount{amount}
 * x_currency{currency}
 * x_gateway_reference{gateway_reference}
 * x_payment_reference{payment_reference}
 * x_status{status}
 * x_created{created}
 */
function buildTapHashString(event: any): string {
  const reference = event.reference || {};
  const transaction = event.transaction || {};

  const id = event.id ?? "";
  const amount = formatTapAmount(event.amount);
  const currency = event.currency ?? "";
  const gatewayReference = reference.gateway ?? "";
  const paymentReference = reference.payment ?? "";
  const status = event.status ?? "";
  const created = transaction.created ?? "";

  if (!id || !currency || !status || !created) {
    throw new Error(
      "Webhook missing required hashstring fields.",
    );
  }

  return (
    `x_id${id}` +
    `x_amount${amount}` +
    `x_currency${currency}` +
    `x_gateway_reference${gatewayReference}` +
    `x_payment_reference${paymentReference}` +
    `x_status${status}` +
    `x_created${created}`
  );
}

/**
 * Verify Tap's HMAC-SHA256 hashstring.
 */
async function verifyTapWebhook(
  event: any,
  providedHash: string,
): Promise<boolean> {
  if (!TAP_WEBHOOK_SECRET) {
    console.error(
      "CRITICAL: TAP_WEBHOOK_SECRET is not configured.",
    );

    return false;
  }

  if (!providedHash) {
    return false;
  }

  let receivedSignature: Uint8Array;

  try {
    receivedSignature = hexToBytes(providedHash);
  } catch {
    return false;
  }

  const hashString = buildTapHashString(event);
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(TAP_WEBHOOK_SECRET),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["verify"],
  );

  return await crypto.subtle.verify(
    "HMAC",
    key,
    receivedSignature,
    encoder.encode(hashString),
  );
}

// ---------------------------------------------------------
// WEBHOOK
// ---------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        error: "Method Not Allowed",
      },
      405,
    );
  }

  try {
    // -------------------------------------------------------
    // 1. FAIL CLOSED IF WEBHOOK SECRET IS MISSING
    // -------------------------------------------------------

    if (!TAP_WEBHOOK_SECRET) {
      console.error(
        "CRITICAL: TAP_WEBHOOK_SECRET missing.",
      );

      return jsonResponse(
        {
          error: "Webhook configuration unavailable.",
        },
        500,
      );
    }

    // -------------------------------------------------------
    // 2. READ RAW WEBHOOK BODY
    // -------------------------------------------------------

    const rawBody = await req.text();

    if (!rawBody) {
      return jsonResponse(
        {
          error: "Empty webhook body.",
        },
        400,
      );
    }

    let event: any;

    try {
      event = JSON.parse(rawBody);
    } catch {
      return jsonResponse(
        {
          error: "Invalid webhook JSON.",
        },
        400,
      );
    }

    // -------------------------------------------------------
    // 3. VERIFY TAP HMAC BEFORE PROCESSING ANY PAYMENT
    // -------------------------------------------------------

    const tapHash =
      req.headers.get("hashstring") ||
      req.headers.get("Hashstring") ||
      req.headers.get("x-tap-hash");

    if (!tapHash) {
      console.error(
        "Security rejection: missing Tap hashstring.",
      );

      return jsonResponse(
        {
          error: "Invalid webhook signature.",
        },
        401,
      );
    }

    const signatureValid = await verifyTapWebhook(
      event,
      tapHash,
    );

    if (!signatureValid) {
      console.error(
        "Security rejection: invalid Tap hashstring.",
      );

      return jsonResponse(
        {
          error: "Invalid webhook signature.",
        },
        401,
      );
    }

    // -------------------------------------------------------
    // 4. BASIC EVENT VALIDATION
    // -------------------------------------------------------

    const status = String(event.status || "").toUpperCase();
    const chargeId = event.id;

    if (!chargeId) {
      throw new Error(
        "VALIDATION_FAIL: Missing Tap charge ID.",
      );
    }

    if (!status) {
      throw new Error(
        "VALIDATION_FAIL: Missing Tap payment status.",
      );
    }

    const metadata = event.metadata || {};

    const webhookSubscriberId =
      metadata.subscriber_id ||
      metadata.udf1 ||
      event.udf1;

    // -------------------------------------------------------
    // 5. AUDIT LOG
    // -------------------------------------------------------

    await supabase
      .from("payment_logs")
      .insert({
        tap_charge_id: chargeId,
        event_type: "webhook_received",
        payload: event,
      });

    // -------------------------------------------------------
    // 6. FIND OUR EXACT PAYMENT TRANSACTION
    // -------------------------------------------------------

    const {
      data: tx,
      error: txError,
    } = await supabase
      .from("payment_transactions")
      .select(
        "id, subscriber_id, amount, currency, status, tap_charge_id",
      )
      .eq("tap_charge_id", chargeId)
      .maybeSingle();

    if (txError) {
      throw new Error(
        `DATABASE_ERROR: Payment transaction lookup failed: ${txError.message}`,
      );
    }

    /**
     * A genuine Tap webhook that does not correspond to a
     * transaction created by our system must never activate
     * anything.
     */
    if (!tx) {
      console.warn(
        `Unrecognized Tap transaction: ${chargeId}`,
      );

      await supabase
        .from("payment_logs")
        .insert({
          tap_charge_id: chargeId,
          event_type: "unrecognized_transaction",
          severity: "warning",
          payload: event,
        });

      return jsonResponse(
        {
          received: true,
          note: "unrecognized",
        },
        200,
      );
    }

    // -------------------------------------------------------
    // 7. VERIFY SUBSCRIBER IDENTITY
    // -------------------------------------------------------

    if (
      webhookSubscriberId &&
      webhookSubscriberId !== tx.subscriber_id
    ) {
      const message =
        `Subscriber mismatch for ${chargeId}. ` +
        `Expected ${tx.subscriber_id}, ` +
        `received ${webhookSubscriberId}.`;

      console.error(
        `CRITICAL: ${message}`,
      );

      await supabase
        .from("payment_logs")
        .insert({
          tap_charge_id: chargeId,
          event_type: "subscriber_mismatch",
          severity: "critical",
          payload: {
            expected_subscriber_id:
              tx.subscriber_id,
            received_subscriber_id:
              webhookSubscriberId,
          },
        });

      return jsonResponse(
        {
          error: "Subscriber mismatch.",
        },
        400,
      );
    }

    // Require subscriber identity to be present.
    if (!webhookSubscriberId) {
      console.error(
        `CRITICAL: Missing subscriber identity for ${chargeId}.`,
      );

      await supabase
        .from("payment_logs")
        .insert({
          tap_charge_id: chargeId,
          event_type: "missing_subscriber_identity",
          severity: "critical",
          payload: event,
        });

      return jsonResponse(
        {
          error: "Missing subscriber identity.",
        },
        400,
      );
    }

    // -------------------------------------------------------
    // 8. VERIFY CURRENCY
    // -------------------------------------------------------

    const receivedCurrency =
      String(event.currency || "").toUpperCase();

    const expectedCurrency =
      String(tx.currency || "").toUpperCase();

    if (
      !receivedCurrency ||
      receivedCurrency !== expectedCurrency
    ) {
      const message =
        `Currency mismatch for ${chargeId}. ` +
        `Expected ${expectedCurrency}, ` +
        `received ${receivedCurrency}.`;

      console.error(
        `CRITICAL: ${message}`,
      );

      await supabase
        .from("payment_logs")
        .insert({
          tap_charge_id: chargeId,
          event_type: "currency_mismatch",
          severity: "critical",
          payload: {
            expected: expectedCurrency,
            received: receivedCurrency,
          },
        });

      return jsonResponse(
        {
          error: "Currency mismatch.",
        },
        400,
      );
    }

    // -------------------------------------------------------
    // 9. VERIFY AMOUNT
    // -------------------------------------------------------

    const receivedAmount = Number(event.amount);
    const expectedAmount = Number(tx.amount);

    if (
      !Number.isFinite(receivedAmount) ||
      !Number.isFinite(expectedAmount) ||
      Math.abs(
        receivedAmount - expectedAmount,
      ) > 0.01
    ) {
      const message =
        `Amount mismatch for ${chargeId}. ` +
        `Expected ${expectedAmount}, ` +
        `received ${receivedAmount}.`;

      console.error(
        `CRITICAL: ${message}`,
      );

      await supabase
        .from("payment_logs")
        .insert({
          tap_charge_id: chargeId,
          event_type: "amount_mismatch",
          severity: "critical",
          payload: {
            expected: expectedAmount,
            received: receivedAmount,
          },
        });

      return jsonResponse(
        {
          error: "Amount mismatch.",
        },
        400,
      );
    }

    // -------------------------------------------------------
    // 10. IDEMPOTENCY
    // -------------------------------------------------------

    /**
     * If the payment has already been captured, Tap may simply
     * retry the webhook. Returning 200 prevents unnecessary
     * retries without applying the payment again.
     */
    if (tx.status === "captured") {
      console.log(
        `Duplicate webhook ignored: ${chargeId}`,
      );

      return jsonResponse(
        {
          received: true,
          note: "duplicate",
        },
        200,
      );
    }

    // -------------------------------------------------------
    // 11. CAPTURED PAYMENT
    // -------------------------------------------------------

    if (status === "CAPTURED") {
      /**
       * IMPORTANT:
       *
       * Subscription activation is NOT performed here.
       *
       * The PostgreSQL RPC is the authoritative transaction
       * boundary. It:
       *
       * - locks the payment transaction
       * - verifies package identity
       * - verifies package price
       * - verifies currency
       * - determines service duration
       * - excludes Fridays
       * - handles early renewal
       * - activates the subscriber
       * - marks the payment captured
       * - awards points idempotently
       *
       * This prevents concurrent Tap webhook deliveries from
       * producing duplicate subscription activation.
       */

      const {
        data: result,
        error: rpcError,
      } = await supabase.rpc(
        "process_tap_captured_payment",
        {
          p_tap_charge_id: chargeId,
          p_received_amount: receivedAmount,
          p_received_currency: receivedCurrency,
        },
      );

      if (rpcError) {
        throw new Error(
          `DATABASE_ERROR: Payment processing RPC failed: ${rpcError.message}`,
        );
      }

      if (!result?.success) {
        throw new Error(
          `VALIDATION_FAIL: ${
            result?.error ||
            "Payment processing protocol rejected the transaction."
          }`,
        );
      }

      console.log(
        `Payment activation successful for ${chargeId}`,
        result,
      );

      return jsonResponse(
        {
          received: true,
          note: result.note || "captured",
        },
        200,
      );
    }

    // -------------------------------------------------------
    // 12. FAILED / CANCELLED / VOIDED
    // -------------------------------------------------------

    if (
      status === "FAILED" ||
      status === "CANCELLED" ||
      status === "VOIDED"
    ) {
      const newPaymentStatus =
        status.toLowerCase();

      const {
        error: paymentError,
      } = await supabase
        .from("payment_transactions")
        .update({
          status: newPaymentStatus,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", tx.id)
        .eq("tap_charge_id", chargeId);

      if (paymentError) {
        throw new Error(
          `DATABASE_ERROR: Payment status update failed: ${paymentError.message}`,
        );
      }

      /**
       * IMPORTANT:
       *
       * A failed/cancelled/voided payment must NOT automatically
       * deactivate an already-active subscription.
       *
       * The failed payment could be an older or separate charge.
       */

      console.log(
        `Transaction ${chargeId} marked as ${status}. ` +
        `Existing subscriber entitlement preserved.`,
      );

      return jsonResponse(
        {
          received: true,
          note: newPaymentStatus,
        },
        200,
      );
    }

    // -------------------------------------------------------
    // 13. OTHER TAP STATUSES
    // -------------------------------------------------------

    /**
     * Tap can send statuses that do not require an entitlement
     * change. Acknowledge them without modifying subscription
     * state.
     */

    console.log(
      `Tap webhook received for ${chargeId} with status ${status}.`,
    );

    return jsonResponse(
      {
        received: true,
        note: "status_received",
      },
      200,
    );

  } catch (err: any) {
    console.error(
      "TAP WEBHOOK ERROR:",
      err?.message || err,
    );

    const message =
      err?.message ||
      "Webhook processing failed.";

    const isValidation =
      message.includes("AUTH_FAIL") ||
      message.includes("VALIDATION_FAIL");

    return jsonResponse(
      {
        error: message,
      },
      isValidation ? 400 : 500,
    );
  }
});