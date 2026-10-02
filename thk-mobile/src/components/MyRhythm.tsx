import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, Circle, Timer, Activity, Sparkles, Flame } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import { getQatarDate } from '@/lib/date-utils';
import { syncHealthData } from '@/lib/health';
import { safeHaptics } from '@/lib/haptics';
import SecuringProtocol from './SecuringProtocol';

interface DayStatus {
  day: string;
  status: 'recorded' | 'today' | 'no-data';
  date: string;
}

interface Metrics {
  steps: number;
  goal: number;
  streak: number;
  points: number;
}

export default function MyRhythm() {
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();
  const [syncing, setSyncing] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({
    steps: 0,
    goal: 10000,
    streak: 0,
    points: 0
  });
  const [weeklyStatus, setWeeklyStatus] = useState<DayStatus[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const today = getQatarDate();

      // First fetch subscriber details to get subscriber_id
      const { data: sub } = await supabase
        .from('subscribers')
        .select('id,current_streak,points_balance')
        .eq('user_id', user.id)
        .maybeSingle();

      const subscriberId = sub?.id;
      let activityData: { total_value: number } | null = null;
      let goalVal = 10000;
      let weeklyActivity: Array<{ local_date: string; total_value: number }> = [];

      if (subscriberId) {
        const weekStartDate = new Date(`${today}T00:00:00+03:00`);
        weekStartDate.setDate(weekStartDate.getDate() - 6);
        const weekStart = getQatarDate(weekStartDate);
        const [activityResult, goalResult, weeklyResult] = await Promise.all([
            supabase
              .from('daily_activity_summaries')
              .select('total_value')
              .eq('subscriber_id', subscriberId)
              .eq('local_date', today)
              .maybeSingle(),
            supabase
              .from('user_daily_goals')
              .select('target_value')
              .eq('subscriber_id', subscriberId)
              .eq('target_date', today)
              .maybeSingle(),
            supabase
              .from('daily_activity_summaries')
              .select('local_date,total_value')
              .eq('subscriber_id', subscriberId)
              .gte('local_date', weekStart)
              .lte('local_date', today),
          ]);
        if (activityResult.error) throw activityResult.error;
        if (goalResult.error) throw goalResult.error;
        if (weeklyResult.error) throw weeklyResult.error;
        activityData = activityResult.data;
        if (goalResult.data?.target_value) goalVal = goalResult.data.target_value;
        weeklyActivity = weeklyResult.data || [];
      }

      const currentStreak = sub?.current_streak || 0;
      setMetrics({
        steps: activityData?.total_value || 0,
        goal: goalVal,
        streak: currentStreak,
        points: sub?.points_balance || 0
      });

      const activityByDate = new Map(weeklyActivity.map((item) => [item.local_date, item.total_value]));
      const todayDate = new Date(`${today}T00:00:00+03:00`);
      const status: DayStatus[] = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(todayDate);
        date.setDate(date.getDate() - (6 - index));
        const isoDate = getQatarDate(date);
        const hasActivity = activityByDate.has(isoDate);
        return {
          day: new Intl.DateTimeFormat(isRtl ? 'ar-QA' : 'en-US', { weekday: 'short', timeZone: 'Asia/Qatar' }).format(date),
          status: isoDate === today ? 'today' : hasActivity ? 'recorded' : 'no-data',
          date: isoDate,
        };
      });
      setWeeklyStatus(status);
    } catch (e) {
      console.error('Failed to load rhythm metrics:', e);
    }
  }, [user, isRtl]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    await safeHaptics.impact();

    try {
      await syncHealthData();
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
                  <p className="text-lg font-black italic text-gold leading-none">{metrics.streak} {isRtl ? 'يوماً' : 'Days'}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mt-1">{isRtl ? 'الاستمرارية النشطة' : 'Active Streak'}</p>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-teal" />
                </div>
                <div>
                  <p className="text-lg font-black italic text-white leading-none">{metrics.points} {isRtl ? 'نقطة' : 'Pts'}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mt-1">{isRtl ? 'نقاط المكافآت' : 'Reward Points'}</p>
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
              {item.status === 'recorded' && <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-label={isRtl ? 'تم تسجيل النشاط' : 'Activity recorded'} />}
              {item.status === 'today' && <Timer className="w-5 h-5 text-[#C5A059]" aria-label={isRtl ? 'اليوم' : 'Today'} />}
              {item.status === 'no-data' && <Circle className="w-5 h-5 text-gray-300" aria-label={isRtl ? 'لا توجد بيانات' : 'No activity data'} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
