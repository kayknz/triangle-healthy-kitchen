import { useState, useEffect, useCallback } from 'react';
import {
  Heart, Loader2, Check, X, RefreshCw, Weight, Flame, Footprints,
  Moon, Droplet, Utensils, Plus, Trash2, TrendingDown, TrendingUp,
  Activity, Target, Calendar,
} from 'lucide-react';
import SecuringProtocol from './SecuringProtocol';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import { getQatarDate, getQatarStartOfDay, getUTCISO } from '@/lib/date-utils';
import {
  type Subscriber, type HealthEntry,
} from '@/types/subscription';
import { Health } from '@capgo/capacitor-health';
import { useLanguage } from '@/lib/LanguageContext';

interface HealthTabProps {
  subscriber: Subscriber;
}

export default function HealthTab({ subscriber }: HealthTabProps) {
  const { t, isRtl } = useLanguage();
  const nativePlatform = Capacitor.getPlatform();
  const isIOS = nativePlatform === 'ios';
  const isAndroid = nativePlatform === 'android';
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    weight_kg: '', steps: '', calories_burned: '',
    calories_consumed: '', sleep_hours: '', water_ml: '', notes: '',
  });
  const [goals, setGoals] = useState({ weight_kg: 0, steps: 10000, calories_burned: 500, water_ml: 2500 });
  const [showGoals, setShowGoals] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('health_data')
      .select('*')
      .eq('subscriber_id', subscriber.id)
      .order('received_at', { ascending: false });
    setEntries(data as HealthEntry[] || []);

    const { data: lastGoal } = await supabase
      .from('health_data')
      .select('payload')
      .eq('subscriber_id', subscriber.id)
      .eq('data_type', 'goals')
      .order('received_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastGoal?.payload) {
      const p = lastGoal.payload as Record<string, number>;
      setGoals({
        weight_kg: p.weight_kg || 0,
        steps: p.steps || 10000,
        calories_burned: p.calories_burned || 500,
        water_ml: p.water_ml || 2500,
      });
    }
    setLoading(false);
  }, [subscriber.id]);

  useEffect(() => { load(); }, [load]);

  const addEntry = async () => {
    const hasData = form.weight_kg || form.steps || form.calories_burned ||
      form.calories_consumed || form.sleep_hours || form.water_ml;
    if (!hasData) return;

    setSaving(true);
    const payload: Record<string, unknown> = { manual: true };
    if (form.weight_kg) payload.weight_kg = parseFloat(form.weight_kg);
    if (form.steps) payload.steps = parseInt(form.steps);
    if (form.calories_burned) payload.calories_burned = parseInt(form.calories_burned);
    if (form.calories_consumed) payload.calories_consumed = parseInt(form.calories_consumed);
    if (form.sleep_hours) payload.sleep_hours = parseFloat(form.sleep_hours);
    if (form.water_ml) payload.water_ml = parseInt(form.water_ml);
    if (form.notes) payload.notes = form.notes;

    const { error } = await supabase.from('health_data').insert({
      subscriber_id: subscriber.id,
      source: 'manual',
      data_type: 'body',
      payload,
      received_at: new Date().toISOString(),
    });
    if (error) {
      setSaving(false);
      alert(error.message);
      return;
    }

    setForm({ weight_kg: '', steps: '', calories_burned: '', calories_consumed: '', sleep_hours: '', water_ml: '', notes: '' });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const syncNativeHealthData = async () => {
    setLoading(true);
    try {
      const isAvailable = await Health.isAvailable();
      if (!isAvailable.available) {
        throw new Error(isAvailable.reason || 'Health data sync is unavailable on this device.');
      }

      const authorization = await Health.requestAuthorization({
        read: ['steps', 'distance', 'calories', 'weight'],
      });
      if (authorization.readDenied.length > 0) {
        throw new Error(t('health_permissions_denied'));
      }

      const startOfDay = getQatarStartOfDay();
      const endOfDay = getUTCISO();

      const [stepsRes, distanceRes, caloriesRes, weightRes] = await Promise.all([
        Health.readSamples({ dataType: 'steps', startDate: startOfDay, endDate: endOfDay }),
        Health.readSamples({ dataType: 'distance', startDate: startOfDay, endDate: endOfDay }),
        Health.readSamples({ dataType: 'calories', startDate: startOfDay, endDate: endOfDay }),
        Health.readSamples({ dataType: 'weight', startDate: startOfDay, endDate: endOfDay }),
      ]);

      const totalSteps = stepsRes.samples.reduce((sum, s) => sum + (s.value || 0), 0);
      const totalDistance = distanceRes.samples.reduce((sum, s) => sum + (s.value || 0), 0);
      const totalCalories = caloriesRes.samples.reduce((sum, s) => sum + (s.value || 0), 0);
      const latestWeight = weightRes.samples.length > 0 ? weightRes.samples[weightRes.samples.length - 1].value : null;

      if (totalSteps === 0 && totalDistance === 0 && totalCalories === 0 && !latestWeight) {
        alert(t(isAndroid ? 'health_no_samsung_data' : 'health_no_apple_data'));
        return;
      }

      const payload: Record<string, unknown> = {
        native_sync: true,
        platform: isIOS ? 'apple_health' : 'health_connect',
      };
      if (totalSteps > 0) payload.steps = Math.round(totalSteps);
      if (totalDistance > 0) payload.distance_meters = Math.round(totalDistance);
      if (totalCalories > 0) payload.calories_burned = Math.round(totalCalories);
      if (latestWeight) payload.weight_kg = latestWeight;

      const { error } = await supabase.from('health_data').insert({
        subscriber_id: subscriber.id,
        source: 'native',
        data_type: 'body',
        payload,
        received_at: new Date().toISOString(),
      });
      if (error) throw error;

      await load();
      alert(t('health_sync_success'));
    } catch (e) {
      console.error('Health sync failed:', e);
      alert(e instanceof Error ? e.message : 'Failed to sync health data.');
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('health_data').delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
  };

  const saveGoals = async () => {
    setSaving(true);
    const { error } = await supabase.from('health_data').insert({
      subscriber_id: subscriber.id,
      source: 'manual',
      data_type: 'goals',
      payload: goals,
      received_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    setShowGoals(false);
    await load();
  };

  // Extract data series for a metric
  const getSeries = (key: keyof HealthEntry['payload']): { value: number; date: string }[] => {
    return [...entries]
      .filter((e) => e.data_type === 'body' && e.payload && e.payload[key] != null)
      .reverse()
      .map((e) => ({
        value: e.payload[key] as number,
        date: e.received_at,
      }));
  };

  const weightSeries = getSeries('weight_kg');
  const stepsSeries = getSeries('steps');
  const burnSeries = getSeries('calories_burned');

  // Today's stats
  const today = getQatarDate();
  const todayEntry = entries.find(
    (e) => e.data_type === 'body' && getQatarDate(new Date(e.received_at)) === today,
  );

  const latestWeight = weightSeries.length > 0 ? weightSeries[weightSeries.length - 1].value : null;
  const firstWeight = weightSeries.length > 0 ? weightSeries[0].value : null;
  const weightChange = latestWeight && firstWeight ? (latestWeight - firstWeight) : null;

  // This week's averages
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekEntries = entries.filter(
    (e) => e.data_type === 'body' && new Date(e.received_at).getTime() > weekAgo,
  );
  const stepEntries = weekEntries.filter((entry) => typeof entry.payload.steps === 'number');
  const burnEntries = weekEntries.filter((entry) => typeof entry.payload.calories_burned === 'number');
  const avgSteps = stepEntries.length > 0
    ? Math.round(stepEntries.reduce((sum, entry) => sum + (entry.payload.steps || 0), 0) / stepEntries.length)
    : 0;
  const avgBurn = burnEntries.length > 0
    ? Math.round(burnEntries.reduce((sum, entry) => sum + (entry.payload.calories_burned || 0), 0) / burnEntries.length)
    : 0;
  const goalHitDays = new Set(weekEntries
    .filter((entry) =>
      (entry.payload.steps != null && entry.payload.steps >= goals.steps) ||
      (entry.payload.calories_burned != null && entry.payload.calories_burned >= goals.calories_burned),
    )
    .map((entry) => getQatarDate(new Date(entry.received_at))),
  ).size;

  if (loading) {
    return (
      <SecuringProtocol
        message="Securing Health Protocol"
        subtitle="Synchronizing native biometric telemetry with your encrypted profile ledger..."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Sync Banner */}
      <div className="bg-[#0a3030] rounded-[2rem] p-6 text-white flex items-center justify-between shadow-2xl relative overflow-hidden group">
        <div className="relative z-10">
          <h3 className="text-xl font-black mb-1">
            {isIOS ? t('connect_apple_health') : isAndroid ? t('connect_samsung_health') : 'Health Sync'}
          </h3>
          <p className="text-white/70 text-xs max-w-xl">
            {isIOS
              ? t('apple_health_hint')
              : isAndroid
                ? t('samsung_health_hint')
                : t('health_sync_web')}
          </p>
          <button
            onClick={syncNativeHealthData}
            disabled={loading || (!isIOS && !isAndroid)}
            className="mt-4 bg-white text-[#0a3030] px-6 py-2 rounded-full text-xs font-black hover:bg-gray-100 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
            {loading ? 'Syncing...' : 'Connect & Sync'}
          </button>
        </div>
        <div className="relative z-10 w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
          <Heart className="w-8 h-8 text-[#D4A843] fill-[#D4A843]" />
        </div>
        {/* Decor */}
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-[#D4A843]/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-[#0a3030] font-black text-2xl tracking-tight">{isRtl ? 'مؤشراتك الصحية' : 'Your Vitals'}</h2>
          <p className="text-gray-400 text-sm font-medium mt-1">{isRtl ? 'تابع مؤشراتك الصحية وتقدمك اليومي.' : 'Deep metrics tracking for Doha Excellents.'}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGoals(!showGoals)}
            className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-[#0a3030] hover:bg-white hover:shadow-lg transition-all"
          >
            <Target className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-3 rounded-2xl bg-[#0a3030] text-white shadow-xl hover:shadow-[#0a3030]/20 transition-all"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Today's Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <SummaryCard
          icon={<Weight className="w-5 h-5" />}
          label="Weight"
          value={latestWeight ? `${latestWeight} kg` : '—'}
          trend={weightChange !== null && weightChange !== 0 ? weightChange : null}
          progress={goals.weight_kg > 0 && latestWeight ? Math.min((latestWeight / goals.weight_kg) * 100, 100) : null}
          color="#D4A843"
        />
        <SummaryCard
          icon={<Footprints className="w-5 h-5" />}
          label="Steps"
          value={todayEntry?.payload?.steps ? todayEntry.payload.steps.toLocaleString() : '—'}
          trend={null}
          progress={todayEntry?.payload?.steps ? Math.min((todayEntry.payload.steps / goals.steps) * 100, 100) : null}
          color="#5BA889"
        />
        <SummaryCard
          icon={<Flame className="w-5 h-5" />}
          label="Burned"
          value={todayEntry?.payload?.calories_burned ? `${todayEntry.payload.calories_burned}` : '—'}
          trend={null}
          progress={todayEntry?.payload?.calories_burned ? Math.min((todayEntry.payload.calories_burned / goals.calories_burned) * 100, 100) : null}
          color="#E07856"
        />
        <SummaryCard
          icon={<Droplet className="w-5 h-5" />}
          label="Water"
          value={todayEntry?.payload?.water_ml ? `${todayEntry.payload.water_ml} ml` : '—'}
          trend={null}
          progress={todayEntry?.payload?.water_ml ? Math.min((todayEntry.payload.water_ml / goals.water_ml) * 100, 100) : null}
          color="#5B9BD5"
        />
      </div>

      {/* Goals Editor */}
      {showGoals && (
        <div className="bg-[#0d3838] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[#D4A843]" />
            <h3 className="text-white font-semibold text-sm">{isRtl ? 'حدد أهدافك' : 'Set Your Goals'}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">{isRtl ? 'الوزن المستهدف (كجم)' : 'Target Weight (kg)'}</label>
              <input type="number" step="0.1" value={goals.weight_kg || ''} onChange={(e) => setGoals({ ...goals, weight_kg: parseFloat(e.target.value) || 0 })} placeholder="70" className="input-field" />
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">{isRtl ? 'الخطوات اليومية' : 'Daily Steps'}</label>
              <input type="number" value={goals.steps || ''} onChange={(e) => setGoals({ ...goals, steps: parseInt(e.target.value) || 0 })} placeholder="10000" className="input-field" />
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">{isRtl ? 'السعرات المحروقة يومياً' : 'Daily Burn (kcal)'}</label>
              <input type="number" value={goals.calories_burned || ''} onChange={(e) => setGoals({ ...goals, calories_burned: parseInt(e.target.value) || 0 })} placeholder="500" className="input-field" />
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">{isRtl ? 'الماء (مل)' : 'Water (ml)'}</label>
              <input type="number" value={goals.water_ml || ''} onChange={(e) => setGoals({ ...goals, water_ml: parseInt(e.target.value) || 0 })} placeholder="2500" className="input-field" />
            </div>
          </div>
          <button
            onClick={saveGoals}
            disabled={saving}
            className="w-full bg-[#D4A843] hover:bg-[#c09535] text-[#0a3030] font-bold py-2.5 rounded-full text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> {isRtl ? 'حفظ الأهداف' : 'Save Goals'}</>}
          </button>
        </div>
      )}

      {/* Log Entry Form */}
      {showForm && (
        <div className="bg-[#0d3838] rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm">{t('log_today_health') || "Log Today's Health Data"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricInput icon={<Weight className="w-3 h-3" />} label={t('weight_kg') || "Weight (kg)"} value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} placeholder="72.5" type="decimal" />
            <MetricInput icon={<Footprints className="w-3 h-3" />} label={t('steps_label') || "Steps"} value={form.steps} onChange={(v) => setForm({ ...form, steps: v })} placeholder="8000" type="integer" />
            <MetricInput icon={<Flame className="w-3 h-3" />} label={t('burned_kcal') || "Burned (kcal)"} value={form.calories_burned} onChange={(v) => setForm({ ...form, calories_burned: v })} placeholder="500" type="integer" />
            <MetricInput icon={<Utensils className="w-3 h-3" />} label={t('eaten_kcal') || "Eaten (kcal)"} value={form.calories_consumed} onChange={(v) => setForm({ ...form, calories_consumed: v })} placeholder="1800" type="integer" />
            <MetricInput icon={<Moon className="w-3 h-3" />} label={t('sleep_hrs') || "Sleep (hrs)"} value={form.sleep_hours} onChange={(v) => setForm({ ...form, sleep_hours: v })} placeholder="7.5" type="decimal" />
            <MetricInput icon={<Droplet className="w-3 h-3" />} label={t('water_ml') || "Water (ml)"} value={form.water_ml} onChange={(v) => setForm({ ...form, water_ml: v })} placeholder="2000" type="integer" />
          </div>
          <div>
            <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">{t('notes_optional') || "Notes (optional)"}</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('health_notes_placeholder') || "Post-workout, feeling energized"} className="input-field" />
          </div>
          <button
            onClick={addEntry}
            disabled={saving || (!form.weight_kg && !form.steps && !form.calories_burned && !form.calories_consumed && !form.sleep_hours && !form.water_ml)}
            className="w-full bg-[#D4A843] hover:bg-[#c09535] text-[#0a3030] font-bold py-2.5 rounded-full text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> {t('commit_data') || "Save Entry"}</>}
          </button>
        </div>
      )}

      {/* Weight Trend Chart */}
      {weightSeries.length >= 2 ? (
        <TrendChart
          title="Weight Trend"
          icon={<TrendingDown className="w-4 h-4 text-[#D4A843]" />}
          data={weightSeries}
          unit="kg"
          color="#D4A843"
          startValue={firstWeight}
          endValue={latestWeight}
        />
      ) : null}

      {/* Steps Trend */}
      {stepsSeries.length >= 2 ? (
        <TrendChart
          title="Daily Steps"
          icon={<Footprints className="w-4 h-4 text-[#5BA889]" />}
          data={stepsSeries}
          unit=""
          color="#5BA889"
        />
      ) : null}

      {/* Calories Burned Trend */}
      {burnSeries.length >= 2 ? (
        <TrendChart
          title="Calories Burned"
          icon={<Flame className="w-4 h-4 text-[#E07856]" />}
          data={burnSeries}
          unit=" kcal"
          color="#E07856"
        />
      ) : null}

      {/* Weekly Average Summary */}
      {weekEntries.length > 0 ? (
        <div className="bg-[#0d3838] rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-[#D4A843]" /> This Week's Averages
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBlock label="Steps/day" value={avgSteps > 0 ? avgSteps.toLocaleString() : '—'} icon={<Footprints className="w-3.5 h-3.5 text-[#5BA889]" />} />
            <StatBlock label="Burned/day" value={avgBurn > 0 ? `${avgBurn} kcal` : '—'} icon={<Flame className="w-3.5 h-3.5 text-[#E07856]" />} />
            <StatBlock label="Entries" value={`${weekEntries.length}`} icon={<Activity className="w-3.5 h-3.5 text-[#D4A843]" />} />
            <StatBlock label="Goal hit" value={`${goalHitDays} days`} icon={<Target className="w-3.5 h-3.5 text-[#5BA889]" />} />
          </div>
        </div>
      ) : null}

      {/* Recent Entries */}
      {entries.filter((e) => e.data_type === 'body').length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-white/60 text-xs uppercase tracking-wider">{isRtl ? 'الإدخالات الأخيرة' : 'Recent Entries'}</h3>
          {entries.filter((e) => e.data_type === 'body').slice(0, 15).map((e) => (
            <div key={e.id} className="bg-[#0d3838] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/40 text-xs flex items-center gap-1.5">
                  <Activity className="w-3 h-3" />
                  {new Date(e.received_at).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <button onClick={() => deleteEntry(e.id)} className="text-white/20 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {e.payload.weight_kg != null && <DataPill icon={<Weight className="w-3.5 h-3.5" />} label="Weight" value={`${e.payload.weight_kg} kg`} color="#D4A843" />}
                {e.payload.steps != null && <DataPill icon={<Footprints className="w-3.5 h-3.5" />} label="Steps" value={e.payload.steps.toLocaleString()} color="#5BA889" />}
                {e.payload.calories_burned != null && <DataPill icon={<Flame className="w-3.5 h-3.5" />} label="Burned" value={`${e.payload.calories_burned} kcal`} color="#E07856" />}
                {e.payload.calories_consumed != null && <DataPill icon={<Utensils className="w-3.5 h-3.5" />} label="Eaten" value={`${e.payload.calories_consumed} kcal`} color="#D4A843" />}
                {e.payload.sleep_hours != null && <DataPill icon={<Moon className="w-3.5 h-3.5" />} label="Sleep" value={`${e.payload.sleep_hours} hrs`} color="#7B8DB8" />}
                {e.payload.water_ml != null && <DataPill icon={<Droplet className="w-3.5 h-3.5" />} label="Water" value={`${e.payload.water_ml} ml`} color="#5B9BD5" />}
              </div>
              {e.payload.notes && (
                <p className="text-white/40 text-xs italic mt-2">"{e.payload.notes}"</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0d3838] rounded-2xl p-8 text-center">
          <Heart className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm mb-2">{isRtl ? 'لا توجد بيانات صحية حتى الآن' : 'No health entries yet'}</p>
          <p className="text-white/30 text-xs mb-4">
            Start logging your weight, steps, calories, sleep, and water intake to track your progress over time.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="text-[#D4A843] hover:text-[#c09535] text-sm transition-colors flex items-center gap-1.5 mx-auto"
          >
            <Plus className="w-4 h-4" /> Log your first entry
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Helper Components ---------- */

function SummaryCard({
  icon, label, value, trend, progress, color,
}: {
  icon: React.ReactNode; label: string; value: string;
  trend: number | null; progress: number | null; color: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center border border-gray-50" style={{ backgroundColor: `${color}10`, color }}>
          {icon}
        </span>
        {trend !== null && trend !== 0 && (
          <span className={`text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${trend < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
            {trend < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}
          </span>
        )}
      </div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{label}</p>
      <p className="text-[#0a3030] font-black text-2xl mt-1 tracking-tight">{value}</p>
      {progress !== null && (
        <div className="mt-4 h-2 bg-gray-50 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }} />
        </div>
      )}
    </div>
  );
}

function TrendChart({
  title, icon, data, unit, color, startValue, endValue,
}: {
  title: string; icon: React.ReactNode;
  data: { value: number; date: string }[];
  unit: string; color: string;
  startValue?: number | null; endValue?: number | null;
}) {
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, max);
  const range = max - min || 1;
  const diff = startValue && endValue ? endValue - startValue : null;

  return (
    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
            {icon}
          </div>
          <h3 className="text-[#0a3030] font-black text-lg tracking-tight">{title}</h3>
        </div>
        {diff !== null && diff !== 0 && (
          <div className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 font-black text-xs ${diff < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
            {diff < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-1 h-32">
        {data.map((d, i) => {
          const heightPct = ((d.value - min) / range) * 75 + 25;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0 group">
              <span className="text-white/40 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">{d.value}{unit}</span>
              <div className="w-full rounded-t-md relative" style={{ height: `${heightPct}%`, backgroundColor: `${color}40` }}>
                <div className="absolute inset-0 rounded-t-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />
              </div>
              <span className="text-white/30 text-[10px] truncate">
                {new Date(d.date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBlock({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-white/40 text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-white font-semibold text-sm">{value}</p>
    </div>
  );
}

function DataPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2" style={{ borderLeft: `2px solid ${color}` }}>
      <span style={{ color }}>{icon}</span>
      <div>
        <p className="text-white/40 text-[10px] uppercase tracking-wider">{label}</p>
        <p className="text-white text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function MetricInput({
  icon, label, value, onChange, placeholder, type,
}: {
  icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; placeholder: string; type: 'decimal' | 'integer';
}) {
  return (
    <div>
      <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block flex items-center gap-1">
        {icon}{label}
      </label>
      <input
        type="number"
        step={type === 'decimal' ? '0.1' : '1'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
}
