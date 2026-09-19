import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
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
  const { data, error } = await supabase.rpc("get_brevo_config");
  if (error || !data) {
    return { api_key: "", sender_email: PROVIDER_EMAIL };
  }
  return {
    api_key: data.api_key || "",
    sender_email: data.sender_email || PROVIDER_EMAIL,
  };
}

function fmtDateTime(dateStr: string, timeStr: string): string {
  try {
    return new Date(`${dateStr}T${timeStr}:00`).toLocaleString("en", {
      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return `${dateStr} ${timeStr}`;
  }
}

function getAppointmentTimestamp(dateStr: string, timeStr: string): number {
  return new Date(`${dateStr}T${timeStr}:00`).getTime();
}

async function sendBrevoEmail(
  to: string,
  toName: string,
  subject: string,
  html: string,
): Promise<{ ok: boolean; error?: string }> {
  const config = await getBrevoConfig();
  if (!config.api_key) {
    return { ok: false, error: "BREVO_API_KEY not set in vault" };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": config.api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: config.sender_email },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `Brevo API error ${res.status}: ${await res.text()}` };
    }

    const data = await res.json();
    if (!data.messageId) {
      return { ok: false, error: data.message || "Brevo submission failed" };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

function buildProviderReminderHtml(clientName: string, packageName: string, when: string, phone: string, email: string, reminderType: string, goal?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px;">
      <div style="background: #0a3030; border-radius: 12px; padding: 24px 32px; margin-bottom: 24px;">
        <h1 style="color: #D4A843; margin: 0; font-size: 22px; letter-spacing: 1px;">Triangle Healthy Kitchen</h1>
        <p style="color: #fff; margin: 4px 0 0; font-size: 14px; opacity: 0.7;">Appointment Reminder — ${reminderType}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden;">
        <tr><td style="padding: 12px 16px; font-weight: bold; color: #0a3030; width: 40%; font-size: 14px;">Client</td><td style="padding: 12px 16px; color: #333; font-size: 14px;">${clientName}</td></tr>
        <tr><td style="padding: 12px 16px; font-weight: bold; color: #0a3030; font-size: 14px; border-top: 1px solid #eee;">Plan</td><td style="padding: 12px 16px; color: #333; font-size: 14px; border-top: 1px solid #eee;">${packageName}</td></tr>
        <tr><td style="padding: 12px 16px; font-weight: bold; color: #0a3030; font-size: 14px; border-top: 1px solid #eee;">Appointment</td><td style="padding: 12px 16px; color: #333; font-size: 14px; border-top: 1px solid #eee;">${when}</td></tr>
        <tr><td style="padding: 12px 16px; font-weight: bold; color: #0a3030; font-size: 14px; border-top: 1px solid #eee;">Phone</td><td style="padding: 12px 16px; color: #333; font-size: 14px; border-top: 1px solid #eee;">${phone}</td></tr>
        <tr><td style="padding:12px 16px;font-weight:bold;color:#0a3030;font-size:14px;border-top:1px solid #eee;">Email</td><td style="padding:12px 16px;color:#333;font-size:14px;border-top:1px solid #eee;">${email}</td></tr>
        ${goal ? `<tr><td style="padding:12px 16px;font-weight:bold;color:#0a3030;font-size:14px;border-top:1px solid #eee;">Goal</td><td style="padding:12px 16px;color:#333;font-size:14px;border-top:1px solid #eee;">${goal}</td></tr>` : ""}
      </table>
    </div>
  `;
}

function buildClientReminderHtml(clientName: string, packageName: string, when: string, reminderType: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px;">
      <div style="background: #0a3030; border-radius: 12px; padding: 24px 32px; margin-bottom: 24px;">
        <h1 style="color: #D4A843; margin: 0; font-size: 22px; letter-spacing: 1px;">Triangle Healthy Kitchen</h1>
        <p style="color: #fff; margin: 4px 0 0; font-size: 14px; opacity: 0.7;">Appointment Reminder</p>
      </div>
      <div style="background: #fff; border-radius: 8px; padding: 24px 32px;">
        <p style="color: #333; font-size: 15px; line-height: 1.6;">Hi ${clientName},</p>
        <p style="color: #333; font-size: 15px; line-height: 1.6;">
          This is a reminder for your upcoming appointment with Triangle Healthy Kitchen.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #0a3030; font-size: 14px;">Package</td><td style="padding: 8px 0; color: #333; font-size: 14px;">${packageName}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #0a3030; font-size: 14px;">When</td><td style="padding: 8px 0; color: #333; font-size: 14px;">${when}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #0a3030; font-size: 14px;">Reminder</td><td style="padding: 8px 0; color: #333; font-size: 14px;">${reminderType}</td></tr>
        </table>
        <p style="color: #333; font-size: 15px; line-height: 1.6;">
          We look forward to seeing you! If you need to reschedule, please contact us at +974 6662 4942.
        </p>
      </div>
      <p style="color: #888; font-size: 12px; margin-top: 24px; text-align: center;">
        Triangle Healthy Kitchen — Doha, Qatar — Est. 2017
      </p>
    </div>
  `;
}

async function logNotification(bookingId: string, recipient: string, role: string, subject: string, status: string, error?: string) {
  await supabase.from("notifications").insert({
    booking_id: bookingId, recipient, recipient_role: role, subject,
    body_html: null, status, provider: "brevo", error: error || null,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const now = Date.now();
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .in("status", ["pending", "confirmed"]);

    if (error) throw error;

    const results = { checked: 0, sent_24h: 0, sent_1h: 0, skipped: 0 };

    for (const b of bookings || []) {
      results.checked++;
      const apptTime = getAppointmentTimestamp(b.appointment_date, b.appointment_time);
      if (apptTime <= now) continue;

      const hoursUntil = (apptTime - now) / (60 * 60 * 1000);

      if (hoursUntil <= 26 && hoursUntil >= 22) {
        const { data: existing } = await supabase
          .from("reminders")
          .select("id")
          .eq("booking_id", b.id)
          .eq("reminder_type", "24h")
          .maybeSingle();

        if (!existing) {
          const when = fmtDateTime(b.appointment_date, b.appointment_time);

          const providerSubject = `Reminder: ${b.client_name} tomorrow at ${b.appointment_time}`;
          const providerHtml = buildProviderReminderHtml(b.client_name, b.package_name, when, b.client_phone, b.client_email, "24 hours before", b.fitness_goal);
          const r1 = await sendBrevoEmail(PROVIDER_EMAIL, "Chef", providerSubject, providerHtml);
          await logNotification(b.id, PROVIDER_EMAIL, "provider", providerSubject, r1.ok ? "sent" : "failed", r1.error);

          const clientSubject = `Your appointment tomorrow at ${b.appointment_time} — Triangle Healthy Kitchen`;
          const clientHtml = buildClientReminderHtml(b.client_name, b.package_name, when, "24 hours before");
          const r2 = await sendBrevoEmail(b.client_email, b.client_name, clientSubject, clientHtml);
          await logNotification(b.id, b.client_email, "client", clientSubject, r2.ok ? "sent" : "failed", r2.error);

          if (r1.ok) {
            await supabase.from("reminders").insert({ booking_id: b.id, reminder_type: "24h" });
            results.sent_24h++;
          }
        } else {
          results.skipped++;
        }
      }

      if (hoursUntil <= 1.5 && hoursUntil >= 0.5) {
        const { data: existing } = await supabase
          .from("reminders")
          .select("id")
          .eq("booking_id", b.id)
          .eq("reminder_type", "1h")
          .maybeSingle();

        if (!existing) {
          const when = fmtDateTime(b.appointment_date, b.appointment_time);

          const providerSubject = `Starting soon: ${b.client_name} in 1 hour`;
          const providerHtml = buildProviderReminderHtml(b.client_name, b.package_name, when, b.client_phone, b.client_email, "1 hour before");
          const r1 = await sendBrevoEmail(PROVIDER_EMAIL, "Chef", providerSubject, providerHtml);
          await logNotification(b.id, PROVIDER_EMAIL, "provider", providerSubject, r1.ok ? "sent" : "failed", r1.error);

          const clientSubject = `Your appointment starts in 1 hour — Triangle Healthy Kitchen`;
          const clientHtml = buildClientReminderHtml(b.client_name, b.package_name, when, "1 hour before");
          const r2 = await sendBrevoEmail(b.client_email, b.client_name, clientSubject, clientHtml);
          await logNotification(b.id, b.client_email, "client", clientSubject, r2.ok ? "sent" : "failed", r2.error);

          if (r1.ok) {
            await supabase.from("reminders").insert({ booking_id: b.id, reminder_type: "1h" });
            results.sent_1h++;
          }
        } else {
          results.skipped++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
