import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, LogOut, Utensils, Truck, Activity, X, Loader2, Heart,
  Moon, Sun, Coffee, Brain, Zap, Map as MapIcon, Share2, Award,
  Sparkles, ShieldAlert, Phone, Clock, Trash2, ChevronLeft, ChevronRight, Check,
  Package, MapPin, CheckCircle, Clock3, Shield, MessageCircle, Star, Camera, Trophy, Banknote, RefreshCcw, ArrowUpRight, ShieldCheck, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../lib/auth';
import { PACKAGES } from '../types/booking';
import {
  DELIVERY_WINDOWS, PACKAGE_MEALS,
  type Subscriber, type ProgressEntry, type MenuSelection, type GlobalSettings,
} from '../types/subscription';
import { WEEKLY_MENU } from '../data/menu';
import HealthTab from '../components/HealthTab';
import { useLanguage } from '../lib/LanguageContext';

type Tab = 'menu' | 'delivery' | 'health' | 'settings';

export default function SubscriberDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t, isRtl } = useLanguage();
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [riderLocation, setRiderLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('menu');
  const [updating, setUpdating] = useState(false);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [menuSelectionsCount, setMenuSelectionsCount] = useState<number | null>(null);

  // My Rhythm Data
  const [rhythmMetrics, setRhythmMetrics] = useState({
    steps: 0,
    goal: 10000,
    streak: 0,
    points: 0
  });

  const loadDashboardData = useCallback(async (retryCount = 0) => {
    if (!user) return;
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Batch 1: Identity & Settings
      const { data: subData, error: subError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) throw subError;
      if (!subData) {
        setLoading(false);
        return;
      }

      // SECURITY: Ensure email is tracked in subscriber record for sync
      if (subData.email !== user.email) {
        await supabase.from('subscribers').update({ email: user.email }).eq('id', subData.id);
      }

      const { data: settsData } = await supabase.from('global_settings').select('*').single();

      // Hardened: Fetch community separately
      let communityInfo = null;
      if (subData.preferred_region_id) {
        try {
          const { data: comm } = await supabase
            .from('regional_communities')
            .select('*')
            .eq('id', subData.preferred_region_id)
            .maybeSingle();
          communityInfo = comm;
        } catch (e) {
          console.warn('Regional communities signal weak or table missing.');
        }
      }

      setSubscriber({ ...subData, regional_communities: communityInfo } as Subscriber | null);
      if (settsData) setSettings(settsData as GlobalSettings);

      // Batch 2: Activity & Logistics
      const sid = subData.id;

      // Use allSettled to ensure one missing table doesn't crash the whole UI
      const results = await Promise.allSettled([
        supabase.from('daily_activity_summaries').select('total_value').eq('subscriber_id', sid).eq('local_date', today).maybeSingle(),
        supabase.from('user_daily_goals').select('target_value').eq('subscriber_id', sid).eq('target_date', today).maybeSingle(),
        supabase.from('rider_deliveries').select('*, rider_applications(current_lat, current_lng, last_active_at)').eq('subscriber_id', sid).eq('delivery_date', today).eq('status', 'pending').maybeSingle(),
        supabase.from('rider_deliveries').select('*', { count: 'exact', head: true }).eq('subscriber_id', sid).eq('status', 'delivered'),
        settsData?.current_menu_period ? supabase.from('weekly_menu_selections').select('*', { count: 'exact', head: true }).eq('subscriber_id', sid).eq('menu_period', settsData.current_menu_period) : Promise.resolve({ count: 0 })
      ]);

      const [activityRes, goalRes, deliveryRes, dCountRes, mCountRes] = results;

      setRhythmMetrics({
        steps: (activityRes.status === 'fulfilled' && !activityRes.value.error) ? activityRes.value.data?.total_value || 0 : 0,
        goal: (goalRes.status === 'fulfilled' && !goalRes.value.error) ? goalRes.value.data?.target_value || 10000 : 10000,
        streak: subData.current_streak || 0,
        points: subData.points_balance || 0
      });

      if (deliveryRes.status === 'fulfilled' && !deliveryRes.value.error) {
        const delivery = deliveryRes.value.data;
        setActiveDelivery(delivery);
        if (delivery?.rider_applications) {
          setRiderLocation({
            lat: delivery.rider_applications.current_lat,
            lng: delivery.rider_applications.current_lng
          });
        }
      }

      setDeliveryCount((dCountRes.status === 'fulfilled' && !dCountRes.value.error) ? dCountRes.value.count || 0 : 0);
      setMenuSelectionsCount((mCountRes.status === 'fulfilled' && !mCountRes.value.error) ? mCountRes.value.count || 0 : 0);

      setLoading(false);
    } catch (err) {
      console.error('Dashboard load failed:', err);
      if (retryCount < 2) {
        setTimeout(() => loadDashboardData(retryCount + 1), 2000);
      } else {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const isHardLocked = settings?.selection_deadline &&
    menuSelectionsCount === 0 &&
    (new Date(settings.selection_deadline).getTime() - new Date().getTime()) < 48 * 60 * 60 * 1000;

  useEffect(() => {
    if (isHardLocked && tab !== 'menu') {
      setTab('menu');
    }
  }, [isHardLocked, tab]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setTab('menu');
      // Clear the param without reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3EB] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#123F38]/10 border-t-[#C5A059] rounded-full animate-spin" />
      </div>
    );
  }

  if (!subscriber) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#F5F3EB]">
        <div className="w-24 h-24 rounded-full bg-[#123F38]/5 flex items-center justify-center mb-8">
          <Utensils className="w-10 h-10 text-[#123F38]" />
        </div>
        <h2 className="text-[#123F38] text-3xl font-black mb-4 tracking-tight uppercase italic">{t('access_restricted')}</h2>
        <p className="text-gray-500 text-lg mb-10 max-w-sm font-medium">
          {t('complete_consultation')}
        </p>
        <button
          onClick={() => navigate('/plans')}
          className="btn-primary w-full max-w-xs uppercase tracking-widest text-sm"
        >
          {t('nav_packages')}
        </button>
      </div>
    );
  }

  const progressPct = Math.min((rhythmMetrics.steps / rhythmMetrics.goal) * 100, 100);

  return (
    <div className={`min-h-screen bg-[#F5F3EB] py-32 sm:py-40 px-4 sm:px-6 md:px-12 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-[1400px] mx-auto space-y-24">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div>
            <div className="badge mb-8 bg-[#C5A059]/10 border-[#C5A059]/20 py-2 px-5">
              <Star className="w-3.5 h-3.5 fill-[#C5A059] animate-glow text-[#C5A059]" />
              <span className="font-black tracking-[0.4em] text-[10px] text-[#C5A059] uppercase">{t('member_dashboard')}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif italic text-[#123F38] leading-[0.95] tracking-tight truncate max-w-2xl">
              {subscriber.full_name || 'Member'}<br />
              <span className="text-[#C5A059] font-sans font-black uppercase not-italic tracking-tighter text-xl sm:text-3xl">Progress Tracker.</span>
            </h1>
          </div>
          <div className="flex bg-white/40 backdrop-blur-3xl rounded-[2.5rem] p-2 border border-[#123F38]/10 shadow-4xl overflow-x-auto no-scrollbar touch-pan-x">
            {(['menu', 'delivery', 'health', 'settings'] as const).map((tKey) => (
              <button
                key={tKey}
                onClick={() => setTab(tKey)}
                disabled={!!(isHardLocked && tKey !== 'menu')}
                className={`relative px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap ${
                  tab === tKey ? 'bg-[#123F38] !text-white shadow-3xl scale-105' : 'text-[#123F38] font-bold opacity-70 hover:opacity-100 hover:text-[#123F38]'
                } ${isHardLocked && tKey !== 'menu' ? 'opacity-20 cursor-not-allowed' : ''}`}
              >
                {t(tKey) || tKey.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        {/* My Rhythm Hero Section */}
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 sm:gap-12 items-stretch animate-reveal">
           <div className="p-8 sm:p-20 bg-primary text-white relative overflow-hidden shadow-4xl rounded-[3rem] sm:rounded-[4rem] group">
              <div className="absolute inset-0 bg-food-atmosphere opacity-5 grayscale pointer-events-none group-hover:scale-105 transition-transform duration-[10s]" />
              <div className="relative z-10 space-y-12 sm:space-y-16">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-gold text-[9px] sm:text-[10px] font-black uppercase tracking-[0.6em] mb-3 sm:mb-4">Momentum</p>
                       <h2 className="text-4xl sm:text-8xl font-serif italic tracking-tighter leading-none">Your Progress.</h2>
                    </div>
                    <div className="badge bg-gold/10 text-gold py-3 px-6 sm:py-4 sm:px-8 border border-gold/20 flex flex-col items-center min-w-[100px] sm:min-w-[120px]">
                       <span className="font-black text-2xl sm:text-3xl italic leading-none">{rhythmMetrics.streak}</span>
                       <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest mt-1 sm:mt-2">DAY STREAK</span>
                    </div>
                 </div>

                 <div className="space-y-8 sm:space-y-10">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                       <span className="text-6xl sm:text-8xl lg:text-[10rem] font-black italic tracking-tighter leading-none sm:leading-[0.8]">{rhythmMetrics.steps.toLocaleString()}</span>
                       <div className="pb-2 sm:pb-4 space-y-1 sm:space-y-2">
                          <p className="text-white/40 text-[10px] sm:text-sm font-black uppercase tracking-widest">Goal: {rhythmMetrics.goal.toLocaleString()}</p>
                          <div className="flex items-center gap-2 sm:gap-3">
                             <div className="w-2 h-2 rounded-full bg-gold animate-pulse shadow-[0_0_10px_#C5A059]" />
                             <p className="text-gold text-sm sm:text-lg font-black uppercase tracking-tighter italic">{Math.round(progressPct)}% DONE</p>
                          </div>
                       </div>
                    </div>
                    <div className="w-full bg-white/5 h-4 sm:h-5 rounded-full overflow-hidden p-1 shadow-inner relative border border-white/5">
                       <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="bg-gold h-full rounded-full shadow-[0_0_40px_rgba(197,160,89,0.8)] relative"
                       >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                       </motion.div>
                    </div>
                 </div>

                 <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-4">
                    <div className="flex items-center gap-2 sm:gap-3 bg-white/5 px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl border border-white/10 backdrop-blur-md">
                       <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                       <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white">Live Monitoring</span>
                    </div>
                    <button
                      onClick={() => {
                        setTab('menu');
                        // Use scrollIntoView with a small delay to allow the tab to switch
                        setTimeout(() => {
                          const el = document.getElementById('menu-anchor');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                             // Fallback to top if anchor not found
                             window.scrollTo({ top: 500, behavior: 'smooth' });
                          }
                        }, 100);
                      }}
                      className="flex items-center gap-2 sm:gap-3 bg-gold text-primary px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gold/20"
                    >
                       <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> CHOOSE FOOD
                    </button>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-10">
              <div className="glass-card p-12 bg-white/40 backdrop-blur-xl border-white/60 shadow-4xl group hover:border-[#C5A059] transition-all duration-700 flex flex-col justify-between">
                 <div className="flex justify-between items-start mb-10">
                    <div className="w-16 h-16 rounded-[2rem] bg-[#123F38] text-white flex items-center justify-center shadow-2xl group-hover:bg-[#C5A059] group-hover:text-[#123F38] transition-all duration-700">
                       <Trophy className="w-8 h-8" />
                    </div>
                    <div className="text-right">
                       <p className="text-[#123F38]/30 text-[9px] font-black uppercase tracking-widest mb-1">Asset Value</p>
                       <h4 className="text-4xl font-black text-[#123F38] italic tracking-tighter leading-none">{rhythmMetrics.points.toLocaleString()} <span className="text-[10px] not-italic opacity-40 ml-1">PTS</span></h4>
                    </div>
                 </div>
                 <p className="text-[#123F38]/50 text-xs italic leading-relaxed mb-8">Exchange your activity for premium rewards and upgrades.</p>
                 <button onClick={() => navigate('/rewards')} className="btn-primary w-full !py-5 text-[9px] tracking-[0.4em] flex items-center justify-center gap-3 hover:scale-105 active:scale-95">
                    ENTER THE VAULT <ArrowUpRight className="w-3.5 h-3.5" />
                 </button>
              </div>

              <div className="glass-card p-12 bg-[#123F38] text-white shadow-4xl relative overflow-hidden flex flex-col justify-between group hover:shadow-[#C5A059]/10 transition-all duration-700">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#C5A059]/20 transition-all" />
                 <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner border border-white/5">
                          <Users className="w-6 h-6 text-[#C5A059]" />
                       </div>
                       <div>
                          <p className="text-[#C5A059] text-[9px] font-black uppercase tracking-widest mb-1">Regional Tribe</p>
                          <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none truncate max-w-[180px]">{(subscriber as any)?.regional_community || 'Doha'} Collective</h4>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/40">
                          <span>Collective Momentum</span>
                          <span className="text-[#C5A059]">68%</span>
                       </div>
                       <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden p-[2px]">
                          <div className="bg-[#C5A059] h-full w-[68%] rounded-full shadow-[0_0_15px_#C5A059]" />
                       </div>
                       <button onClick={() => navigate('/community')} className="flex items-center gap-3 text-[#C5A059] hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] active:translate-x-2">
                          OPEN COMMUNICATIONS <ChevronRight className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            id="menu-anchor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {tab === 'menu' && <MenuSelection subscriber={subscriber} settings={settings} onUpdate={loadDashboardData} />}
            {tab === 'delivery' && <DeliverySettings subscriber={subscriber} activeDelivery={activeDelivery} riderLocation={riderLocation} onUpdate={loadDashboardData} />}
            {tab === 'health' && <HealthTab subscriber={subscriber} />}
            {tab === 'settings' && <PlanSettings subscriber={subscriber} onUpdate={loadDashboardData} updating={updating} setUpdating={setUpdating} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Concierge Support */}
      <div className="fixed bottom-6 right-6 sm:bottom-12 sm:right-12 flex flex-col gap-4 z-50">
         <a
           href="tel:+97466624942"
           className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-2xl shadow-4xl flex items-center justify-center hover:scale-110 transition-all border-2 border-white/20 active:scale-95"
         >
           <Phone className="w-6 h-6 sm:w-7 sm:h-7" />
         </a>
         <a
           href={`https://wa.me/97466624942?text=Hi, I'm ${subscriber.full_name || 'Member'} and I need assistance with my Triangle meal plan.`}
           target="_blank"
           rel="noopener noreferrer"
           className="w-14 h-14 sm:w-16 sm:h-16 bg-[#123F38] text-[#C5A059] rounded-2xl shadow-4xl flex items-center justify-center hover:scale-110 transition-all border-2 border-[#C5A059]/30 group active:scale-95"
         >
           <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform" />
         </a>
      </div>
    </div>
  );
}

function MenuSelection({ subscriber, settings, onUpdate }: { subscriber: Subscriber, settings: GlobalSettings | null, onUpdate: () => void }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selections, setSelections] = useState<MenuSelection[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t, isRtl } = useLanguage();

  const deadlineDate = settings?.selection_deadline ? new Date(settings.selection_deadline) : null;
  const daysRemaining = deadlineDate ? Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  const getWeekStart = (offset: number) => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (offset * 7);
    return new Date(today.setDate(diff)).toISOString().slice(0, 10);
  };

  const weekStart = getWeekStart(weekOffset);
  const availableMeals = PACKAGE_MEALS[subscriber.package_id] || ['breakfast', 'lunch', 'dinner'];

  const getMenuWeek = (dateStr: string) => {
    const start = new Date('2026-08-22');
    const current = new Date(dateStr);
    const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    return (Math.abs(diffWeeks) % 4) + 1;
  };

  const menuWeek = getMenuWeek(weekStart);

  const currentWeekMenu = WEEKLY_MENU.filter(d =>
    d.week === menuWeek &&
    d.collection === (settings?.active_season || 'summer')
  );

  const loadSelections = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('weekly_menu_selections')
      .select('day_of_week, meal_type, dish_name, dish_kcals, menu_period')
      .eq('subscriber_id', subscriber.id);

    if (settings?.current_menu_period) {
      query = query.eq('menu_period', settings.current_menu_period);
    } else {
      query = query.eq('week_start_date', weekStart);
    }

    const { data } = await query;
    setSelections(data as MenuSelection[] || []);
    setLoading(false);
  }, [subscriber.id, weekStart, settings?.current_menu_period]);

  useEffect(() => { loadSelections(); }, [loadSelections]);

  const pickDish = async (day: string, meal: string, dishName: string, dishKcals: number, isSkip = false) => {
    setSaving(true);
    const { error } = await supabase
      .from('weekly_menu_selections')
      .upsert({
        subscriber_id: subscriber.id,
        week_start_date: weekStart,
        day_of_week: day,
        meal_type: meal,
        dish_name: isSkip ? 'SKIP DAY' : dishName,
        dish_kcals: isSkip ? 0 : dishKcals,
        menu_period: settings?.current_menu_period
      }, { onConflict: 'subscriber_id,week_start_date,day_of_week,meal_type' });

    if (error) {
      alert(t('error_generic'));
    } else {
      await loadSelections();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onUpdate();
    }
    setSaving(false);
  };

  const applyWeeklyPattern = async (meal: string, dishName: string, dishKcals: number) => {
    if (!confirm(`Apply "${dishName}" to all days this week?`)) return;
    setSaving(true);
    const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const newSelections = days.map(day => ({
      subscriber_id: subscriber.id,
      week_start_date: weekStart,
      day_of_week: day,
      meal_type: meal,
      dish_name: dishName,
      dish_kcals: dishKcals,
      menu_period: settings?.current_menu_period
    }));

    const { error } = await supabase
      .from('weekly_menu_selections')
      .upsert(newSelections, { onConflict: 'subscriber_id,week_start_date,day_of_week,meal_type' });

    if (error) alert(t('error_generic'));
    else {
      await loadSelections();
      onUpdate();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-16">
      <div className="flex items-center justify-between bg-white/40 backdrop-blur-3xl border border-white/20 rounded-[3rem] p-8 shadow-3xl relative overflow-hidden">
        {daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0 && (
          <div className="absolute top-0 left-0 h-full w-2 bg-[#C5A059] animate-glow" />
        )}
        <button onClick={() => setWeekOffset(w => w - 1)} className="w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-[#123F38] hover:text-white transition-all active:scale-90"><ChevronLeft /></button>
        <div className="text-center">
          <p className="text-[#123F38] font-black text-xs uppercase tracking-[0.4em] mb-3">{weekOffset === 0 ? t('this_week') : t('next_week')}</p>
          <div className="flex items-center gap-4 justify-center">
             <div className="h-px w-8 bg-[#C5A059]/30" />
             <p className="text-[#C5A059] text-[10px] font-black uppercase tracking-[0.3em]">
               {daysRemaining !== null && daysRemaining > 0
                 ? `MANIFEST LOCKS IN: ${daysRemaining} DAYS`
                 : `${t('starting')} ${new Date(weekStart).toLocaleDateString()}`
               }
             </p>
             <div className="h-px w-8 bg-[#C5A059]/30" />
          </div>
        </div>
        <button onClick={() => setWeekOffset(w => Math.min(w + 1, 2))} className="w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-[#123F38] hover:text-white transition-all active:scale-90"><ChevronRight /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-10">
        {currentWeekMenu.sort((a, b) => {
          const order = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
          return order.indexOf(a.day) - order.indexOf(b.day);
        }).map(day => (
          <div key={day.day} className="p-4 sm:p-10 space-y-6 sm:space-y-10 border-b sm:border border-primary/5 sm:border-white/20 sm:bg-white/5 sm:backdrop-blur-xl sm:rounded-[3rem] transition-all group/day relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-primary/5 pb-4 sm:pb-6">
               <div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter text-primary">{t(day.day)}</h3>
                  <button
                    onClick={() => pickDish(day.day, 'lunch', '', 0, true)}
                    className="text-[9px] font-black text-red-500/40 hover:text-red-600 transition-colors mt-2 uppercase tracking-[0.3em]"
                  >
                    SKIP DAY
                  </button>
               </div>
               <div className="w-2 h-2 rounded-full bg-gold animate-glow" />
            </div>

            <div className="space-y-8 sm:space-y-12">
              {availableMeals.map(meal => {
                const sel = selections.find(s => s.day_of_week === day.day && s.meal_type === meal);
                const isSkipped = sel?.dish_name === 'SKIP DAY';
                const dishes = day.items[meal as keyof typeof day.items] || [];

                return (
                  <div key={meal} className={`space-y-4 sm:space-y-6 transition-all duration-700 ${isSkipped ? 'opacity-20 grayscale pointer-events-none scale-95' : ''}`}>
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">{t(meal)}</p>
                    </div>
                    {isSkipped ? (
                      <div className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-primary/5 border border-dashed border-primary/10 text-center">
                         <p className="text-[9px] sm:text-[10px] font-black text-primary/30 uppercase tracking-[0.4em] italic">Day Skipped</p>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:gap-4">
                        {dishes.map((d: any) => {
                          const matchingAllergen = d.allergens?.find((a: string) => subscriber.allergies?.includes(a));
                          const isSelected = sel?.dish_name === d.name;

                          return (
                            <div key={d.name} className="relative group/dish">
                              <button
                                onClick={() => !matchingAllergen && pickDish(day.day, meal, d.name, d.kcals)}
                                disabled={!!matchingAllergen}
                                className={`w-full p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] text-left border-2 transition-all duration-500 ${
                                  isSelected ? 'border-primary bg-primary text-white shadow-4xl scale-[1.02]' :
                                  matchingAllergen ? 'border-red-200 bg-red-50/20 text-red-300 cursor-not-allowed' :
                                  'border-primary/5 bg-white/40 hover:border-gold/30 text-primary'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="font-black text-xs sm:text-sm uppercase tracking-tight italic leading-tight">{isRtl && d.name_ar ? d.name_ar : d.name}</p>
                                  {matchingAllergen ? (
                                    <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse flex-shrink-0" />
                                  ) : (
                                    <ShieldCheck className="w-4 h-4 text-emerald-500 opacity-20 group-hover/dish:opacity-100 transition-opacity" />
                                  )}
                                  {isSelected && <CheckCircle className="w-5 h-5 text-gold animate-reveal" />}
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                   <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-gold' : 'text-primary/60'}`}>{d.kcals} KCAL</p>
                                   {matchingAllergen ? (
                                     <span className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1">
                                       <Activity className="w-2.5 h-2.5" /> {t('allergen_detected')}
                                     </span>
                                   ) : (
                                     <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${isSelected ? 'text-gold/60' : 'text-emerald-600/40'}`}>
                                       <Check className="w-2.5 h-2.5" /> SAFE
                                     </span>
                                   )}
                                </div>
                                {matchingAllergen && (
                                  <p className="text-[8px] font-black uppercase text-red-400 mt-3 tracking-widest italic flex items-center gap-2">
                                     <ShieldAlert className="w-3 h-3" /> NO: {matchingAllergen.toUpperCase()}
                                  </p>
                                )}
                              </button>
                              {isSelected && !matchingAllergen && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); applyWeeklyPattern(meal, d.name, d.kcals); }}
                                  className="absolute -right-3 -top-3 bg-gold text-[#123F38] p-2.5 rounded-2xl shadow-4xl hover:scale-110 transition-all opacity-0 group-hover/dish:opacity-100 z-10 border-4 border-[#F5F3EB]"
                                  title="Apply to all week"
                                >
                                  <Zap className="w-4 h-4 fill-[#123F38]" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeliverySettings({ subscriber, activeDelivery, riderLocation, onUpdate }: { subscriber: Subscriber; activeDelivery: any; riderLocation: any; onUpdate: () => void }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    building_number: subscriber.building_number || '',
    street: subscriber.street || '',
    area: subscriber.area || '',
    delivery_notes: subscriber.delivery_notes || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase.from('subscribers').update(form).eq('id', subscriber.id);
    setSaving(false);
    onUpdate();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-reveal">
      <div className="space-y-12">
         {/* Mission Status Header */}
         <div className={`glass-card p-12 border-none shadow-4xl relative overflow-hidden transition-all duration-1000 ${
           activeDelivery?.status === 'delivered' ? 'bg-emerald-500 text-white' : 'bg-[#123F38] text-white'
         }`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10">
               {activeDelivery?.status === 'delivered' ? (
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div>
                       <Shield className="w-20 h-20 text-white mb-10 animate-glow" />
                       <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Package Secured.</h3>
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          <p className="text-white font-black opacity-90 text-[10px] uppercase tracking-[0.3em]">
                            Mission Sync: {new Date(activeDelivery.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                       </div>
                    </div>
                    {activeDelivery.proof_image_url && (
                       <div className="relative group">
                          <img
                            src={activeDelivery.proof_image_url}
                            alt="Proof of Delivery"
                            className="w-40 h-40 md:w-56 md:h-56 object-cover rounded-[3rem] border-[6px] border-white shadow-4xl rotate-3 group-hover:rotate-0 transition-all duration-1000 cursor-zoom-in"
                            onClick={() => window.open(activeDelivery.proof_image_url, '_blank')}
                          />
                       </div>
                    )}
                 </div>
               ) : (
                 <>
                   <Truck className="w-16 h-16 text-[#C5A059] mb-10 animate-float" />
                   <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-4">{t('shipment_tracking')}</h3>
                   <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${activeDelivery ? 'bg-[#C5A059] animate-pulse' : 'bg-white/40'}`} />
                      <p className="text-white font-black opacity-70 text-[10px] uppercase tracking-[0.4em]">{activeDelivery ? t('rider_on_route') : t('no_active_deliveries')}</p>
                   </div>
                 </>
               )}
            </div>
         </div>

         <div className="space-y-10">
            <h3 className="text-xs font-black uppercase tracking-[0.5em] text-[#123F38]/60 ml-2">{t('shipment_details')}</h3>
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059]">{t('building')}</p>
                  <input type="text" value={form.building_number} onChange={e => setForm({...form, building_number: e.target.value})} className="input-field py-6 font-black text-lg bg-white/40" />
               </div>
               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059]">{t('street')}</p>
                  <input type="text" value={form.street} onChange={e => setForm({...form, street: e.target.value})} className="input-field py-6 font-black text-lg bg-white/40" />
               </div>
            </div>
            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059]">{t('area_zone')}</p>
               <input type="text" value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="input-field py-6 font-black text-lg bg-white/40" />
            </div>
            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059]">{t('shipment_instructions')}</p>
               <textarea value={form.delivery_notes} onChange={e => setForm({...form, delivery_notes: e.target.value})} className="input-field py-6 font-black min-h-[150px] bg-white/40" />
            </div>
            <button onClick={save} disabled={saving} className="btn-primary w-full py-8 scale-105 shadow-4xl active:scale-95">{saving ? <Loader2 className="animate-spin mx-auto text-white" /> : 'SAVE DETAILS'}</button>
         </div>
      </div>

      <div className="glass-card p-20 border-dashed border-[#123F38]/10 bg-white/5 flex flex-col items-center justify-center text-center opacity-40 group hover:opacity-100 transition-all duration-1000">
         <div className="w-32 h-32 rounded-[3rem] bg-[#123F38]/5 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
            <MapIcon className="w-16 h-16 text-[#123F38]" />
         </div>
         <p className="text-3xl font-black uppercase italic tracking-tighter text-[#123F38]">{t('full_gps')}</p>
         <div className="mt-6 flex items-center gap-4">
            <div className="h-px w-8 bg-[#C5A059]/30" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059]">Live Fleet Location</p>
            <div className="h-px w-8 bg-[#C5A059]/30" />
         </div>
      </div>
    </div>
  );
}

function PlanSettings({ subscriber, onUpdate, updating, setUpdating }: { subscriber: Subscriber, onUpdate: () => void, updating: boolean, setUpdating: (v: boolean) => void }) {
  const { signOut, user } = useAuth();
  const { t } = useLanguage();
  const [allergies, setAllergies] = useState<string[]>(subscriber.allergies || []);

  const toggleAllergy = (allergen: string) => {
    setAllergies(prev =>
      prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
    );
  };

  const saveAllergies = async () => {
    setUpdating(true);
    const { error } = await supabase.from('subscribers').update({ allergies }).eq('id', subscriber.id);
    if (error) alert(t('error_generic'));
    else {
      alert(t('safety_confirmed'));
      onUpdate();
    }
    setUpdating(false);
  };

  const togglePause = async () => {
    if (!subscriber) return;
    setUpdating(true);
    const nextStatus = subscriber.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase.from('subscribers').update({ status: nextStatus }).eq('id', subscriber.id);
    if (error) alert(t('error_generic'));
    else alert(`Subscription ${nextStatus === 'paused' ? 'Paused' : 'Resumed'} Successfully.`);
    setUpdating(false);
    onUpdate();
  };

  const requestDeletion = async () => {
    if (!confirm("Are you sure you want to request account deletion? This will terminate your subscription and remove your data according to our privacy policy.")) return;
    setUpdating(true);
    const { error } = await supabase.from('deletion_requests').insert({
      user_id: user?.id,
      email: user?.email,
      requested_at: new Date().toISOString()
    });
    if (error) alert(t('error_generic'));
    else {
      alert("Request received. Our team will process it within 30 days.");
      signOut();
    }
    setUpdating(false);
  };

  const ALLERGEN_LIST = ['Fish', 'Dairy', 'Eggs', 'Gluten', 'Seafood', 'Sesame', 'Nuts'];

  return (
    <div className="space-y-12 animate-reveal">
       {/* Biological Safety Hub */}
       <div className="glass-card p-12 sm:p-16 border-none shadow-4xl bg-[#123F38] text-white relative overflow-hidden rounded-[4rem]">
          <div className="absolute inset-0 bg-food-atmosphere opacity-5 grayscale pointer-events-none" />
          <div className="relative z-10 space-y-12">
             <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2.5rem] bg-[#C5A059]/20 flex items-center justify-center">
                   <Shield className="w-10 h-10 text-[#C5A059] animate-glow" />
                </div>
                <div>
                   <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-2">{t('safety_restrictions')}</h3>
                   <p className="text-[#C5A059]/60 text-[10px] font-black uppercase tracking-[0.4em]">Clinical Risk Mitigation Protocol</p>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {ALLERGEN_LIST.map((allergen) => {
                  const isActive = allergies.includes(allergen);
                  return (
                    <button
                      key={allergen}
                      onClick={() => toggleAllergy(allergen)}
                      className={`p-6 rounded-[2rem] border-2 transition-all duration-500 flex flex-col items-center gap-4 group ${
                        isActive ? 'bg-red-500 border-white shadow-2xl scale-105' : 'bg-white/5 border-white/10 hover:border-[#C5A059]/30'
                      }`}
                    >
                       <ShieldAlert className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/20 group-hover:text-[#C5A059]'}`} />
                       <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-white/40'}`}>{t(allergen.toLowerCase())}</span>
                    </button>
                  );
                })}
             </div>

             <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-8">
                <p className="text-[10px] font-medium italic text-white/40 max-w-xl">
                  {t('safety_desc_protocol')}
                </p>
                <button
                  onClick={saveAllergies}
                  disabled={updating}
                  className="btn-primary !bg-[#C5A059] !text-[#123F38] px-12 py-5 shadow-2xl active:scale-95 whitespace-nowrap"
                >
                  {updating ? 'SYNCING...' : t('modify_restrictions')}
                </button>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="glass-card p-16 border-white/20 bg-white/5 group">
             <div className="w-20 h-20 rounded-[2.5rem] bg-[#123F38]/10 flex items-center justify-center mb-10 group-hover:bg-[#C5A059] transition-all duration-700">
                <RefreshCcw className="w-10 h-10 text-[#C5A059] group-hover:text-[#123F38] transition-colors" />
             </div>
             <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-6 text-[#123F38]">{t('subscription_control')}</h3>
             <p className="text-[#123F38] font-black opacity-80 text-lg italic mb-12 leading-relaxed">{t('pause_desc')}</p>
             <button onClick={togglePause} disabled={updating} className={`btn-primary w-full py-8 text-[11px] tracking-[0.4em] active:scale-95 ${subscriber.status === 'active' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {updating ? 'SYNCING...' : subscriber.status === 'active' ? t('pause_plan') : t('resume_now')}
             </button>
          </div>

          <div className="glass-card p-16 border-red-500/10 bg-red-50/5 group">
             <div className="w-20 h-20 rounded-[2.5rem] bg-red-50/50 flex items-center justify-center mb-10 group-hover:bg-red-600 transition-all duration-700">
                <Trash2 className="w-10 h-10 text-red-500 group-hover:text-white transition-colors" />
             </div>
             <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-6 text-red-600">Account Safety</h3>
             <p className="text-[#123F38] font-black opacity-80 text-lg italic mb-12 leading-relaxed">Requesting account deletion will terminate your active subscription protocols and remove your biological data from our secure cloud within 30 days.</p>
             <button onClick={requestDeletion} disabled={updating} className="flex items-center gap-4 text-red-600 font-black uppercase tracking-[0.3em] text-[10px] hover:text-red-700 transition-all group/btn active:scale-95">
                <Trash2 className="w-8 h-8 group-hover/btn:rotate-12 transition-transform" /> {updating ? 'PROCESSING...' : t('request_account_deletion')}
             </button>
          </div>
       </div>
    </div>
  );
}
