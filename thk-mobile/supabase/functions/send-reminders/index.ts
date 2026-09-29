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

    // Selection closes Thursday at 23:59 Qatar time. The 30-minute cron calls
    // this function during the preceding Wednesday 23:00 hour; a unique row
    // prevents duplicate mail if the invocation is retried.
    const qatarParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Qatar", weekday: "short", hour: "2-digit", hour12: false,
    }).formatToParts(new Date());
    const qatarWeekday = qatarParts.find((part) => part.type === "weekday")?.value;
    const qatarHour = Number(qatarParts.find((part) => part.type === "hour")?.value || 0);
    if (qatarWeekday === "Wed" && qatarHour === 23) {
      const qatarDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Qatar", year: "numeric", month: "2-digit", day: "2-digit",
      }).format(new Date());
      const serviceSaturday = new Date(`${qatarDate}T12:00:00Z`);
      serviceSaturday.setUTCDate(serviceSaturday.getUTCDate() + 3);
      const weekStart = serviceSaturday.toISOString().slice(0, 10);
      const { data: subscribers, error: subscriberError } = await supabase
        .from("subscribers").select("id,full_name,email,package_name")
        .eq("status", "active").not("email", "is", null);
      if (subscriberError) throw subscriberError;
      const ids = (subscribers || []).map((subscriber) => subscriber.id);
      const [{ data: selections, error: selectionError }, { data: sent, error: sentError }] = await Promise.all([
        ids.length ? supabase.from("weekly_menu_selections").select("subscriber_id,meal_type,dish_name")
          .eq("week_start_date", weekStart).in("subscriber_id", ids) : Promise.resolve({ data: [], error: null }),
        ids.length ? supabase.from("weekly_menu_reminders").select("subscriber_id")
          .eq("week_start_date", weekStart).in("subscriber_id", ids) : Promise.resolve({ data: [], error: null }),
      ]);
      if (selectionError) throw selectionError;
      if (sentError) throw sentError;
      const selectedCount = new Map<string, number>();
      for (const selection of selections || []) {
        if (selection.dish_name !== "SKIP DAY") selectedCount.set(selection.subscriber_id, (selectedCount.get(selection.subscriber_id) || 0) + 1);
      }
      const alreadySent = new Set((sent || []).map((row) => row.subscriber_id));
      for (const subscriber of subscribers || []) {
        const email = String(subscriber.email || "").trim();
        if (!email || alreadySent.has(subscriber.id) || (selectedCount.get(subscriber.id) || 0) >= 24) continue;
        const name = String(subscriber.full_name || "there").replace(/[&<>\"']/g, "");
        const subject = "Choose your meals before the menu closes tomorrow";
        const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:28px;color:#123F38"><h1>Triangle Healthy Kitchen</h1><p>Hi ${name},</p><p>Your meal selection for the service week beginning ${weekStart} closes tomorrow at 11:59 PM Qatar time. Choose meals that fit your plan before the deadline. Any meals left unselected will use the kitchen’s choice.</p><p><a href="https://trianglehealthykitchen.vercel.app/account" style="display:inline-block;background:#123F38;color:white;padding:14px 22px;border-radius:8px;text-decoration:none">Choose this week’s meals</a></p></div>`;
        const sentEmail = await sendBrevoEmail(email, name, subject, html);
        if (sentEmail.ok) {
          const { error: reminderError } = await supabase.from("weekly_menu_reminders")
            .insert({ subscriber_id: subscriber.id, week_start_date: weekStart });
          if (reminderError) throw reminderError;
          results.sent_24h++;
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
