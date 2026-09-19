import { useState, useEffect, useCallback } from 'react';
import {
  Plus, LogOut, Utensils, Truck, Activity, X, Loader2, Heart,
  Moon, Sun, Coffee, Brain, Zap, Map as MapIcon, Share2, Award,
  ShieldAlert, Phone, Clock, Trash2, ChevronLeft, ChevronRight, Check,
  Package, MapPin, CheckCircle, CheckCircle2, Circle, Timer, XCircle, Camera, MessageCircle, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PACKAGES } from '@/types/booking';
import {
  DELIVERY_WINDOWS, PACKAGE_MEALS,
  type Subscriber, type ProgressEntry, type MenuSelection, type GlobalSettings,
} from '@/types/subscription';
import { WEEKLY_MENU } from '@/data/menu';
import HealthTab from '@/components/HealthTab';
import { useLanguage } from '@/lib/LanguageContext';

type Tab = 'menu' | 'delivery' | 'health' | 'settings';

export default function SubscriberDashboard() {
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
  const [activityData, setActivityData] = useState<{ steps: number, goal: number, streak: number[] }>({ steps: 0, goal: 10000, streak: [] });

  const loadDashboardData = useCallback(async (retryCount = 0) => {
    if (!user) return;
    setLoading(true);

    try {
      const [{ data: subData }, { data: settsData }] = await Promise.all([
        supabase.from('subscribers')
          .select('*, preferred_region:regional_communities(name, image_url)')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('global_settings').select('*').single(),
      ]);

      setSubscriber(subData as Subscriber | null);
      const settings = settsData as GlobalSettings;
      setSettings(settings);

      if (subData) {
        const sid = subData.id;
        const today = new Date().toISOString().split('T')[0];

        // Fetch activity data
        const [
          { data: goalData },
          { data: summaryData },
          { data: delivery },
          { count: dCount },
          { count: mCount }
        ] = await Promise.all([
          supabase.from('user_daily_goals').select('goal_value').eq('subscriber_id', sid).eq('goal_type', 'steps').maybeSingle(),
          supabase.from('daily_activity_summaries').select('steps_count').eq('subscriber_id', sid).eq('date', today).maybeSingle(),
          supabase
            .from('rider_deliveries')
            .select('*, rider_applications(current_lat, current_lng, last_active_at)')
            .eq('subscriber_id', sid)
            .eq('delivery_date', today)
            .eq('status', 'pending')
            .maybeSingle(),
          supabase
            .from('rider_deliveries')
            .select('*', { count: 'exact', head: true })
            .eq('subscriber_id', sid)
            .eq('status', 'delivered'),
          settings.current_menu_period ? supabase
            .from('weekly_menu_selections')
            .select('*', { count: 'exact', head: true })
            .eq('subscriber_id', sid)
            .eq('menu_period', settings.current_menu_period) : Promise.resolve({ count: null })
        ]);

        setActivityData({
          steps: summaryData?.steps_count || 0,
          goal: goalData?.goal_value || 10000,
          streak: subData.streak_history || [1, 1, 1, 1, 0, 0, 0] // Mocking history if not present
        });

        setActiveDelivery(delivery);
        if (delivery?.rider_applications) {
          setRiderLocation({
            lat: delivery.rider_applications.current_lat,
            lng: delivery.rider_applications.current_lng
          });
        }
        setDeliveryCount(dCount || 0);
        setMenuSelectionsCount(mCount || 0);
      }
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
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!subscriber) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#FDFCF7]">
        <div className="w-24 h-24 rounded-full bg-[#0a3030]/5 flex items-center justify-center mb-8">
          <Utensils className="w-10 h-10 text-[#0a3030]" />
        </div>
        <h2 className="text-[#0a3030] text-3xl font-black mb-4 tracking-tight uppercase italic">{t('access_restricted')}</h2>
        <p className="text-gray-500 text-lg mb-10 max-w-sm font-medium">
          {t('complete_consultation')}
        </p>
        <button
          onClick={() => window.location.href = '/plans'}
          className="btn-primary w-full max-w-xs uppercase tracking-widest text-sm"
        >
          {t('nav_packages')}
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background py-28 sm:py-32 px-4 sm:px-6 md:px-12 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-12 sm:mb-20">
          <div>
            <div className="badge mb-6"><Package className="w-3 h-3 fill-gold" /><span>{t('member_dashboard')}</span></div>
            <h1 className="text-4xl sm:text-6xl font-black text-primary leading-none tracking-tighter uppercase italic truncate max-w-md">
              {subscriber.full_name || 'Member'}<br />
              <span className="text-sage">{t('progress')}.</span>
            </h1>
            <p className="text-[#C5A059] text-[10px] font-black mt-4 uppercase tracking-[0.4em]">{t(subscriber.package_id) || subscriber.package_name} {t('access')}</p>
          </div>
          <div className="flex bg-white/40 backdrop-blur-xl rounded-[2rem] p-1.5 border border-primary/5 shadow-2xl overflow-x-auto no-scrollbar touch-pan-x">
            {(['menu', 'delivery', 'health', 'settings'] as const).map((tKey) => (
              <button
                key={tKey}
                onClick={() => setTab(tKey)}
                disabled={isHardLocked && tKey !== 'menu'}
                className={`relative px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  tab === tKey ? 'bg-teal text-white shadow-xl' : 'text-primary/40 hover:text-primary'
                } ${isHardLocked && tKey !== 'menu' ? 'opacity-20 cursor-not-allowed' : ''}`}
              >
                {t(tKey) || tKey.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        {/* My Rhythm Integration: Hero Goal & Streak */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20 animate-reveal">
          <div className="lg:col-span-2">
            <div className="bg-[#1A2E2E] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl h-full">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059] opacity-80">{t('daily_activity') || 'Daily Activity'}</span>
                    <h2 className="text-3xl font-serif mt-1" style={{ fontFamily: "'DM Serif Display', serif" }}>{t('keep_the_pace') || 'Keep the pace'}</h2>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl">
                    <Activity className="w-5 h-5 text-[#C5A059]" />
                  </div>
                </div>

                <div className="flex items-end gap-4 mb-6">
                  <span className="text-6xl font-serif" style={{ fontFamily: "'DM Serif Display', serif" }}>{activityData.steps.toLocaleString()}</span>
                  <span className="text-white/60 font-sans mb-2 uppercase tracking-widest text-xs">{t('steps') || 'Steps'}</span>
                </div>

                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-8">
                  <div
                    className="bg-[#C5A059] h-full rounded-full shadow-[0_0_15px_rgba(197,160,89,0.5)] transition-all duration-1000"
                    style={{ width: `${Math.min((activityData.steps / activityData.goal) * 100, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-sm font-sans text-white/80">{t('goal') || 'Goal'}: {activityData.goal.toLocaleString()} {t('steps') || 'steps'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                       <p className="text-[10px] font-black uppercase tracking-widest text-[#C5A059]">{subscriber.points_balance?.toLocaleString() || 0} PTS</p>
                       <p className="text-[8px] text-white/40 uppercase tracking-widest">Balance</p>
                    </div>
                    <button
                      onClick={() => loadDashboardData()}
                      className="bg-[#C5A059] text-[#1A2E2E] px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                      {t('sync_now') || 'Sync Now'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-[#2D4B4B] rounded-full blur-[80px] opacity-40" />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-primary/5 shadow-xl flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-xl text-[#1A2E2E]" style={{ fontFamily: "'DM Serif Display', serif" }}>{t('weekly_streak') || 'Weekly Streak'}</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059]">{subscriber.current_streak || 0} {t('days') || 'Days'}</span>
            </div>

            <div className="flex justify-between gap-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                const isActive = activityData.streak[i] === 1;
                const isToday = i === (new Date().getDay() + 6) % 7; // Adjust for Monday start

                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <span className="text-[8px] font-black text-primary/30">{day}</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isActive ? 'bg-[#8AA694]/20 text-[#8AA694]' :
                      isToday ? 'bg-[#C5A059] text-white shadow-lg' :
                      'bg-primary/5 text-primary/20'
                    }`}>
                      {isActive ? <CheckCircle2 className="w-4 h-4" /> : isToday ? <Circle className="w-4 h-4 animate-pulse" /> : <Circle className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-[#FDFCF7] border border-primary/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] mb-1">{t('next_milestone') || 'Next Milestone'}</p>
              <p className="text-xs font-medium text-primary/60">
                {subscriber.current_streak >= 7
                  ? "You're on fire! Keep the momentum for exclusive rewards."
                  : `Complete today's rhythm to earn ${50} bonus points.`
                }
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
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
      <div className="fixed bottom-12 right-12 flex flex-col gap-4 z-50">
         <a
           href="tel:+97466624942"
           className="w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-4xl flex items-center justify-center hover:scale-110 transition-all border-2 border-white/20"
         >
           <Phone className="w-7 h-7" />
         </a>
         <a
           href={`https://wa.me/97466624942?text=Hi, I'm ${subscriber.full_name || 'Member'} and I need assistance with my Triangle meal plan.`}
           target="_blank"
           rel="noopener noreferrer"
           className="w-16 h-16 bg-[#0a3030] text-[#C5A059] rounded-2xl shadow-4xl flex items-center justify-center hover:scale-110 transition-all border-2 border-[#C5A059]/30 group"
         >
           <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
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
    <div className="space-y-12">
      <div className="flex items-center justify-between bg-white border border-primary/5 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden">
        {daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0 && (
          <div className="absolute top-0 left-0 h-full w-1.5 bg-gold animate-pulse" />
        )}
        <button onClick={() => setWeekOffset(w => w - 1)} className="p-4 rounded-2xl hover:bg-gray-50 transition-colors"><ChevronLeft /></button>
        <div className="text-center">
          <p className="text-primary font-black text-sm uppercase tracking-widest">{weekOffset === 0 ? t('this_week') : t('next_week')}</p>
          <p className="text-gold text-[10px] font-black uppercase mt-2 tracking-widest">
            {daysRemaining !== null && daysRemaining > 0
              ? `DEADLINE: ${daysRemaining} DAYS REMAINING`
              : `${t('starting')} ${new Date(weekStart).toLocaleDateString()}`
            }
          </p>
        </div>
        <button onClick={() => setWeekOffset(w => Math.min(w + 1, 2))} className="p-4 rounded-2xl hover:bg-gray-50 transition-colors"><ChevronRight /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {currentWeekMenu.sort((a, b) => {
          const order = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
          return order.indexOf(a.day) - order.indexOf(b.day);
        }).map(day => (
          <div key={day.day} className="glass-card p-8 space-y-8 border-primary/5 hover:border-teal/20 transition-all group/day relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-primary/5 pb-4">
               <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-primary">{t(day.day)}</h3>
                  <button
                    onClick={() => pickDish(day.day, 'lunch', '', 0, true)}
                    className="text-[8px] font-black text-red-400 hover:text-red-600 transition-colors mt-1 uppercase tracking-widest"
                  >
                    SKIP THIS DAY
                  </button>
               </div>
               <div className="w-2 h-2 rounded-full bg-gold/30" />
            </div>

            <div className="space-y-10">
              {availableMeals.map(meal => {
                const sel = selections.find(s => s.day_of_week === day.day && s.meal_type === meal);
                const isSkipped = sel?.dish_name === 'SKIP DAY';
                const dishes = day.items[meal as keyof typeof day.items] || [];

                return (
                  <div key={meal} className={`space-y-4 transition-opacity ${isSkipped ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">{t(meal)}</p>
                    </div>
                    {isSkipped ? (
                      <div className="p-4 rounded-2xl bg-red-50/50 border border-dashed border-red-200 text-center">
                         <p className="text-[9px] font-black text-red-400 uppercase tracking-widest italic">Day Skipped</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {dishes.map(d => {
                          const hasAllergy = d.allergens?.some(a => subscriber.allergies?.includes(a));
                          const isSelected = sel?.dish_name === d.name;

                          return (
                            <div key={d.name} className="relative group/dish">
                              <button
                                onClick={() => !hasAllergy && pickDish(day.day, meal, d.name, d.kcals)}
                                disabled={hasAllergy}
                                className={`w-full p-4 rounded-2xl text-left border-2 transition-all ${
                                  isSelected ? 'border-teal bg-teal text-white shadow-lg' :
                                  hasAllergy ? 'border-red-500 bg-red-50 text-red-500 cursor-not-allowed opacity-60' :
                                  'border-primary/5 bg-white/40 hover:border-teal/20 text-primary'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-black text-sm uppercase tracking-tight">{isRtl && d.name_ar ? d.name_ar : d.name}</p>
                                  {hasAllergy ? <ShieldAlert className="w-4 h-4 text-red-600" /> : isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                </div>
                                <p className={`text-[10px] font-bold mt-1 ${isSelected ? 'opacity-60' : 'opacity-40'}`}>{d.kcals} KCAL</p>

                                {hasAllergy ? (
                                  <div className="mt-4 p-2 bg-red-600 text-white rounded-xl text-center">
                                    <p className="text-[9px] font-black uppercase tracking-tighter">
                                      WARNING: Contains {d.allergens?.filter(a => subscriber.allergies?.includes(a)).join(', ')}. NOT SAFE FOR YOU.
                                    </p>
                                  </div>
                                ) : (
                                  <div className={`mt-4 p-2 rounded-xl text-center ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-500 text-white'}`}>
                                    <p className="text-[9px] font-black uppercase tracking-tighter">
                                      SAFE FOR YOU
                                    </p>
                                  </div>
                                )}
                              </button>
                              {isSelected && !hasAllergy && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); applyWeeklyPattern(meal, d.name, d.kcals); }}
                                  className="absolute -right-2 -top-2 bg-gold text-primary p-1.5 rounded-lg shadow-xl hover:scale-110 transition-all opacity-0 group-hover/dish:opacity-100 z-10"
                                  title="Apply to all week"
                                >
                                  <Zap className="w-3 h-3 fill-primary" />
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
      <div className="space-y-10">
         {/* Mission Status Header */}
         <div className={`glass-card p-10 border-none shadow-3xl relative overflow-hidden transition-all duration-1000 ${
           activeDelivery?.status === 'delivered' ? 'bg-emerald-500 text-white' : 'bg-[#0a3030] text-white'
         }`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
            <div className="relative z-10">
               {activeDelivery?.status === 'delivered' ? (
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                       <Shield className="w-16 h-16 text-white mb-8 animate-reveal" />
                       <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Package Secured.</h3>
                       <p className="text-white/80 text-[10px] font-black uppercase tracking-widest">
                         Mission Synchronized at {new Date(activeDelivery.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </div>
                    {activeDelivery.proof_image_url && (
                       <div className="relative group">
                          <img
                            src={activeDelivery.proof_image_url}
                            alt="Proof of Delivery"
                            className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-3xl border-4 border-white shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500 cursor-zoom-in"
                            onClick={() => window.open(activeDelivery.proof_image_url, '_blank')}
                          />
                          <div className="absolute -top-3 -right-3 bg-white text-emerald-500 p-2 rounded-full shadow-xl">
                             <Camera className="w-4 h-4" />
                          </div>
                       </div>
                    )}
                 </div>
               ) : (
                 <>
                   <Truck className="w-12 h-12 text-[#C5A059] mb-8" />
                   <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">{t('shipment_tracking')}</h3>
                   <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{activeDelivery ? t('rider_on_route') : t('no_active_deliveries')}</p>
                 </>
               )}
            </div>
         </div>

         <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary/40 ml-2">{t('shipment_details')}</h3>
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">{t('building')}</p>
                  <input type="text" value={form.building_number} onChange={e => setForm({...form, building_number: e.target.value})} className="input-field py-4 font-black" />
               </div>
               <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">{t('street')}</p>
                  <input type="text" value={form.street} onChange={e => setForm({...form, street: e.target.value})} className="input-field py-4 font-black" />
               </div>
            </div>
            <div className="space-y-3">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted">{t('area_zone')}</p>
               <input type="text" value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="input-field py-4 font-black" />
            </div>
            <div className="space-y-3">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted">{t('shipment_instructions')}</p>
               <textarea value={form.delivery_notes} onChange={e => setForm({...form, delivery_notes: e.target.value})} className="input-field py-4 font-black min-h-[100px]" />
            </div>
            <button onClick={save} disabled={saving} className="btn-primary w-full py-6 uppercase tracking-widest">{saving ? <Loader2 className="animate-spin mx-auto" /> : t('cloud_synced')}</button>
         </div>
      </div>

      <div className="glass-card p-10 border-dashed border-primary/10 bg-transparent flex flex-col items-center justify-center text-center opacity-40">
         <MapIcon className="w-20 h-20 mb-8" />
         <p className="text-xl font-black uppercase italic tracking-tighter">{t('full_gps')}</p>
         <p className="text-xs font-medium uppercase mt-4 tracking-widest">Live Fleet Location Protocol</p>
      </div>
    </div>
  );
}

function PlanSettings({ subscriber, onUpdate, updating, setUpdating }: { subscriber: Subscriber, onUpdate: () => void, updating: boolean, setUpdating: (v: boolean) => void }) {
  const { signOut, user } = useAuth();
  const { t } = useLanguage();

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
       <div className="glass-card p-12 border-primary/5 bg-white/40">
          <Shield className="w-12 h-12 text-teal mb-8" />
          <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">{t('subscription_control')}</h3>
          <p className="text-muted text-lg italic mb-10 leading-relaxed">{t('pause_desc')}</p>
          <button onClick={togglePause} disabled={updating} className={`btn-primary w-full py-6 uppercase tracking-widest ${subscriber.status === 'active' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
             {updating ? '...' : subscriber.status === 'active' ? t('pause_plan') : t('resume_now')}
          </button>
       </div>

       <div className="glass-card p-12 border-red-500/10 bg-red-50/5">
          <ShieldAlert className="w-12 h-12 text-red-500 mb-8" />
          <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-red-500">Account Safety</h3>
          <p className="text-muted text-lg italic mb-10 leading-relaxed">Requesting account deletion will terminate your active subscription protocols and remove your biological data from our secure cloud within 30 days.</p>
          <button onClick={requestDeletion} disabled={updating} className="flex items-center gap-3 text-red-500 font-black uppercase tracking-[0.2em] text-[10px] hover:text-red-700 transition-colors">
             <Trash2 className="w-6 h-6" /> {updating ? 'PROCESSING...' : t('request_account_deletion')}
          </button>
       </div>
    </div>
  );
}
