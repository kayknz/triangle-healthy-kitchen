import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PROVIDER_EMAIL = Deno.env.get("PROVIDER_EMAIL") || "kevmulgeo@gmail.com";
const SENDER_NAME = "Triangle Healthy Kitchen";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface BrevoConfig {
  api_key: string;
  sender_email: string;
}

async function getBrevoConfig(): Promise<BrevoConfig> {
  const api_key = Deno.env.get("BREVO_API_KEY") || "";
  const sender_email = Deno.env.get("SENDER_EMAIL") || PROVIDER_EMAIL;
  return { api_key, sender_email };
}

interface BookingPayload {
  type?: 'booking' | 'cancellation';
  package_id: string;
  package_name: string;
  weight_kg?: string | number;
  height_cm?: string | number;
  fitness_goal?: string;
  exercise_routine?: string;
  wants_exercise_plan?: boolean;
  dietary_restrictions?: string;
  health_notes?: string;
  appointment_date: string;
  appointment_time: string;
  client_name: string;
  client_email: string;
  client_phone: string;
}

function fmtDate(iso: string): string {
  try {
    if (!iso) return "TBD";
    const date = new Date(iso + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return iso || "TBD";
  }
}

async function sendBrevoEmail(
  to: string,
  toName: string,
  subject: string,
  html: string,
  replyTo?: string,
): Promise<{ ok: boolean; error?: string }> {
  const config = await getBrevoConfig();
  if (!config.api_key) return { ok: false, error: "API Key Missing" };

  try {
    const body: any = {
      sender: { name: SENDER_NAME, email: config.sender_email },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    };
    if (replyTo) body.replyTo = { email: replyTo };

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": config.api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    return { ok: res.ok, error: res.ok ? undefined : await res.text() };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

function buildBookingHtml(b: BookingPayload, fmttedDate: string): string {
  const rows = [
    ["Package", b.package_name],
    ["Client Name", b.client_name],
    ["Client Email", b.client_email],
    ["Client Phone", b.client_phone],
    ["Appointment Date", fmttedDate],
    ["Appointment Time", b.appointment_time],
    ["Weight", b.weight_kg ? `${b.weight_kg} kg` : "—"],
    ["Height", b.height_cm ? `${b.height_cm} cm` : "—"],
    ["Fitness Goal", b.fitness_goal || "—"],
    ["Exercise Routine", b.exercise_routine || "—"],
    ["Dietary Restrictions", b.dietary_restrictions || "—"],
    ["Health Notes", b.health_notes || "—"],
  ];

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px;">
      <div style="background: #0a3030; border-radius: 12px; padding: 24px 32px; margin-bottom: 24px;">
        <h1 style="color: #D4A843; margin: 0; font-size: 22px; letter-spacing: 1px;">Triangle Healthy Kitchen</h1>
        <p style="color: #fff; margin: 4px 0 0; font-size: 14px; opacity: 0.7;">New Lead Protocol Registered</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden;">
        ${rows.map((r) => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 16px; font-weight: bold; color: #0a3030; width: 40%; font-size: 14px;">${r[0]}</td>
            <td style="padding: 12px 16px; color: #333; font-size: 14px;">${r[1] || "—"}</td>
          </tr>
        `).join("")}
      </table>
    </div>
  `;
}

function buildClientHtml(b: BookingPayload, fmttedDate: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px;">
      <div style="background: #0a3030; border-radius: 12px; padding: 24px 32px; margin-bottom: 24px;">
        <h1 style="color: #D4A843; margin: 0; font-size: 22px; letter-spacing: 1px;">Triangle Healthy Kitchen</h1>
        <p style="color: #fff; margin: 4px 0 0; font-size: 14px; opacity: 0.7;">Booking Confirmation</p>
      </div>
      <div style="background: #fff; border-radius: 8px; padding: 24px 32px;">
        <p style="color: #333; font-size: 15px; line-height: 1.6;">Hi ${b.client_name},</p>
        <p style="color: #333; font-size: 15px; line-height: 1.6;">
          Thank you for booking your consultation with Triangle Healthy Kitchen. Your biological data has been securely transmitted to our specialist dietitian.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #0a3030; font-size: 14px;">Package</td><td style="padding: 8px 0; color: #333; font-size: 14px;">${b.package_name}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #0a3030; font-size: 14px;">Date</td><td style="padding: 8px 0; color: #333; font-size: 14px;">${fmttedDate}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #0a3030; font-size: 14px;">Time</td><td style="padding: 8px 0; color: #333; font-size: 14px;">${b.appointment_time}</td></tr>
        </table>
        <p style="color: #333; font-size: 15px; line-height: 1.6;">
          Our team will be in touch shortly to confirm your session.
        </p>
      </div>
      <p style="color: #888; font-size: 12px; margin-top: 24px; text-align: center;">
        Triangle Healthy Kitchen — Doha, Qatar — Est. 2017
      </p>
    </div>
  `;
}

async function logNotification(bookingId: string | null, recipient: string, role: string, subject: string, status: string, error?: string) {
  try {
    await supabase.from("notifications").insert({
      booking_id: bookingId, recipient, recipient_role: role, subject,
      status, provider: "brevo", error: error || null,
    });
  } catch (e) {
    console.error("Log error:", e);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload: BookingPayload = await req.json();
    const fmttedDate = fmtDate(payload.appointment_date);

    if (payload.type === 'cancellation') {
      const subject = `Cancellation: Your Appointment with Triangle`;
      const html = `<div style="font-family:sans-serif;padding:32px;background:#f9f9f9;">
        <h2 style="color:#0a3030;">Appointment Cancelled</h2>
        <p>Hi ${payload.client_name}, your consultation for ${payload.package_name} on ${fmttedDate} at ${payload.appointment_time} has been cancelled.</p>
      </div>`;

      const res = await sendBrevoEmail(payload.client_email, payload.client_name, subject, html);
      await logNotification(null, payload.client_email, "client", subject, res.ok ? "sent" : "failed", res.error);

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 1. Availability Check
    const { data: existing } = await supabase
      .from("bookings")
      .select("id")
      .eq("appointment_date", payload.appointment_date)
      .eq("appointment_time", payload.appointment_time)
      .neq("status", "cancelled")
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Slot already booked." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Create Booking
    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        package_id: payload.package_id || 'undecided',
        package_name: payload.package_name || 'Expert Recommendation',
        weight_kg: Number(payload.weight_kg) || null,
        height_cm: Number(payload.height_cm) || null,
        fitness_goal: payload.fitness_goal,
        exercise_routine: payload.exercise_routine,
        dietary_restrictions: payload.dietary_restrictions,
        health_notes: payload.health_notes,
        appointment_date: payload.appointment_date,
        appointment_time: payload.appointment_time,
        client_name: payload.client_name,
        client_email: payload.client_email,
        client_phone: payload.client_phone,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) throw new Error(`DB Error: ${insertError.message}`);

    // 3. Notifications (Fire and Forget)
    const emailProcess = (async () => {
      const pSubject = `New Lead: ${payload.client_name} — ${payload.package_name}`;
      const pHTml = buildBookingHtml(payload, fmttedDate);
      const cSubject = `Protocol Confirmed — Triangle Healthy Kitchen`;
      const cHtml = buildClientHtml(payload, fmttedDate);

      const [pRes, cRes] = await Promise.all([
        sendBrevoEmail(PROVIDER_EMAIL, "Chef", pSubject, pHTml),
        sendBrevoEmail(payload.client_email, payload.client_name, cSubject, cHtml)
      ]);
      await Promise.all([
        logNotification(booking.id, PROVIDER_EMAIL, "provider", pSubject, pRes.ok ? "sent" : "failed", pRes.error),
        logNotification(booking.id, payload.client_email, "client", cSubject, cRes.ok ? "sent" : "failed", cRes.error)
      ]);
    })();

    // Non-blocking wait
    // @ts-ignore
    if (typeof EdgeRuntime !== 'undefined') {
       // @ts-ignore
      EdgeRuntime.waitUntil(emailProcess);
    }

    return new Response(JSON.stringify({ success: true, booking_id: booking.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
