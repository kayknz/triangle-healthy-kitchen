import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Circle, Timer, XCircle, Trophy, Users, ChevronRight, Activity, Loader2, Wind, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import { syncHealthData, healthSyncStore } from '@/lib/health';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import SecuringProtocol from './SecuringProtocol';
import { AnimatePresence, motion } from 'framer-motion';

interface DayStatus {
  day: string;
  status: 'completed' | 'in-progress' | 'recovery' | 'missed';
  date: string;
}

const StatusIcon = ({ status }: { status: DayStatus['status'] }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-6 h-6 text-[#123F38]" />;
    case 'in-progress':
      return (
        <div className="relative w-6 h-6">
          <div className="absolute inset-0 border-2 border-[#C5A059]/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    case 'recovery':
      return <Wind className="w-6 h-6 text-[#8AA694]" />;
    case 'missed':
      return <Circle className="w-6 h-6 text-[#123F38]/10" />;
    default:
      return null;
  }
};

const MyRhythm: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(healthSyncStore.getStatus());
  const [metrics, setMetrics] = useState({
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
      const today = new Date().toISOString().split('T')[0];

      // Fetch Today's Activity
      const { data: activity } = await supabase
        .from('daily_activity_summaries')
        .select('total_value, unit')
        .eq('user_id', user.id)
        .eq('local_date', today)
        .maybeSingle();

      // Fetch Goal
      const { data: goalData } = await supabase
        .from('user_daily_goals')
        .select('target_value')
        .eq('user_id', user.id)
        .eq('target_date', today)
        .maybeSingle();

      // Fetch Subscriber info (streak, points)
      const { data: sub } = await supabase
        .from('subscribers')
        .select('id, user_id, email, full_name, phone, package_id, package_name, status, building_number, street, area, zone_number, maid_number, latitude, longitude, delivery_notes, breakfast_window, lunch_window, dinner_window, subscription_start, current_period_end, is_owner, is_paused, paused_until, allergies, dislikes, activity_level, referral_code, weight_kg, height_cm, fitness_goal, points, referral_count, taste_profile, preferred_region_id, membership_type, reward_tier, points_balance, current_streak, longest_streak, onboarding_completed, gender')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentStreak = sub?.current_streak || 0;
      setMetrics({
        steps: activity?.total_value || 0,
        goal: goalData?.target_value || 10000,
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
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.getDate().toString();
        const dayLabel = days[d.getDay()];

        let dayStatus: DayStatus['status'] = 'missed';
        if (i === 0) dayStatus = 'in-progress';
        else if (i <= currentStreak) dayStatus = 'completed';
        else if (i === currentStreak + 1) dayStatus = 'recovery';

        status.push({ day: dayLabel, date: dateStr, status: dayStatus });
      }
      setWeeklyStatus(status);

    } catch (error) {
      console.error('Error fetching rhythm data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSync = async () => {
    await Haptics.impact({ style: ImpactStyle.Medium });
    setSyncing(true);
    const result = await syncHealthData();
    if (result.success) {
      await fetchData();
    }
    setSyncing(false);
  };

  const progress = Math.min((metrics.steps / metrics.goal) * 100, 100);

  const todayFormatted = new Date().toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const lastSyncText = syncStatus.lastSyncTimestamp
    ? new Date(syncStatus.lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not synced';

  const inRhythmCount = weeklyStatus.filter(d => d.status === 'completed' || d.status === 'in-progress').length;

  return (
    <div className="flex flex-col gap-8 pb-32 animate-reveal bg-[#F5F3EB] min-h-screen">
      <AnimatePresence>
        {syncing && <SecuringProtocol message="Synchronizing Bio" subtitle="Analyzing movement patterns and securing rhythm data with HQ..." />}
      </AnimatePresence>

      {/* Header */}
      <div className="px-6 pt-8">
        <h1 className="text-4xl font-serif text-[#123F38] leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
          {t('my_rhythm')}
        </h1>
        <p className="text-[#123F38]/60 font-sans mt-2 uppercase tracking-widest text-[10px] font-bold">
          {todayFormatted}
        </p>
      </div>

      {/* Hero Goal Card */}
      <div className="px-6">
        <div className="bg-[#123F38] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059] opacity-80">{t('todays_goal')}</span>
                <h2 className="text-3xl font-serif mt-1" style={{ fontFamily: "'DM Serif Display', serif" }}>Keep the pace</h2>
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-white ${syncing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-end gap-4 mb-6">
              <span className="text-6xl font-serif" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {metrics.steps.toLocaleString()}
              </span>
              <span className="text-white/60 font-sans mb-2 uppercase tracking-widest text-xs">{t('steps')}</span>
            </div>

            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-8">
              <div
                className="bg-[#C5A059] h-full rounded-full shadow-[0_0_15px_rgba(197,160,89,0.5)] transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#C5A059]" />
                  <span className="text-sm font-sans text-white/80">Goal: {metrics.goal.toLocaleString()} {t('steps')}</span>
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="bg-[#C5A059] text-[#123F38] px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {syncing && <Loader2 className="w-3 h-3 animate-spin" />}
                  {t('sync_now')}
                </button>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/40">
                <div className="flex flex-col gap-1">
                  <span>Data Source</span>
                  <span className="text-white/80">{syncStatus.sourcePlatform || 'Awaiting Sync'}</span>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <span>Last Sync</span>
                  <span className="text-white/80">{lastSyncText}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-[#1A3434] rounded-full blur-[80px] opacity-40" />
          <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-[#C5A059] rounded-full blur-[100px] opacity-10" />
        </div>
      </div>

      {/* Streak Rail */}
      <div>
        <div className="px-6 flex justify-between items-end mb-4">
          <div>
            <h3 className="font-serif text-2xl text-[#123F38]" style={{ fontFamily: "'DM Serif Display', serif" }}>Your Week</h3>
            <p className="text-xs font-sans text-[#123F38]/60 mt-1 italic">A steady pace, a peaceful mind.</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059]">{inRhythmCount} of 7 days in rhythm</span>
        </div>

        <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-none">
          {weeklyStatus.map((item, index) => (
            <div
              key={index}
              className={`flex-shrink-0 w-24 h-36 rounded-[2rem] flex flex-col items-center justify-between p-4 transition-all ${
                item.status === 'in-progress'
                  ? 'bg-white border-2 border-[#C5A059] shadow-xl scale-105 z-10'
                  : item.status === 'completed'
                  ? 'bg-white border border-[#123F38]/10'
                  : item.status === 'recovery'
                  ? 'bg-[#E6EBE6] border border-transparent'
                  : 'bg-[#F5F3EB] border border-[#123F38]/5'
              }`}
            >
              <span className={`text-[10px] font-black uppercase tracking-tighter ${
                item.status === 'in-progress' ? 'text-[#C5A059]' : 'text-[#123F38]/40'
              }`}>
                {item.day}
              </span>

              <div className="flex flex-col items-center gap-1">
                <StatusIcon status={item.status} />
                <span className="text-[8px] font-bold uppercase tracking-tighter text-center leading-none mt-1">
                  {item.status === 'completed' && "Goal met."}
                  {item.status === 'missed' && "A new day starts here."}
                  {item.status === 'recovery' && "Resting"}
                </span>
              </div>

              <span className="font-serif text-xl text-[#123F38]" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Supporting Cards */}
      <div className="px-6 grid grid-cols-2 gap-4">
        {/* Your Points Card */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-[#123F38]/5 shadow-sm">
          <div className="w-10 h-10 bg-[#C5A059]/10 rounded-2xl flex items-center justify-center mb-4">
            <Trophy className="w-5 h-5 text-[#C5A059]" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#123F38]/40">Your Points</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-2xl font-serif text-[#123F38]" style={{ fontFamily: "'DM Serif Display', serif" }}>{metrics.points.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[#123F38]/60 text-[10px] font-bold uppercase tracking-widest">
            <span>Redeem</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Your Group Card */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-[#123F38]/5 shadow-sm">
          <div className="w-10 h-10 bg-[#123F38]/10 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-[#123F38]" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#123F38]/40">Your Group</span>
          <div className="mt-1">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-[#8AA694]" />
              ))}
              <div className="w-6 h-6 rounded-full border-2 border-white bg-[#123F38] flex items-center justify-center text-[8px] text-white">
                +{metrics.groupCount}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[#123F38]/60 text-[10px] font-bold uppercase tracking-widest">
            <span>Community</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRhythm;
