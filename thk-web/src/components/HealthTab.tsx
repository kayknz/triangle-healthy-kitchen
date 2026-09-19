import { useState, useEffect, useCallback } from 'react';
import {
  Heart, Loader2, Check, X, Flame,
  Moon, Droplet, Utensils, Plus, Trash2, TrendingDown, TrendingUp,
  Activity, Target, Calendar, Smartphone, Scale, Zap
} from 'lucide-react';
import { supabase } from '../supabase';
import {
  type Subscriber, type HealthEntry,
} from '../types/subscription';

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

  const todayStr = new Date().toDateString();
  const todayEntry = entries.find(
    (e) => e.data_type === 'body' && new Date(e.received_at).toDateString() === todayStr,
  );

  const latestWeight = weightSeries.length > 0 ? weightSeries[weightSeries.length - 1].value : null;
  const firstWeight = weightSeries.length > 0 ? weightSeries[0].value : null;
  const weightChange = latestWeight && firstWeight ? (latestWeight - firstWeight) : null;

  const calculateBMI = (w: number | null, h: number | null) => {
    if (!w || !h) return null;
    return (w / ((h / 100) ** 2)).toFixed(1);
  };

  const getBMICategory = (bmi: number | null) => {
    if (!bmi) return '';
    if (bmi < 18.5) return 'UNDERWEIGHT';
    if (bmi < 25) return 'HEALTHY';
    if (bmi < 30) return 'OVERWEIGHT';
    return 'OBESE';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#0a3030] animate-spin" />
      </div>
    );
  }

  const currentBMI = latestWeight != null ? calculateBMI(latestWeight, subscriber.height_cm ?? null) : null;

  return (
    <div className="space-y-12 animate-reveal">
      {/* App Promotion Banner */}
      <div className="bg-[#0a3030] rounded-[3rem] p-10 text-white shadow-4xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="max-w-md">
              <div className="flex items-center gap-3 mb-6">
                 <Smartphone className="w-5 h-5 text-gold" />
                 <p className="text-gold text-[10px] font-black uppercase tracking-[0.4em]">Automated Tracking</p>
              </div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4 leading-none">The Triangle App.</h3>
              <p className="text-white/60 text-sm italic font-medium leading-relaxed">
                 Download our mobile app to sync your steps, sleep, and heart rate automatically from Apple Health or Google Fit.
              </p>
           </div>
           <div className="flex gap-4">
              <div className="badge border-white/20 bg-white/5 text-white">
                 BMI: {currentBMI || '—'} ({getBMICategory(currentBMI ? parseFloat(currentBMI) : null)})
              </div>
              <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl group-hover:scale-105 transition-all duration-700 shadow-2xl">
                 <Heart className="w-10 h-10 text-gold fill-gold" />
              </div>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-primary font-black text-3xl tracking-tighter uppercase italic leading-none">Biological<br /><span className="text-sage">Vitals.</span></h2>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowGoals(!showGoals)} className="w-14 h-14 rounded-2xl bg-white border border-primary/5 text-primary shadow-sm hover:shadow-xl transition-all flex items-center justify-center">
            <Target className="w-6 h-6" />
          </button>
          <button onClick={() => setShowForm(!showForm)} className="w-14 h-14 rounded-2xl bg-primary text-white shadow-2xl hover:scale-105 transition-all flex items-center justify-center">
            {showForm ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard icon={<Scale className="w-6 h-6" />} label="Weight" value={latestWeight ? `${latestWeight} kg` : '—'} trend={weightChange} progress={goals.weight_kg > 0 ? (latestWeight! / goals.weight_kg) * 100 : null} color="#D4A843" />
        <SummaryCard icon={<Zap className="w-6 h-6" />} label="Steps" value={todayEntry?.payload?.steps ? todayEntry.payload.steps.toLocaleString() : '—'} progress={todayEntry?.payload?.steps ? (todayEntry.payload.steps / goals.steps) * 100 : 0} color="#5BA889" />
        <SummaryCard icon={<Flame className="w-6 h-6" />} label="Burned" value={todayEntry?.payload?.calories_burned ? `${todayEntry.payload.calories_burned} kcal` : '—'} progress={todayEntry?.payload?.calories_burned ? (todayEntry.payload.calories_burned / goals.calories_burned) * 100 : 0} color="#E07856" />
        <SummaryCard icon={<Droplet className="w-6 h-6" />} label="Water" value={todayEntry?.payload?.water_ml ? `${todayEntry.payload.water_ml} ml` : '—'} progress={todayEntry?.payload?.water_ml ? (todayEntry.payload.water_ml / goals.water_ml) * 100 : 0} color="#5B9BD5" />
      </div>

      {/* Goals Editor */}
      {showGoals && (
        <div className="glass-card p-10 bg-primary text-white space-y-8 animate-in border-none shadow-4xl">
          <div className="flex items-center gap-4">
            <Target className="w-6 h-6 text-gold" />
            <h3 className="text-xl font-black uppercase italic tracking-tighter">Biological Targets</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <GoalField label="Target Weight" value={goals.weight_kg} onChange={(v: string) => setGoals({...goals, weight_kg: parseFloat(v) || 0})} unit="kg" />
            <GoalField label="Daily Steps" value={goals.steps} onChange={(v: string) => setGoals({...goals, steps: parseInt(v) || 0})} unit="" />
            <GoalField label="Daily Burn" value={goals.calories_burned} onChange={(v: string) => setGoals({...goals, calories_burned: parseInt(v) || 0})} unit="kcal" />
            <GoalField label="Daily Water" value={goals.water_ml} onChange={(v: string) => setGoals({...goals, water_ml: parseInt(v) || 0})} unit="ml" />
          </div>
          <button onClick={saveGoals} disabled={saving} className="btn-primary bg-gold text-primary w-full py-5 font-black uppercase tracking-widest">{saving ? 'Syncing...' : 'Lock Targets'}</button>
        </div>
      )}

      {/* Entry Form */}
      {showForm && (
        <div className="glass-card p-10 space-y-8 animate-in shadow-4xl">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-primary">Log New Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <OnboardingField label="Weight" sub="kg"><input type="number" step="0.1" value={form.weight_kg} onChange={e => setForm({...form, weight_kg: e.target.value})} className="input-field" placeholder="72.5" /></OnboardingField>
            <OnboardingField label="Steps" sub="steps"><input type="number" value={form.steps} onChange={e => setForm({...form, steps: e.target.value})} className="input-field" placeholder="8000" /></OnboardingField>
            <OnboardingField label="Burned" sub="kcal"><input type="number" value={form.calories_burned} onChange={e => setForm({...form, calories_burned: e.target.value})} className="input-field" placeholder="500" /></OnboardingField>
          </div>
          <button onClick={addEntry} disabled={saving} className="btn-primary w-full py-6 uppercase tracking-widest">{saving ? 'Syncing...' : 'Commit Data'}</button>
        </div>
      )}

      {/* History */}
      <div className="space-y-6">
         <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary/60 ml-2">Audit History</h3>
         {entries.filter(e => e.data_type === 'body').slice(0, 10).map((e, i) => (
            <div key={i} className="glass-card p-8 flex items-center justify-between border-primary/10 hover:border-teal/30 transition-all">
               <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Activity className="w-6 h-6 text-teal" /></div>
                  <div>
                    <p className="text-primary font-black text-sm italic uppercase tracking-widest">{new Date(e.received_at).toLocaleDateString()}</p>
                    <div className="flex gap-4 mt-2">
                       {e.payload.weight_kg && <span className="text-[10px] font-black text-gold uppercase">{e.payload.weight_kg} KG</span>}
                       {e.payload.steps && <span className="text-[10px] font-black text-teal uppercase">{e.payload.steps} STEPS</span>}
                    </div>
                  </div>
               </div>
               <button onClick={() => deleteEntry(e.id)} className="text-primary/20 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
            </div>
         ))}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, trend, progress, color }: any) {
  return (
    <div className="glass-card p-8 group hover:scale-[1.02] transition-all">
       <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:bg-teal group-hover:text-white transition-all shadow-sm">
             {icon}
          </div>
          {trend != null && (
             <span className={`text-[10px] font-black px-3 py-1 rounded-full ${trend <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}
             </span>
          )}
       </div>
       <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">{label}</p>
       <h4 className="text-3xl font-black text-primary italic tracking-tighter">{value}</h4>
       {progress != null && (
          <div className="mt-6 h-1.5 bg-primary/5 rounded-full overflow-hidden">
             <div className="h-full bg-teal transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
       )}
    </div>
  );
}

function GoalField({ label, value, onChange, unit }: any) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/70 mb-3">{label}</p>
      <div className="flex items-center gap-2 border-b border-white/20 pb-2">
         <input type="number" value={value} onChange={e => onChange(e.target.value)} className="bg-transparent font-black text-xl w-full outline-none text-white" />
         <span className="text-[10px] font-bold text-gold uppercase">{unit}</span>
      </div>
    </div>
  );
}

function OnboardingField({ label, sub, children }: any) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-4 px-2">
        <span className="text-primary font-black text-[10px] uppercase tracking-[0.3em] opacity-40">{label}</span>
        <span className="text-gray-300 text-[9px] font-black uppercase tracking-widest">{sub}</span>
      </div>
      {children}
    </div>
  );
}
