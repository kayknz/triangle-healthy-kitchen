import { useState, useEffect, useCallback } from 'react';
import {
  Plus, LogOut, Utensils, Truck, Activity, X, Loader2, Heart,
  Moon, Sun, Coffee, Brain, Zap, Map as MapIcon, Share2, Award,
  ShieldAlert, Phone, Clock, Trash2, ChevronLeft, ChevronRight, Check,
  Package, MapPin, CheckCircle, CheckCircle2, Circle, Timer, XCircle, Camera, MessageCircle, Shield, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PACKAGES } from '@/types/booking';
import {
  DELIVERY_WINDOWS, PACKAGE_MEALS,
  type Subscriber, type ProgressEntry, type MenuSelection, type GlobalSettings, type MenuDish, type Ingredient
} from '@/types/subscription';
import { WEEKLY_MENU } from '@/data/menu';
import HealthTab from '@/components/HealthTab';
import { useLanguage } from '@/lib/LanguageContext';
import { BUSINESS_RULES } from '@/config/business';
import { getQatarDate, getQatarDayOfWeek, addDays, getDaysRemaining } from '@/lib/date-utils';

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
        const today = getQatarDate();

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

  const isHardLocked = !!(settings?.selection_deadline &&
    menuSelectionsCount === 0 &&
    (new Date(settings.selection_deadline).getTime() - new Date().getTime()) < BUSINESS_RULES.MENU_LOCK_WINDOW);

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
                const isToday = i === (getQatarDayOfWeek() + 6) % 7; // Adjust for Monday start

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
                {(subscriber.current_streak || 0) >= 7
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
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [menuWeek, setMenuWeek] = useState<number>(1);
  const [selections, setSelections] = useState<MenuSelection[]>([]);
  const [availableMenu, setAvailableMenu] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aboutMeal, setAboutMeal] = useState<MenuDish | null>(null);
  const [customizingMeal, setCustomizingMeal] = useState<{dish: MenuDish, meal: string} | null>(null);
  const { t, isRtl } = useLanguage();

  const daysRemaining = settings?.selection_deadline ? getDaysRemaining(settings.selection_deadline) : null;
  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

  const getWeekStart = (offset: number) => {
    const today = new Date();
    const day = getQatarDayOfWeek(today);
    const qatarDateStr = getQatarDate(today);
    const qatarDate = new Date(qatarDateStr + 'T12:00:00');
    const diff = offset * 7 - day;
    return getQatarDate(addDays(qatarDate, diff));
  };

  const weekStart = getWeekStart(weekOffset);
  const availableMeals = PACKAGE_MEALS[subscriber.package_id] || ['breakfast', 'lunch', 'dinner', 'snacks'];

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Authoritative Week
      const { data: week } = await supabase.rpc('get_current_qatar_week');
      setMenuWeek(week || 1);

      // 2. Fetch Availability from DB
      const { data: menuData } = await supabase
        .from('menu_availability')
        .select('*, dishes(*, ingredients(*))')
        .eq('week_number', week || 1)
        .eq('collection', settings?.active_season || 'autumn')
        .eq('is_active', true);

      // Group by day for easier UI consumption
      const grouped = days.map(d => ({
        day: d,
        items: {
          breakfast: menuData?.filter(m => m.day_of_week === d && m.meal_period === 'breakfast').map(m => m.dishes) || [],
          lunch: menuData?.filter(m => m.day_of_week === d && m.meal_period === 'lunch').map(m => m.dishes) || [],
          dinner: menuData?.filter(m => m.day_of_week === d && m.meal_period === 'dinner').map(m => m.dishes) || [],
          snacks: menuData?.filter(m => m.day_of_week === d && m.meal_period === 'snacks').map(m => m.dishes) || [],
        }
      }));
      setAvailableMenu(grouped);

      // 3. Fetch User Selections
      let selQuery = supabase
        .from('weekly_menu_selections')
        .select('day_of_week, meal_type, dish_name, dish_kcals, menu_period, customizations, dish_id')
        .eq('subscriber_id', subscriber.id);

      if (settings?.current_menu_period) {
        selQuery = selQuery.eq('menu_period', settings.current_menu_period);
      } else {
        selQuery = selQuery.eq('week_start_date', weekStart);
      }

      const { data: selData } = await selQuery;
      setSelections(selData as MenuSelection[] || []);
    } catch (e) {
      console.error('Menu Sync Failure:', e);
    } finally {
      setLoading(false);
    }
  }, [subscriber.id, weekStart, settings?.active_season, settings?.current_menu_period]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  const activeDay = availableMenu.find(d => d.day === days[activeDayIndex]);

  const pickDish = async (day: string, meal: string, dish: MenuDish, customizations = {}) => {
    setSaving(true);
    const { error } = await supabase
      .from('weekly_menu_selections')
      .upsert({
        subscriber_id: subscriber.id,
        week_start_date: weekStart,
        day_of_week: day,
        meal_type: meal,
        dish_id: dish.id,
        dish_name: dish.name,
        dish_kcals: dish.kcals,
        customizations,
        menu_period: settings?.current_menu_period
      }, { onConflict: 'subscriber_id,week_start_date,day_of_week,meal_type' });

    if (!error) {
      await loadMenu();
      onUpdate();
    }
    setSaving(false);
    setCustomizingMeal(null);
  };

  const skipEntireDay = async (day: string) => {
    if (!confirm(`Skip all meals for ${t(day)}?`)) return;
    setSaving(true);
    const skipSelections = availableMeals.map(meal => ({
      subscriber_id: subscriber.id,
      week_start_date: weekStart,
      day_of_week: day,
      meal_type: meal,
      dish_name: 'SKIP DAY',
      dish_kcals: 0,
      menu_period: settings?.current_menu_period
    }));
    await supabase.from('weekly_menu_selections').upsert(skipSelections, { onConflict: 'subscriber_id,week_start_date,day_of_week,meal_type' });
    await loadMenu();
    setSaving(false);
  };

  const applyWeeklyPattern = async (meal: string, dish: MenuDish) => {
    if (!confirm(`Apply "${dish.name}" to all days this week?`)) return;
    setSaving(true);
    const newSelections = days.map(day => ({
      subscriber_id: subscriber.id,
      week_start_date: weekStart,
      day_of_week: day,
      meal_type: meal,
      dish_id: dish.id,
      dish_name: dish.name,
      dish_kcals: dish.kcals,
      menu_period: settings?.current_menu_period
    }));
    await supabase.from('weekly_menu_selections').upsert(newSelections, { onConflict: 'subscriber_id,week_start_date,day_of_week,meal_type' });
    await loadMenu();
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Week Selector */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-primary/5 shadow-lg">
        <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} className="p-2 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5"/></button>
        <div className="text-center">
          <p className="text-primary font-black text-[10px] uppercase tracking-[0.2em]">{weekOffset === 0 ? t('this_week') : t('next_week')}</p>
          <p className="text-gold text-[8px] font-bold mt-0.5 uppercase tracking-widest">Cycle W{menuWeek}</p>
        </div>
        <button onClick={() => setWeekOffset(w => Math.min(w + 1, 2))} className="p-2 rounded-lg hover:bg-gray-50"><ChevronRight className="w-5 h-5"/></button>
      </div>

      {/* 2. Compact Day Tabs */}
      <div className="flex bg-white/40 backdrop-blur-xl p-1 rounded-xl border border-primary/5 shadow-sm overflow-x-auto no-scrollbar">
        {days.map((day, idx) => (
          <button
            key={day}
            onClick={() => setActiveDayIndex(idx)}
            className={`flex-1 min-w-[70px] py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              activeDayIndex === idx ? 'bg-primary text-white shadow-sm' : 'text-primary/40'
            }`}
          >
            {t(day.substring(0, 3))}
          </button>
        ))}
      </div>

      {/* 3. Compact Meal List */}
      <div className="space-y-4 animate-reveal">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-lg font-black uppercase italic tracking-tighter text-primary">{t(days[activeDayIndex])}</h3>
           <button onClick={() => skipEntireDay(days[activeDayIndex])} className="text-[8px] font-black text-red-400 uppercase tracking-widest underline underline-offset-4">Skip Day</button>
        </div>

        <div className="space-y-6">
          {availableMeals.map(mealType => {
            const sel = selections.find(s => s.day_of_week === days[activeDayIndex] && s.meal_type === mealType);
            const dishes = activeDay?.items[mealType as keyof typeof activeDay.items] || [];
            const isSkipped = sel?.dish_name === 'SKIP DAY';

            if (dishes.length === 0) return null;

            return (
              <section key={mealType} className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gold">{t(mealType)}</p>
                   <div className="h-px flex-1 bg-primary/5" />
                   {isSkipped && <span className="text-[7px] font-black text-red-500 uppercase tracking-widest">SKIPPED</span>}
                </div>

                <div className="space-y-2">
                  {dishes.map((dish: MenuDish) => {
                    const sel = selections.find(s => s.day_of_week === days[activeDayIndex] && s.meal_type === mealType);
                    const isSelected = sel?.dish_id === dish.id || sel?.dish_name === dish.name;
                    const hasAllergy = dish.allergens?.some((a: string) => subscriber.allergies?.includes(a));

                    return (
                      <div key={dish.id} className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all ${
                        isSelected ? 'border-teal bg-teal/5' : 'border-primary/5 bg-white'
                      } ${hasAllergy ? 'opacity-30 grayscale pointer-events-none' : ''}`}>

                        <div className="flex items-start justify-between gap-4">
                           <div className="flex-1 min-w-0">
                              <h4 className="font-serif italic text-base text-primary leading-tight truncate">{isRtl ? dish.name_ar : dish.name}</h4>
                              <div className="flex gap-3 mt-1">
                                 <span className="text-[8px] font-bold text-primary/30 uppercase">{dish.kcals} KCAL</span>
                                 {dish.macros && <span className="text-[8px] font-bold text-gold uppercase">P:{dish.macros.protein} C:{dish.macros.carbs}</span>}
                              </div>
                           </div>
                           {isSelected && <CheckCircle className="w-4 h-4 text-teal fill-teal/10 shrink-0" />}
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                           <button onClick={() => setAboutMeal(dish)} className="flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-primary/5 hover:bg-primary/5">About</button>
                           <button onClick={() => setCustomizingMeal({dish, meal: mealType})} className="flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-gold/10 text-gold hover:bg-gold/5">Personalize</button>
                           <button
                             onClick={() => pickDish(days[activeDayIndex], mealType, dish)}
                             className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                               isSelected ? 'bg-gold text-primary' : 'bg-primary/5 text-primary/60'
                             }`}
                           >
                             {isSelected ? 'Active' : 'Select'}
                           </button>
                        </div>

                        {isSelected && !hasAllergy && (
                          <button
                            onClick={(e) => { e.stopPropagation(); applyWeeklyPattern(mealType, dish); }}
                            className="absolute -right-2 -top-2 bg-gold text-primary p-1.5 rounded-lg shadow-lg border-2 border-white"
                          >
                            <Zap className="w-3 h-3 fill-primary" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Modals Re-implementation with higher density */}
      <AnimatePresence>
        {aboutMeal && <AboutMealModal dish={aboutMeal} isRtl={isRtl} onClose={() => setAboutMeal(null)} />}
        {customizingMeal && (
          <CustomizeMealModal
            dish={customizingMeal.dish}
            mealType={customizingMeal.meal}
            day={days[activeDayIndex]}
            subscriber={subscriber}
            onClose={() => setCustomizingMeal(null)}
            onSave={(customs) => pickDish(days[activeDayIndex], customizingMeal.meal, customizingMeal.dish, customs)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AboutMealModal({ dish, isRtl, onClose }: { dish: MenuDish, isRtl: boolean, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-primary/40 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#FDFCF7] w-full max-w-2xl max-h-[85vh] rounded-[3rem] shadow-4xl overflow-hidden flex flex-col border border-white/40">
         <div className="p-10 border-b border-primary/5 flex items-center justify-between bg-white/40">
            <div>
               <span className="text-[10px] font-black text-gold uppercase tracking-[0.4em] mb-2 block">Meal Intel</span>
               <h2 className="text-3xl font-black text-primary uppercase italic tracking-tighter">{isRtl ? dish.name_ar : dish.name}</h2>
            </div>
            <button onClick={onClose} className="p-4 hover:bg-primary/5 rounded-full transition-colors"><X className="w-8 h-8 text-primary/20" /></button>
         </div>

         <div className="flex-1 overflow-y-auto p-10 space-y-12">
            <section className="grid grid-cols-2 gap-8">
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3" /> Culinary Origin</p>
                  <p className="font-serif italic text-xl text-primary">{dish.origin || 'Global Fusion'}</p>
               </div>
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3" /> Integrity Tags</p>
                  <div className="flex gap-2">
                     {dish.isHeritage && <span className="pill bg-gold/10 text-gold text-[8px]">HERITAGE</span>}
                     <span className="pill bg-teal/5 text-teal text-[8px]">MACRO OPTIMIZED</span>
                  </div>
               </div>
            </section>

            <section className="space-y-4">
               <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">The History</h3>
               <p className="text-muted leading-relaxed italic text-lg">{dish.history || dish.description}</p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary/40">Traditional Craft</h3>
                  <p className="text-sm font-medium text-primary/60 leading-relaxed">{dish.preparation_traditional || 'Centuries of refinement using regional spices and hearth techniques.'}</p>
               </div>
               <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gold">Triangle Evolution</h3>
                  <p className="text-sm font-medium text-primary/80 leading-relaxed">{dish.preparation_triangle || 'Optimized for modern wellness without compromising cultural depth.'}</p>
               </div>
            </section>

            <section className="p-8 rounded-[2rem] bg-[#1A2E2E] text-white">
               <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#C5A059] mb-8 text-center">Protocol Breakdown</h3>
               <div className="grid grid-cols-4 gap-4 text-center">
                  <div><p className="text-2xl font-serif mb-1">{dish.kcals}</p><p className="text-[7px] opacity-40 uppercase tracking-widest">Kcal</p></div>
                  <div><p className="text-2xl font-serif mb-1">{dish.macros?.protein || '--'}</p><p className="text-[7px] opacity-40 uppercase tracking-widest">Protein</p></div>
                  <div><p className="text-2xl font-serif mb-1">{dish.macros?.carbs || '--'}</p><p className="text-[7px] opacity-40 uppercase tracking-widest">Carbs</p></div>
                  <div><p className="text-2xl font-serif mb-1">{dish.macros?.fats || '--'}</p><p className="text-[7px] opacity-40 uppercase tracking-widest">Fats</p></div>
               </div>
            </section>
         </div>
      </motion.div>
    </div>
  );
}

function CustomizeMealModal({ dish, mealType, day, subscriber, onClose, onSave }: { dish: MenuDish, mealType: string, day: string, subscriber: Subscriber, onClose: () => void, onSave: (c: any) => void }) {
  const [removed, setRemoved] = useState<string[]>([]);
  const [subs, setSubs] = useState<Record<string, string>>({});

  const handleSave = () => {
    onSave({ removed_ingredients: removed, substitutions: subs });
  };

  const currentIngredients = dish.ingredients || [];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-primary/40 backdrop-blur-md" />
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-white w-full max-w-xl max-h-[85vh] rounded-[3rem] shadow-4xl overflow-hidden flex flex-col">
         <div className="p-8 border-b border-primary/5">
            <span className="text-[9px] font-black text-gold uppercase tracking-[0.4em] mb-2 block">Protocol Personalization</span>
            <h2 className="text-2xl font-black text-primary uppercase italic tracking-tighter">Customize Your {dish.name}</h2>
         </div>

         <div className="flex-1 overflow-y-auto p-8 space-y-10">
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
               <p className="text-[10px] font-black uppercase text-primary/40 mb-4 tracking-widest">Core Integrity (Non-changeable)</p>
               <div className="flex flex-wrap gap-2">
                  {currentIngredients.filter(i => i.is_required).map(i => (
                    <span key={i.slug} className="pill bg-white text-primary text-[9px] border border-primary/5">{i.name}</span>
                  ))}
               </div>
            </div>

            <div className="space-y-6">
               <p className="text-[10px] font-black uppercase text-gold mb-4 tracking-widest">Adjustable Elements</p>
               {currentIngredients.filter(i => !i.is_required).map(ing => (
                 <div key={ing.slug} className="p-5 rounded-2xl border border-primary/5 bg-gray-50/50 space-y-4">
                    <div className="flex items-center justify-between">
                       <h4 className="font-black text-primary text-xs uppercase tracking-widest">{ing.name}</h4>
                       {ing.is_removable && (
                         <button
                           onClick={() => removed.includes(ing.slug) ? setRemoved(removed.filter(s => s !== ing.slug)) : setRemoved([...removed, ing.slug])}
                           className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                             removed.includes(ing.slug) ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500 hover:bg-red-100'
                           }`}
                         >
                           {removed.includes(ing.slug) ? 'REMOVED' : 'REMOVE'}
                         </button>
                       )}
                    </div>

                    {!removed.includes(ing.slug) && ing.approved_substitutions && ing.approved_substitutions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-primary/30 uppercase">Approved Alternatives</p>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                           <button
                             onClick={() => { const newSubs = {...subs}; delete newSubs[ing.slug]; setSubs(newSubs); }}
                             className={`flex-shrink-0 px-4 py-2 rounded-xl text-[8px] font-black uppercase border-2 transition-all ${
                               !subs[ing.slug] ? 'border-teal bg-teal text-white' : 'border-primary/5 bg-white text-primary/40'
                             }`}
                           >Original</button>
                           {ing.approved_substitutions.map(subSlug => (
                             <button
                               key={subSlug}
                               onClick={() => setSubs({...subs, [ing.slug]: subSlug})}
                               className={`flex-shrink-0 px-4 py-2 rounded-xl text-[8px] font-black uppercase border-2 transition-all ${
                                 subs[ing.slug] === subSlug ? 'border-teal bg-teal text-white' : 'border-primary/5 bg-white text-primary/40'
                               }`}
                             >{subSlug.replace(/_/g, ' ')}</button>
                           ))}
                        </div>
                      </div>
                    )}
                 </div>
               ))}
            </div>

            <div className="p-6 rounded-2xl bg-[#FDFCF7] border border-gold/10">
               <h4 className="text-[9px] font-black text-gold uppercase mb-4 tracking-widest">Personalized Outcome</h4>
               <p className="text-sm font-medium text-primary/80 leading-relaxed italic">
                 {dish.name} prepared with {Object.values(subs).length > 0 ? Object.values(subs).map(s => s.replace(/_/g, ' ')).join(', ') : 'original ingredients'}
                 {removed.length > 0 ? ` and no ${removed.join(', ')}.` : '.'}
               </p>
            </div>
         </div>

         <div className="p-8 bg-gray-50 border-t border-primary/5">
            <button onClick={handleSave} className="btn-primary w-full py-5 uppercase tracking-widest text-xs">Confirm My Protocol</button>
         </div>
      </motion.div>
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
