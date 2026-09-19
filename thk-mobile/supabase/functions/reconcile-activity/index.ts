import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get Auth Context
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error("Unauthorized Access Signal");

    // Resolve Subscriber
    const { data: sub } = await supabase.from('subscribers').select('id, user_id, email, full_name, phone, package_id, package_name, status, building_number, street, area, zone_number, maid_number, latitude, longitude, delivery_notes, breakfast_window, lunch_window, dinner_window, subscription_start, current_period_end, is_owner, is_paused, paused_until, allergies, dislikes, activity_level, referral_code, weight_kg, height_cm, fitness_goal, points, referral_count, taste_profile, preferred_region_id, membership_type, reward_tier, points_balance, current_streak, longest_streak, onboarding_completed, gender').eq('user_id', user.id).single();
    if (!sub) throw new Error("Biological Identity Not Found");

    const body = await req.json();
    const local_date = body.local_date || new Date().toISOString().split('T')[0];
    const source_platform = body.platform || "unknown";
    const time_zone = body.timezone || "Asia/Qatar";

    const activities = [];
    if (body.steps !== undefined) activities.push({ type: 'steps', val: body.steps, unit: 'count' });
    if (body.distance_meters !== undefined) activities.push({ type: 'distance_walk', val: body.distance_meters / 1000, unit: 'km' });
    if (body.activity_type && body.total_value !== undefined) {
       activities.push({ type: body.activity_type, val: body.total_value, unit: body.unit || 'count' });
    }

    const results = [];

    for (const act of activities) {
      // 1. Log Summary
      await supabase.from("daily_activity_summaries").upsert({
        subscriber_id: sub.id,
        local_date,
        activity_type: act.type,
        total_value: act.val,
        unit: act.unit,
        source_platform,
        time_zone,
        sync_timestamp: new Date().toISOString()
      }, { onConflict: "subscriber_id,local_date,activity_type" });

      // 2. Process Goal
      let { data: goal } = await supabase.from("user_daily_goals").select("*, challenge_templates(*)").eq('subscriber_id', sub.id).eq('target_date', local_date).maybeSingle();

      if (!goal) {
        const { data: template } = await supabase.from("challenge_templates").select("*").eq("activity_type", act.type).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (template) {
          const { data: newGoal } = await supabase.from("user_daily_goals").insert({
            subscriber_id: sub.id,
            template_id: template.id,
            target_date: local_date,
            current_value: act.val,
            target_value: template.daily_target,
            is_completed: act.val >= template.daily_target
          }).select("*, challenge_templates(*)").single();
          goal = newGoal;
        }
      } else {
        const isNowCompleted = act.val >= goal.target_value;
        const { data: updated } = await supabase.from("user_daily_goals").update({
          current_value: act.val,
          is_completed: goal.is_completed || isNowCompleted
        }).eq("id", goal.id).select("*, challenge_templates(*)").single();
        goal = updated;
      }

      // 3. Point Calculations
      if (goal && goal.is_completed && !goal.points_awarded) {
        let delta = 100;
        if (goal.target_value > 0) {
           const bonus = Math.min(20, Math.floor((act.val / goal.target_value - 1.0) * 100));
           if (bonus > 0) delta += bonus;
        }

        const prevDate = new Date(local_date);
        prevDate.setDate(prevDate.getDate() - 1);
        const { data: prevGoal } = await supabase.from("user_daily_goals").select("is_completed").eq('subscriber_id', sub.id).eq('target_date', prevDate.toISOString().split('T')[0]).maybeSingle();
        const isConsecutive = prevGoal?.is_completed === true;
        if (isConsecutive) delta += 20;

        // Commit Ledger
        await supabase.from("points_ledger").insert({
          subscriber_id: sub.id,
          event_type: isConsecutive ? 'streak_completion' : 'daily_completion',
          points_delta: delta,
          source_goal_id: goal.id,
          idempotency_key: `v2:${sub.id}:${local_date}:${act.type}`
        });

        // Update Sub Streak/Balance
        const newStreak = isConsecutive ? (sub.current_streak + 1) : 1;
        await supabase.from("subscribers").update({
          points_balance: (sub.points_balance || 0) + delta,
          current_streak: newStreak,
          longest_streak: Math.max(sub.longest_streak || 0, newStreak)
        }).eq("id", sub.id);

        await supabase.from("user_daily_goals").update({ points_awarded: true }).eq("id", goal.id);
        results.push({ type: act.type, points: delta });
      }
    }

    return new Response(JSON.stringify({ status: "success", results }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
