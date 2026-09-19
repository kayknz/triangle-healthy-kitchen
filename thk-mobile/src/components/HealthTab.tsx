import { useState, useEffect, useCallback } from 'react';
import {
  Heart, Loader2, Check, X, RefreshCw, Weight, Flame, Footprints,
  Moon, Droplet, Utensils, Plus, Trash2, TrendingDown, TrendingUp,
  Activity, Target, Calendar,
} from 'lucide-react';
import SecuringProtocol from './SecuringProtocol';
import { supabase } from '@/lib/supabase';
import { getQatarStartOfDay, getUTCISO } from '@/lib/date-utils';
import {
  HEALTH_METRICS,
  type Subscriber, type HealthEntry,
} from '@/types/subscription';
import { Health } from '@capgo/capacitor-health';

interface HealthTabProps {
  subscriber: Subscriber;
}

export default function HealthTab({ subscriber }: HealthTabProps) {
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

    await supabase.from('health_data').insert({
      subscriber_id: subscriber.id,
      terra_user_id: 'manual',
      data_type: 'body',
      payload,
      received_at: new Date().toISOString(),
    });

    setForm({ weight_kg: '', steps: '', calories_burned: '', calories_consumed: '', sleep_hours: '', water_ml: '', notes: '' });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const syncNativeHealthData = async () => {
    setLoading(true);
    try {
      const isAvailable = await Health.isAvailable();
      if (!isAvailable.value) {
        alert("Health data sync not available on this device.");
        setLoading(false);
        return;
      }

      await Health.requestPermissions({
        read: ['steps', 'calories', 'weight', 'water']
      });

      const startOfDay = getQatarStartOfDay();
      const endOfDay = getUTCISO();

      const [steps, calories, weight] = await Promise.all([
        Health.query({ type: 'steps', startDate: startOfDay, endDate: endOfDay }),
        Health.query({ type: 'calories', startDate: startOfDay, endDate: endOfDay }),
        Health.query({ type: 'weight', startDate: startOfDay, endDate: endOfDay }),
      ]);

      const payload: any = { native_sync: true };
      if (steps.data?.[0]) payload.steps = steps.data[0].value;
      if (calories.data?.[0]) payload.calories_burned = calories.data[0].value;
      if (weight.data?.[0]) payload.weight_kg = weight.data[0].value;

      await supabase.from('health_data').insert({
        subscriber_id: subscriber.id,
        terra_user_id: 'native',
        data_type: 'body',
        payload,
        received_at: new Date().toISOString(),
      });

      load();
    } catch (e) {
      console.error('Health sync failed:', e);
      alert("Failed to sync health data.");
    }
    setLoading(false);
  };

  const deleteEntry = async (id: string) => {
    await supabase.from('health_data').delete().eq('id', id);
    load();
  };

  const saveGoals = async () => {
    setSaving(true);
    await supabase.from('health_data').insert({
      subscriber_id: subscriber.id,
      terra_user_id: 'manual',
      data_type: 'goals',
      payload: goals,
      received_at: new Date().toISOString(),
    });
    setSaving(false);
    setShowGoals(false);
    load();
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
  const waterSeries = getSeries('water_ml');

  // Today's stats
  const today = new Date().toDateString();
  const todayEntry = entries.find(
    (e) => e.data_type === 'body' && new Date(e.received_at).toDateString() === today,
  );

  const latestWeight = weightSeries.length > 0 ? weightSeries[weightSeries.length - 1].value : null;
  const firstWeight = weightSeries.length > 0 ? weightSeries[0].value : null;
  const weightChange = latestWeight && firstWeight ? (latestWeight - firstWeight) : null;

  // This week's averages
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekEntries = entries.filter(
    (e) => e.data_type === 'body' && new Date(e.received_at).getTime() > weekAgo,
  );
  const avgSteps = weekEntries.length > 0
    ? Math.round(weekEntries.reduce((s, e) => s + (e.payload.steps || 0), 0) / weekEntries.filter((e) => e.payload.steps).length || 1)
    : 0;
  const avgBurn = weekEntries.length > 0
    ? Math.round(weekEntries.reduce((s, e) => s + (e.payload.calories_burned || 0), 0) / weekEntries.filter((e) => e.payload.calories_burned).length || 1)
    : 0;

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
          <h3 className="text-xl font-black mb-1">Native Health Sync</h3>
          <p className="text-white/50 text-xs">Pull steps & energy from Apple Health / Google Fit.</p>
          <button
            onClick={syncNativeHealthData}
            disabled={loading}
            className="mt-4 bg-white text-[#0a3030] px-6 py-2 rounded-full text-xs font-black hover:bg-gray-100 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
            {loading ? 'Syncing...' : 'Sync Now'}
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
          <h2 className="text-[#0a3030] font-black text-2xl tracking-tight">Your Vitals</h2>
          <p className="text-gray-400 text-sm font-medium mt-1">Deep metrics tracking for Doha Excellents.</p>
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
            <h3 className="text-white font-semibold text-sm">Set Your Goals</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">Target Weight (kg)</label>
              <input type="number" step="0.1" value={goals.weight_kg || ''} onChange={(e) => setGoals({ ...goals, weight_kg: parseFloat(e.target.value) || 0 })} placeholder="70" className="input-field" />
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">Daily Steps</label>
              <input type="number" value={goals.steps || ''} onChange={(e) => setGoals({ ...goals, steps: parseInt(e.target.value) || 0 })} placeholder="10000" className="input-field" />
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">Daily Burn (kcal)</label>
              <input type="number" value={goals.calories_burned || ''} onChange={(e) => setGoals({ ...goals, calories_burned: parseInt(e.target.value) || 0 })} placeholder="500" className="input-field" />
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">Water (ml)</label>
              <input type="number" value={goals.water_ml || ''} onChange={(e) => setGoals({ ...goals, water_ml: parseInt(e.target.value) || 0 })} placeholder="2500" className="input-field" />
            </div>
          </div>
          <button
            onClick={saveGoals}
            disabled={saving}
            className="w-full bg-[#D4A843] hover:bg-[#c09535] text-[#0a3030] font-bold py-2.5 rounded-full text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save Goals</>}
          </button>
        </div>
      )}

      {/* Log Entry Form */}
      {showForm && (
        <div className="bg-[#0d3838] rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm">Log Today's Health Data</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricInput icon={<Weight className="w-3 h-3" />} label="Weight (kg)" value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} placeholder="72.5" type="decimal" />
            <MetricInput icon={<Footprints className="w-3 h-3" />} label="Steps" value={form.steps} onChange={(v) => setForm({ ...form, steps: v })} placeholder="8000" type="integer" />
            <MetricInput icon={<Flame className="w-3 h-3" />} label="Burned (kcal)" value={form.calories_burned} onChange={(v) => setForm({ ...form, calories_burned: v })} placeholder="500" type="integer" />
            <MetricInput icon={<Utensils className="w-3 h-3" />} label="Eaten (kcal)" value={form.calories_consumed} onChange={(v) => setForm({ ...form, calories_consumed: v })} placeholder="1800" type="integer" />
            <MetricInput icon={<Moon className="w-3 h-3" />} label="Sleep (hrs)" value={form.sleep_hours} onChange={(v) => setForm({ ...form, sleep_hours: v })} placeholder="7.5" type="decimal" />
            <MetricInput icon={<Droplet className="w-3 h-3" />} label="Water (ml)" value={form.water_ml} onChange={(v) => setForm({ ...form, water_ml: v })} placeholder="2000" type="integer" />
          </div>
          <div>
            <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">Notes (optional)</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Post-workout, feeling energized" className="input-field" />
          </div>
          <button
            onClick={addEntry}
            disabled={saving || (!form.weight_kg && !form.steps && !form.calories_burned && !form.calories_consumed && !form.sleep_hours && !form.water_ml)}
            className="w-full bg-[#D4A843] hover:bg-[#c09535] text-[#0a3030] font-bold py-2.5 rounded-full text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save Entry</>}
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
            <StatBlock label="Goal hit" value={
              weekEntries.filter((e) =>
                (e.payload.steps && e.payload.steps >= goals.steps) ||
                (e.payload.calories_burned && e.payload.calories_burned >= goals.calories_burned)
              ).length + ' days'
            } icon={<Target className="w-3.5 h-3.5 text-[#5BA889]" />} />
          </div>
        </div>
      ) : null}

      {/* Recent Entries */}
      {entries.filter((e) => e.data_type === 'body').length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-white/60 text-xs uppercase tracking-wider">Recent Entries</h3>
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
          <p className="text-white/50 text-sm mb-2">No health entries yet</p>
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
