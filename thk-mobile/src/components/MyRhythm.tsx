import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Circle, Timer, XCircle, Trophy, Users, ChevronRight, Activity, Loader2, Wind, Sparkles, Flame } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import { getQatarDate, addDays, getQatarDayOfWeek } from '@/lib/date-utils';
import { syncHealthData, healthSyncStore } from '@/lib/health';
import { safeHaptics } from '@/lib/haptics';
import SecuringProtocol from './SecuringProtocol';
import { AnimatePresence, motion } from 'framer-motion';

interface DayStatus {
  day: string;
  status: 'completed' | 'in-progress' | 'recovery' | 'missed';
  date: string;
}

interface Metrics {
  steps: number;
  goal: number;
  distance: number;
  streak: number;
  points: number;
  groupCount: number;
}

export default function MyRhythm() {
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();
  const [syncStatus, setSyncStatus] = useState(healthSyncStore.getStatus());
  const [syncing, setSyncing] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({
    steps: 0,
    goal: 10000,
    distance: 0,
    streak: 0,
    points: 0,
    groupCount: 0
  });
  const [weeklyStatus, setWeeklyStatus] = useState<DayStatus[]>([]);

  useEffect(() => {
    return healthSyncStore.subscribe(setSyncStatus);
  }, []);

  const fetchData = async () => {
    if (!user) return;
    try {
      const today = getQatarDate();

      // First fetch subscriber details to get subscriber_id
      const { data: sub } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const subscriberId = sub?.id;
      let activityData: any = null;
      let goalVal = 10000;

      if (subscriberId) {
        try {
          const [{ data: activity }, { data: goalData }] = await Promise.all([
            supabase
              .from('daily_activity_summaries')
              .select('*')
              .eq('subscriber_id', subscriberId)
              .eq('local_date', today)
              .maybeSingle(),
            supabase
              .from('user_daily_goals')
              .select('*')
              .eq('subscriber_id', subscriberId)
              .eq('target_date', today)
              .maybeSingle()
          ]);
          activityData = activity;
          if (goalData?.target_value) goalVal = goalData.target_value;
        } catch (e) {}
      }

      const currentStreak = sub?.current_streak || 0;
      setMetrics({
        steps: activityData?.total_value || 0,
        goal: goalVal,
        distance: 0,
        streak: currentStreak,
        points: sub?.points_balance || 0,
        groupCount: 12
      });

      // Generate Weekly Status
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const now = new Date();
      const status: DayStatus[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        const isoDate = getQatarDate(d);

        let s: 'completed' | 'in-progress' | 'recovery' | 'missed' = 'completed';
        if (i === 0) s = 'in-progress';
        else if (i === 5) s = 'recovery';
        else if (i === 3) s = 'missed';

        status.push({
          day: dayName,
          status: s,
          date: isoDate
        });
      }
      setWeeklyStatus(status);
    } catch (e) {
      console.error('Failed to load rhythm metrics:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    await safeHaptics.impact();

    try {
      await syncHealthData(user.id);
      await fetchData();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setSyncing(false);
    }
  };

  const progressPct = Math.min(Math.round((metrics.steps / metrics.goal) * 100), 100);

  return (
    <div className="space-y-8 animate-in" dir={isRtl ? 'rtl' : 'ltr'}>
      {syncing && <SecuringProtocol message="Syncing Health Data" subtitle="Updating your daily steps and goals..." />}

      {/* Main Rhythm Widget */}
      <div className="glass-card bg-primary p-8 sm:p-10 rounded-[3rem] text-white overflow-hidden relative shadow-4xl border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold/10 rounded-full blur-[120px] -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal/20 rounded-full blur-[120px] -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                <Activity className="w-5 h-5 text-gold animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tight">{t('rhythm_title') || 'Your Daily Rhythm'}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">{t('rhythm_subtitle') || 'Live Movement & Steps'}</p>
              </div>
            </div>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all active:scale-95 text-gold"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-gold' : ''}`} />
            </button>
          </div>

          {/* Large Stat Display */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-white/10">
            <div className="col-span-1 sm:col-span-2 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">{t('steps_today') || 'Today\'s Steps'}</span>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl sm:text-6xl font-black italic tracking-tighter">{metrics.steps.toLocaleString()}</span>
                <span className="text-xs font-black uppercase tracking-widest opacity-40">/ {metrics.goal.toLocaleString()} Steps</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-teal via-gold to-emerald-400 rounded-full transition-all duration-1000 shadow-lg"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/40">
                  <span>{progressPct}% Completed</span>
                  <span>{metrics.goal - metrics.steps > 0 ? `${(metrics.goal - metrics.steps).toLocaleString()} Left` : 'Goal Reached!'}</span>
                </div>
              </div>
            </div>

            {/* Streak & Points Side Badges */}
            <div className="flex flex-col justify-between gap-3">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-gold fill-gold" />
                </div>
                <div>
                  <p className="text-lg font-black italic text-gold leading-none">{metrics.streak} Days</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mt-1">Active Streak</p>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-teal" />
                </div>
                <div>
                  <p className="text-lg font-black italic text-white leading-none">{metrics.points} Pts</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mt-1">Reward Points</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly History Row */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-6">
        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#0a3030]">7-Day Activity History</h4>

        <div className="grid grid-cols-7 gap-2 sm:gap-4 text-center">
          {weeklyStatus.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] font-black uppercase text-gray-400">{item.day}</span>
              {item.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {item.status === 'in-progress' && <Timer className="w-5 h-5 text-[#C5A059] animate-spin" />}
              {item.status === 'recovery' && <Wind className="w-5 h-5 text-sky-500" />}
              {item.status === 'missed' && <Circle className="w-5 h-5 text-gray-300" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
