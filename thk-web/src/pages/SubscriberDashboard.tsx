import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, LogOut, Utensils, Truck, Activity, X, Loader2, Heart,
  Moon, Sun, Coffee, Brain, Zap, Map as MapIcon, Share2, Award,
  Sparkles, ShieldAlert, Phone, Clock, Trash2, ChevronRight, Check,
  Package, MapPin, CheckCircle, Clock3, Shield, MessageCircle, Star, Camera, Trophy, Banknote, RefreshCcw, ArrowUpRight, ShieldCheck, Users, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../lib/auth';
import { getQatarDate, getQatarDayOfWeek, addDays } from '../lib/date-utils';
import { PACKAGES } from '../types/booking';
import {
  DELIVERY_WINDOWS, PACKAGE_MEALS,
  type Subscriber, type ProgressEntry, type MenuSelection, type GlobalSettings, type MenuDish, type Ingredient
} from '../types/subscription';
import HealthTab from '../components/HealthTab';
import { useLanguage } from '../lib/LanguageContext';
import { parseGoogleMapsUrl } from '../lib/location-utils';
import { DEFAULT_ALLERGEN_OPTIONS, loadAllergenOptions, type AllergenOption } from '../lib/allergen-options';

type Tab = 'menu' | 'delivery' | 'health' | 'settings';
const qatarTomorrowString = () => { const date = new Date(`${getQatarDate()}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 1); return date.toISOString().slice(0, 10); };

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

  // My Rhythm Data
  const [rhythmMetrics, setRhythmMetrics] = useState({
    steps: 0,
    goal: 10000,
    streak: 0,
    points: 0,
    streak_history: [0, 0, 0, 0, 0, 0, 0] as number[]
  });

  const loadDashboardData = useCallback(async (retryCount = 0) => {
    if (!user) return;
    setLoading(true);

    try {
      const today = getQatarDate();

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
      ]);

      const [activityRes, goalRes, deliveryRes, dCountRes] = results;

      setRhythmMetrics({
        steps: (activityRes.status === 'fulfilled' && !activityRes.value.error) ? activityRes.value.data?.total_value || 0 : 0,
        goal: (goalRes.status === 'fulfilled' && !goalRes.value.error) ? goalRes.value.data?.target_value || 10000 : 10000,
        streak: subData.current_streak || 0,
        points: subData.points_balance || 0,
        streak_history: subData.streak_history || [1, 1, 1, 1, 0, 0, 0]
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
    <div className={`min-h-screen bg-[#F5F3EB] py-16 sm:py-24 px-4 sm:px-6 md:px-12 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-[1400px] mx-auto space-y-24">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div>
            <div className="badge mb-8 bg-[#C5A059]/10 border-[#C5A059]/20 py-2 px-5">
              <Star className="w-3.5 h-3.5 fill-[#C5A059] animate-glow text-[#C5A059]" />
              <span className="font-black tracking-[0.4em] text-[10px] text-[#C5A059] uppercase">{t('member_dashboard')}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif italic text-[#123F38] leading-[0.95] tracking-tight truncate max-w-2xl">
              {subscriber.full_name || 'Member'}<br />
              <span className="text-[#C5A059] font-sans font-black uppercase not-italic tracking-tighter text-xl sm:text-3xl">{isRtl ? 'متابعة التقدم' : 'Progress Tracker.'}</span>
            </h1>
          </div>
          <div className="flex bg-white/40 backdrop-blur-3xl rounded-[2.5rem] p-2 border border-[#123F38]/10 shadow-4xl overflow-x-auto no-scrollbar touch-pan-x">
            {(['menu', 'delivery', 'health', 'settings'] as const).map((tKey) => (
              <button
                key={tKey}
                onClick={() => setTab(tKey)}
                className={`relative px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap ${
                  tab === tKey ? 'bg-[#123F38] !text-white shadow-3xl scale-105' : 'text-[#123F38] font-bold opacity-70 hover:opacity-100 hover:text-[#123F38]'
                }`}
              >
                {isRtl ? ({ menu: 'قائمة الطعام', delivery: 'التوصيل', health: 'الصحة', settings: 'الإعدادات' } as Record<string,string>)[tKey] : (t(tKey) || tKey.toUpperCase())}
              </button>
            ))}
          </div>
        </header>

        <section className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/10 bg-white p-5 shadow-sm">
          <div><h2 className="font-bold text-primary">{isRtl ? 'أهدافك ومكافآتك' : 'Your goals and rewards'}</h2><p className="mt-1 text-sm text-primary/60">{isRtl ? 'تابع تقدمك واستخدم نقاطك من صفحة المكافآت.' : 'Track progress and use your points from the Rewards page.'}</p></div>
          <button type="button" onClick={() => navigate('/rewards')} className="btn-primary px-5 py-3 text-xs">{isRtl ? 'افتح المكافآت' : 'Open Rewards'}</button>
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
            {tab === 'menu' && <MenuSelection subscriber={subscriber} onUpdate={loadDashboardData} />}
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

function MenuSelection({ subscriber, onUpdate }: { subscriber: Subscriber, onUpdate: () => void }) {
  const weekOffset = 0;
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [menuWeek, setMenuWeek] = useState<number>(1);
  const [selections, setSelections] = useState<MenuSelection[]>([]);
  const [availableMenu, setAvailableMenu] = useState<any[]>([]);
  const [menuHasItems, setMenuHasItems] = useState(false);
  const [menuPeriod, setMenuPeriod] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [aboutMeal, setAboutMeal] = useState<MenuDish | null>(null);
  const [customizingMeal, setCustomizingMeal] = useState<{dish: MenuDish, meal: string} | null>(null);
  const { t, isRtl } = useLanguage();

  const daysRemaining = (() => {
    const now = new Date();
    const qatar = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Qatar', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now);
    const weekday = qatar.find((part) => part.type === 'weekday')?.value;
    const qatarDate = new Date(`${getQatarDate(now)}T12:00:00Z`);
    const daysUntilThursday = weekday === 'Thu' ? 0 : weekday === 'Fri' ? -1 : ({ Sat: 5, Sun: 4, Mon: 3, Tue: 2, Wed: 1 } as Record<string, number>)[weekday || ''] ?? 0;
    if (daysUntilThursday < 0) return 0;
    const deadline = addDays(qatarDate, daysUntilThursday);
    deadline.setUTCHours(20, 59, 59, 999); // 23:59 Qatar time
    return Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / 86400000));
  })();
  const days = subscriber?.friday_delivery_addon ? ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] : ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

  const getWeekStart = (offset: number) => {
    const today = new Date();
    const day = getQatarDayOfWeek(today);
    const qatarDateStr = getQatarDate(today);
    const qatarDate = new Date(qatarDateStr + 'T12:00:00');
    const diff = offset * 7 - ((day + 1) % 7);
    return getQatarDate(addDays(qatarDate, diff));
  };

  // Choices are saved against the upcoming service week. The menu opened on
  // Saturday is planned and selected now, then produced the following week.
  const weekStart = getWeekStart(weekOffset + 1);
  const qatarParts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Qatar', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const qatarWeekday = qatarParts.find((part) => part.type === 'weekday')?.value;
  const canEditMenu = weekOffset === 0 && qatarWeekday !== 'Fri' && menuHasItems;
  const availableMeals = PACKAGE_MEALS[subscriber.package_id] || ['breakfast', 'lunch', 'dinner', 'snacks'];

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const qatarMidnight = (date: string) => new Date(`${date}T00:00:00+03:00`).toISOString();
      const releaseStart = qatarMidnight(weekStart);
      const releaseEnd = qatarMidnight(getQatarDate(addDays(new Date(`${weekStart}T12:00:00Z`), 1)));
      const { data: preparedMenu, error: fallbackError } = await supabase.rpc('ensure_service_week_menu', { p_week_start: weekStart });
      if (fallbackError) throw fallbackError;
      const collection = preparedMenu?.collection;
      if (!collection) throw new Error('No published menu is available for this service week yet.');
      setMenuPeriod(collection);
      const { data: menuData, error: menuError } = await supabase
        .from('menu_availability')
        .select('*, dishes(*)')
        .eq('collection', collection)
        .eq('is_active', true)
        .gte('available_from', releaseStart)
        .lt('available_from', releaseEnd)
        .order('available_from', { ascending: false });
      setMenuWeek(1);
      if (menuError) throw menuError;
      const releasedMenu = menuData || [];
      setMenuHasItems(Boolean(releasedMenu.length));

      // Ingredients are linked through meal_ingredient_config, not directly
      // from dishes. Load that relation separately so PostgREST can resolve it.
      let menuWithIngredients = releasedMenu;
      const dishSlugs = [...new Set(menuWithIngredients.map((row: any) => row.dishes?.slug).filter(Boolean))];
      if (dishSlugs.length) {
        const { data: configs, error: configError } = await supabase
          .from('meal_ingredient_config')
          .select('dish_slug,ingredient_slug,is_required,is_removable,approved_substitutions,ingredients(id,slug,name,name_ar,allergen_tag)')
          .in('dish_slug', dishSlugs);
        if (configError) {
          console.warn('Menu ingredient details unavailable:', configError.message);
        } else {
          const ingredientsByDish = new Map<string, any[]>();
          for (const config of configs || []) {
            const ingredient = Array.isArray(config.ingredients) ? config.ingredients[0] : config.ingredients;
            if (!ingredient) continue;
            const values = ingredientsByDish.get(config.dish_slug) || [];
            values.push({
              ...ingredient,
              allergen: ingredient.allergen_tag,
              is_required: Boolean(config.is_required),
              is_removable: Boolean(config.is_removable),
              approved_substitutions: config.approved_substitutions || [],
            });
            ingredientsByDish.set(config.dish_slug, values);
          }
          menuWithIngredients = menuWithIngredients.map((row: any) => {
            const dish = Array.isArray(row.dishes) ? row.dishes[0] : row.dishes;
            return { ...row, dishes: dish ? { ...dish, ingredients: ingredientsByDish.get(dish.slug) || [] } : dish };
          });
        }
      }

      // Group by day for easier UI consumption
      const grouped = days.map(d => ({
        day: d,
        items: {
          breakfast: menuWithIngredients.filter(m => m.day_of_week === d && m.meal_period === 'breakfast').map(m => m.dishes) || [],
          lunch: menuWithIngredients.filter(m => m.day_of_week === d && m.meal_period === 'lunch').map(m => m.dishes) || [],
          dinner: menuWithIngredients.filter(m => m.day_of_week === d && m.meal_period === 'dinner').map(m => m.dishes) || [],
          snacks: menuWithIngredients.filter(m => m.day_of_week === d && m.meal_period === 'snacks').map(m => m.dishes) || [],
        }
      }));
      setAvailableMenu(grouped);

      // 3. Fetch User Selections
      let selQuery = supabase
        .from('weekly_menu_selections')
        .select('day_of_week, meal_type, dish_name, dish_kcals, menu_period, customizations, dish_id')
        .eq('subscriber_id', subscriber.id);

      selQuery = selQuery.eq('week_start_date', weekStart);

      const { data: selData, error: selectionError } = await selQuery;
      if (selectionError) throw selectionError;
      setSelections((selData || []).map((row) => ({ ...row, meal_type: row.meal_type === 'snack' ? 'snacks' : row.meal_type })) as MenuSelection[]);
    } catch (e) {
      console.error('Menu Sync Failure:', e);
      setSaveError(e instanceof Error ? e.message : 'Could not load this week’s menu.');
    } finally {
      setLoading(false);
    }
  }, [subscriber.id, weekStart, weekOffset]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  const activeDay = availableMenu.find(d => d.day === days[activeDayIndex]);

  const pickDish = async (day: string, meal: string, dish: MenuDish, customizations = {}) => {
    if (!canEditMenu || saving) return;
    const otherSnackType = meal === 'snacks' ? 'snack_2' : meal === 'snacks_2' ? 'snack' : null;
    if (otherSnackType && selections.some((selection) => selection.day_of_week === day && selection.meal_type === otherSnackType && selection.dish_id === dish.id)) {
      setSaveError('Choose a different dish for each snack.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    const { error } = await supabase
      .from('weekly_menu_selections')
      .upsert({
        subscriber_id: subscriber.id,
        week_start_date: weekStart,
        day_of_week: day,
        meal_type: meal === 'snacks' ? 'snack' : meal === 'snacks_2' ? 'snack_2' : meal,
        dish_id: dish.id,
        dish_name: dish.name,
        dish_kcals: dish.kcals,
        customizations,
        // menu_period stores the collection key expected by the database
        // selection-window trigger (summer/autumn/ramadan).
        menu_period: menuPeriod
      }, { onConflict: 'subscriber_id,week_start_date,day_of_week,meal_type' });

    if (!error) {
      await loadMenu();
      onUpdate();
    } else setSaveError(error.message);
    setSaving(false);
    setCustomizingMeal(null);
  };

  const skipEntireDay = async (day: string) => {
    if (!canEditMenu || saving) return;
    if (!confirm(`Skip all meals for ${t(day)}?`)) return;
    setSaving(true);
    setSaveError(null);
    const skipSelections = availableMeals.map(meal => ({
      subscriber_id: subscriber.id,
      week_start_date: weekStart,
      day_of_week: day,
      meal_type: meal === 'snacks' ? 'snack' : meal === 'snacks_2' ? 'snack_2' : meal,
      dish_name: 'SKIP DAY',
      dish_kcals: 0,
      menu_period: menuPeriod
    }));
    const { error } = await supabase.from('weekly_menu_selections').upsert(skipSelections, { onConflict: 'subscriber_id,week_start_date,day_of_week,meal_type' });
    if (error) setSaveError(error.message); else { await loadMenu(); onUpdate(); }
    setSaving(false);
  };

  const applyWeeklyPattern = async (meal: string, dish: MenuDish) => {
    if (!canEditMenu || saving) return;
    const otherSnackType = meal === 'snacks' ? 'snack_2' : meal === 'snacks_2' ? 'snack' : null;
    if (otherSnackType && selections.some((selection) => days.includes(selection.day_of_week) && selection.meal_type === otherSnackType && selection.dish_id === dish.id)) {
      setSaveError('Choose a different dish for each snack.');
      return;
    }
    if (!confirm(`Apply "${dish.name}" to all days this week?`)) return;
    setSaving(true);
    setSaveError(null);
    const newSelections = days.map(day => ({
      subscriber_id: subscriber.id,
      week_start_date: weekStart,
      day_of_week: day,
      meal_type: meal === 'snacks' ? 'snack' : meal === 'snacks_2' ? 'snack_2' : meal,
      dish_id: dish.id,
      dish_name: dish.name,
      dish_kcals: dish.kcals,
      menu_period: menuPeriod
    }));
    const { error } = await supabase.from('weekly_menu_selections').upsert(newSelections, { onConflict: 'subscriber_id,week_start_date,day_of_week,meal_type' });
    if (error) setSaveError(error.message); else { await loadMenu(); onUpdate(); }
    setSaving(false);
  };

  return (
    <div className="space-y-12">
      <AllergyPreferences subscriber={subscriber} onUpdate={onUpdate} />
      {/* 1. Header & Week Selector */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 bg-white/40 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/20 shadow-3xl">
        <div className="flex items-center gap-6">
          <div className="text-center min-w-[200px]">
            <p className="text-primary font-black text-sm uppercase tracking-[0.3em]">{t('next_week')}</p>
            <p className="text-gold text-[10px] font-black mt-2 uppercase tracking-widest opacity-60">{weekStart} · Protocol Cycle W{menuWeek}</p>
          </div>
        </div>

        {daysRemaining !== null && (
          <div className="flex items-center gap-4 px-8 py-4 bg-primary/5 rounded-[2rem] border border-primary/10">
             <Clock3 className={`w-5 h-5 ${daysRemaining <= 3 ? 'text-red-500 animate-pulse' : 'text-gold'}`} />
             <span className="text-[11px] font-black uppercase tracking-widest text-primary">
               {isRtl ? `آخر موعد للاختيار: متبقي ${daysRemaining} يومًا` : `Mission Lock-In: ${daysRemaining} days remaining`}
             </span>
          </div>
        )}
      </div>

      {saveError && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">{isRtl ? `تعذر تحديث القائمة: ${saveError}` : `Menu update failed: ${saveError}`}</p>}
      {!loading && !menuHasItems && <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center text-sm font-semibold text-amber-900">{t('menu_not_published')}</p>}
      {qatarWeekday === 'Fri' && <p className="text-center text-xs font-bold text-primary/50">{t('menu_selection_closed')}</p>}

      {/* 2. Compact Day Tabs */}
      <div className="flex bg-[#123F38]/5 backdrop-blur-xl p-2 rounded-[2.5rem] border border-[#123F38]/10 shadow-xl overflow-x-auto no-scrollbar">
        {days.map((day, idx) => (
          <button
            key={day}
            onClick={() => setActiveDayIndex(idx)}
            className={`flex-1 min-w-[120px] py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all ${
              activeDayIndex === idx ? 'bg-[#123F38] text-white shadow-2xl scale-[1.02]' : 'text-[#123F38]/40 hover:text-[#123F38]'
            }`}
          >
            {t(day)}
          </button>
        ))}
      </div>

      {/* 3. Compact Meal List */}
      <div className="space-y-8 animate-reveal">
        <div className="flex items-center justify-between px-6">
           <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-[#123F38] flex items-center justify-center text-white"><Calendar className="w-6 h-6" /></div>
              <h3 className="text-4xl font-serif italic tracking-tighter text-[#123F38] uppercase">{t(days[activeDayIndex])}</h3>
           </div>
           <button disabled={!canEditMenu || saving} onClick={() => skipEntireDay(days[activeDayIndex])} className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-[0.2em] underline underline-offset-8 transition-all disabled:opacity-40">Skip Protocol Day</button>
        </div>

        <div className="space-y-12">
          {availableMeals.map(mealType => {
            const sel = selections.find(s => s.day_of_week === days[activeDayIndex] && s.meal_type === mealType);
            const dishes = activeDay?.items[(mealType === 'snacks_2' ? 'snacks' : mealType) as keyof typeof activeDay.items] || [];
            const isSkipped = sel?.dish_name === 'SKIP DAY';

            if (dishes.length === 0) return null;

            return (
              <section key={mealType} className="space-y-6">
                <div className="flex items-center gap-6 px-6">
                   <p className="text-xs font-black uppercase tracking-[0.5em] text-[#C5A059]">{t(mealType)}</p>
                   <div className="h-px flex-1 bg-[#123F38]/10" />
                   {isSkipped && <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{isRtl ? 'تم إيقاف الاختيار' : 'Protocol Paused'}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {dishes.map((dish: MenuDish) => {
                    const isSelected = sel?.dish_id === dish.id || sel?.dish_name === dish.name;
                    const matchingAllergen = dish.allergens?.find((a: string) => subscriber.allergies?.includes(a));

                    return (
                      <div key={dish.id} className={`group relative flex flex-col p-8 rounded-[2.5rem] border-2 transition-all duration-700 ${
                        isSelected ? 'border-[#123F38] bg-[#123F38] text-white shadow-4xl' : 'border-[#123F38]/5 bg-white/60 hover:border-[#C5A059]/30'
                      } ${matchingAllergen ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <h4 className="font-serif italic text-2xl tracking-tighter leading-tight">{isRtl ? (dish.name_ar || dish.name) : dish.name}</h4>
                            {isSelected && <CheckCircle className="w-6 h-6 text-[#C5A059] shrink-0" />}
                          </div>
                          <div className="flex gap-4 mb-8 opacity-60">
                            <span className="text-[10px] font-black uppercase tracking-widest">{dish.kcals} KCAL</span>
                            {dish.macros && (
                              <div className="flex gap-4 text-[9px] font-bold">
                                <span>P: {dish.macros.protein}g</span>
                                <span>C: {dish.macros.carbs}g</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={`flex items-center gap-2 pt-6 border-t ${isSelected ? 'border-white/10' : 'border-[#123F38]/5'}`}>
                          <button onClick={() => setAboutMeal(dish)} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${isSelected ? 'border-white/20 hover:bg-white/10' : 'border-[#123F38]/10 hover:bg-[#123F38]/5'}`}>{isRtl ? 'التفاصيل' : 'About'}</button>
                          <button onClick={() => setCustomizingMeal({dish, meal: mealType})} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${isSelected ? 'border-[#C5A059]/40 text-[#C5A059]' : 'border-[#C5A059]/20 text-[#C5A059]/60 hover:bg-[#C5A059]/5'}`}>{isRtl ? 'تخصيص' : 'Personalize'}</button>
                          <button
                            disabled={!canEditMenu || saving} onClick={() => pickDish(days[activeDayIndex], mealType, dish)}
                            className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                              isSelected ? 'bg-[#C5A059] text-[#123F38]' : 'bg-[#123F38] text-white hover:scale-105'
                            }`}
                          >
                            {isSelected ? (isRtl ? 'تم الاختيار' : 'Activated') : (isRtl ? 'اختر' : 'Choose')}
                          </button>
                        </div>

                        {isSelected && !matchingAllergen && (
                          <button
                            disabled={!canEditMenu || saving} onClick={(e) => { e.stopPropagation(); applyWeeklyPattern(mealType, dish); }}
                            className="absolute -right-3 -top-3 bg-[#C5A059] text-[#123F38] p-2.5 rounded-2xl shadow-4xl hover:scale-110 transition-all border-4 border-[#F5F3EB] z-10"
                            title="Apply to all week"
                          >
                            <Zap className="w-5 h-5 fill-[#123F38]" />
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

      {/* Modals - Reusing same components as Mobile for logic parity */}
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

// Reuse Modal Components from Mobile implementation (updated for Web styling)
function AboutMealModal({ dish, isRtl, onClose }: { dish: MenuDish, isRtl: boolean, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-primary/60 backdrop-blur-xl" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-[#FDFCF7] w-full max-w-3xl max-h-[90vh] rounded-[4rem] shadow-4xl overflow-hidden flex flex-col border border-white/20">
         <div className="p-12 border-b border-primary/5 flex items-center justify-between bg-white/40 backdrop-blur-md">
            <div>
               <span className="text-[11px] font-black text-gold uppercase tracking-[0.5em] mb-3 block">{isRtl ? 'تفاصيل الطبق' : 'Culinary Specification'}</span>
               <h2 className="text-5xl font-serif italic text-primary tracking-tighter">{isRtl ? (dish.name_ar || dish.name) : dish.name}</h2>
            </div>
            <button onClick={onClose} className="p-5 hover:bg-primary/5 rounded-full transition-all"><X className="w-10 h-10 text-primary/20" /></button>
         </div>

         <div className="flex-1 overflow-y-auto p-12 space-y-16">
            <div className="grid grid-cols-2 gap-12">
               <div className="space-y-3">
                  <p className="text-[11px] font-black text-primary/30 uppercase tracking-widest flex items-center gap-3"><MapPin className="w-4 h-4" /> Provenance</p>
                  <p className="font-serif italic text-3xl text-primary">{isRtl ? (dish.origin_ar || dish.origin || 'مطبخ عالمي') : (dish.origin || 'Global Fusion')}</p>
               </div>
               <div className="space-y-3">
                  <p className="text-[11px] font-black text-primary/30 uppercase tracking-widest flex items-center gap-3"><Sparkles className="w-4 h-4" /> Biological Tags</p>
                  <div className="flex gap-3">
                     {dish.isHeritage && <span className="badge bg-gold/10 text-gold text-[9px] py-2 px-6">{isRtl ? 'تراثي' : 'HERITAGE'}</span>}
                     <span className="badge bg-teal/5 text-teal text-[9px] py-2 px-6">{isRtl ? 'متوازن غذائياً' : 'MACRO OPTIMIZED'}</span>
                  </div>
               </div>
            </div>

            <section className="space-y-6">
               <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary/40">{isRtl ? 'نبذة عن الطبق' : 'The Narrative'}</h3>
               <p className="text-muted leading-relaxed italic text-2xl font-serif text-primary/80">{isRtl ? (dish.history_ar || dish.description_ar || dish.history || dish.description) : (dish.history || dish.description)}</p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-primary/5">
               <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary/40">{isRtl ? 'طريقة التحضير التقليدية' : 'Traditional Craft'}</h3>
                  <p className="text-sm font-medium text-primary/60 leading-relaxed">{isRtl ? (dish.preparation_traditional_ar || dish.preparation_traditional || 'تحضير تقليدي بتوابل محلية وأساليب طهي أصيلة.') : (dish.preparation_traditional || 'Generational refinement using regional fire-hearth and stone-ground spice techniques.')}</p>
               </div>
               <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gold">{isRtl ? 'لمسة تراينغل' : 'Triangle Evolution'}</h3>
                  <p className="text-sm font-medium text-primary/80 Plan-relaxed">{isRtl ? (dish.preparation_triangle_ar || dish.preparation_triangle || 'وصفة متوازنة للعافية الحديثة مع الحفاظ على نكهتها الأصيلة.') : (dish.preparation_triangle || 'Optimized for high-performance recovery without compromising cultural resonance.')}</p>
               </div>
            </div>

            <section className="p-12 rounded-[3.5rem] bg-primary text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -mr-32 -mt-32" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-gold mb-10 text-center relative z-10">{isRtl ? 'القيم الغذائية (للحصة)' : 'Protocol Analysis (Per Unit)'}</h3>
               <div className="grid grid-cols-4 gap-8 text-center relative z-10">
                  <div><p className="text-4xl font-serif mb-2">{dish.kcals}</p><p className="text-[8px] opacity-40 uppercase tracking-widest">{isRtl ? 'سعرة' : 'Kcal'}</p></div>
                  <div><p className="text-4xl font-serif mb-2">{dish.macros?.protein || '--'}</p><p className="text-[8px] opacity-40 uppercase tracking-widest">{isRtl ? 'بروتين' : 'Protein'}</p></div>
                  <div><p className="text-4xl font-serif mb-2">{dish.macros?.carbs || '--'}</p><p className="text-[8px] opacity-40 uppercase tracking-widest">{isRtl ? 'كربوهيدرات' : 'Carbs'}</p></div>
                  <div><p className="text-4xl font-serif mb-2">{dish.macros?.fats || '--'}</p><p className="text-[8px] opacity-40 uppercase tracking-widest">{isRtl ? 'دهون' : 'Fats'}</p></div>
               </div>
            </section>
         </div>
      </motion.div>
    </div>
  );
}

function CustomizeMealModal({ dish, mealType, day, subscriber, onClose, onSave }: { dish: MenuDish, mealType: string, day: string, subscriber: Subscriber, onClose: () => void, onSave: (c: any) => void }) {
  const { isRtl } = useLanguage();
  const [removed, setRemoved] = useState<string[]>([]);
  const [subs, setSubs] = useState<Record<string, string>>({});

  const handleSave = () => {
    onSave({ removed_ingredients: removed, substitutions: subs });
  };

  const currentIngredients = dish.ingredients || [];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-primary/60 backdrop-blur-xl" />
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[4rem] shadow-4xl overflow-hidden flex flex-col border border-white/20">
         <div className="p-12 border-b border-primary/5 bg-white/40">
            <span className="text-[10px] font-black text-gold uppercase tracking-[0.5em] mb-3 block">{isRtl ? 'تخصيص الوجبة' : 'Hyper-Personalization'}</span>
            <h2 className="text-4xl font-serif italic text-primary tracking-tighter">{isRtl ? `خصص ${dish.name_ar || dish.name}` : `Tune Your ${dish.name}`}</h2>
         </div>

         <div className="flex-1 overflow-y-auto p-12 space-y-12">
            <div className="bg-primary/5 p-8 rounded-[3rem] border border-primary/10">
               <p className="text-[10px] font-black uppercase text-primary/40 mb-6 tracking-widest">{isRtl ? 'مكونات أساسية لا يمكن تغييرها' : 'Non-Negotiable Elements'}</p>
               <div className="flex flex-wrap gap-3">
                  {currentIngredients.filter(i => i.is_required).map(i => (
                    <span key={i.slug} className="badge bg-white text-primary text-[10px] py-2 px-6 border-primary/5">{i.name}</span>
                  ))}
               </div>
            </div>

            <div className="space-y-8">
               <p className="text-[10px] font-black uppercase text-gold mb-4 tracking-widest">{isRtl ? 'مكونات قابلة للتعديل' : 'Variable Components'}</p>
               {currentIngredients.filter(i => !i.is_required).map(ing => (
                 <div key={ing.slug} className="p-8 rounded-[2.5rem] border border-primary/5 bg-[#FDFCF7]/50 space-y-6">
                    <div className="flex items-center justify-between">
                       <h4 className="font-black text-primary text-sm uppercase tracking-widest italic">{ing.name}</h4>
                       {ing.is_removable && (
                         <button
                           onClick={() => removed.includes(ing.slug) ? setRemoved(removed.filter(s => s !== ing.slug)) : setRemoved([...removed, ing.slug])}
                           className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                             removed.includes(ing.slug) ? 'bg-red-500 text-white shadow-xl' : 'bg-red-50 text-red-500 hover:bg-red-100'
                           }`}
                         >
                           {removed.includes(ing.slug) ? (isRtl ? 'تم الاستبعاد' : 'REMOVED') : (isRtl ? 'استبعاد المكون' : 'EXCLUDE ELEMENT')}
                         </button>
                       )}
                    </div>

                    {!removed.includes(ing.slug) && ing.approved_substitutions && ing.approved_substitutions.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-[9px] font-black text-primary/30 uppercase tracking-[0.2em]">{isRtl ? 'بدائل معتمدة' : 'Authorized Substitutes'}</p>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                           <button
                             onClick={() => { const newSubs = {...subs}; delete newSubs[ing.slug]; setSubs(newSubs); }}
                             className={`flex-shrink-0 px-8 py-3 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${
                               !subs[ing.slug] ? 'border-teal bg-teal text-white shadow-lg' : 'border-primary/5 bg-white text-primary/40 hover:border-teal/20'
                             }`}
                           >{isRtl ? 'الخيار الأصلي' : 'Default Configuration'}</button>
                           {ing.approved_substitutions.map(subSlug => (
                             <button
                               key={subSlug}
                               onClick={() => setSubs({...subs, [ing.slug]: subSlug})}
                               className={`flex-shrink-0 px-8 py-3 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${
                                 subs[ing.slug] === subSlug ? 'border-teal bg-teal text-white shadow-lg' : 'border-primary/5 bg-white text-primary/40 hover:border-teal/20'
                               }`}
                             >{subSlug.replace(/_/g, ' ')}</button>
                           ))}
                        </div>
                      </div>
                    )}
                 </div>
               ))}
            </div>

            <div className="p-10 rounded-[3rem] bg-emerald-50/30 border border-emerald-100 relative overflow-hidden">
               <ShieldCheck className="absolute bottom-[-10%] right-[-5%] w-32 h-32 text-emerald-500/10" />
               <h4 className="text-[10px] font-black text-emerald-700 uppercase mb-4 tracking-widest">{isRtl ? 'ملخص التخصيص' : 'Protocol Summary'}</h4>
               <p className="text-lg font-medium text-emerald-900 leading-relaxed italic relative z-10">
                 {isRtl ? `${dish.name_ar || dish.name} مع ${Object.values(subs).length > 0 ? Object.values(subs).map(s => s.replace(/_/g, ' ')).join('، ') : 'المكونات الأصلية'}${removed.length > 0 ? ` · مستبعد: ${removed.join('، ')}` : ''}` : `${dish.name} configured with ${Object.values(subs).length > 0 ? Object.values(subs).map(s => s.replace(/_/g, ' ')).join(', ') : 'standard integrity'}.${removed.length > 0 ? ` Note: ${removed.join(', ')} explicitly excluded.` : ''}`}
               </p>
            </div>
         </div>

         <div className="p-12 bg-white/80 border-t border-primary/5">
            <button onClick={handleSave} className="btn-primary w-full py-6 uppercase tracking-[0.4em] text-[10px] shadow-4xl hover:scale-[1.02] transition-all">{isRtl ? 'تأكيد الاختيارات' : 'VALIDATE & CONFIRM SELECTION'}</button>
         </div>
      </motion.div>
    </div>
  );
}

function DeliverySettings({ subscriber, activeDelivery, riderLocation, onUpdate }: { subscriber: Subscriber; activeDelivery: any; riderLocation: any; onUpdate: () => void }) {
  const { t, isRtl } = useLanguage();
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
                       <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-4">{isRtl ? 'تم تجهيز الطلب.' : 'Package Secured.'}</h3>
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
            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059]">{isRtl ? 'رابط الموقع من خرائط Google (اختياري)' : 'Google Maps Location Link (Optional)'}</p>
               <input
                 type="text"
                 placeholder={isRtl ? 'الصق رابط موقع خرائط Google أو WhatsApp' : 'Paste Google Maps URL or WhatsApp location link'}
                 className="input-field py-6 font-black text-sm bg-white/40"
                 onChange={async (e) => {
                   const val = e.target.value;
                   if (val.trim()) {
                     const parsed = await parseGoogleMapsUrl(val);
                     if (parsed.isValid && parsed.latitude !== null && parsed.longitude !== null) {
                       setForm(f => ({
                         ...f,
                         latitude: parsed.latitude,
                         longitude: parsed.longitude,
                         area: parsed.zone ? `${f.area} (Zone ${parsed.zone})` : f.area,
                       }));
                     }
                   }
                 }}
               />
            </div>
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
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059]">{isRtl ? 'موقع أسطول التوصيل المباشر' : 'Live Fleet Location'}</p>
            <div className="h-px w-8 bg-[#C5A059]/30" />
         </div>
      </div>
    </div>
  );
}

function AllergyPreferences({ subscriber, onUpdate }: { subscriber: Subscriber; onUpdate: () => void }) {
  const { t, isRtl } = useLanguage();
  const [allergies, setAllergies] = useState<string[]>(subscriber.allergies || []);
  const [allergenOptions, setAllergenOptions] = useState<AllergenOption[]>(DEFAULT_ALLERGEN_OPTIONS);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void loadAllergenOptions().then((options) => {
      if (!cancelled) setAllergenOptions([...options, ...allergies.filter((name) => !options.some((option) => option.name === name)).map((name) => ({ name, name_ar: name }))]);
    });
    return () => { cancelled = true; };
  }, []);
  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('subscribers').update({ allergies }).eq('id', subscriber.id);
    setSaving(false);
    if (error) alert(t('error_generic')); else { alert(t('safety_confirmed')); onUpdate(); }
  };
  return <section className="rounded-3xl border border-red-200 bg-white p-6 sm:p-8 shadow-sm"><div className="mb-5 flex items-center gap-3"><ShieldAlert className="h-5 w-5 text-red-600"/><div><h3 className="font-black uppercase tracking-wide text-primary">{isRtl ? 'الحساسية وسلامة الطعام' : 'Allergies & food safety'}</h3><p className="text-xs text-primary/60">{isRtl ? 'تساعد هذه الملاحظات المطبخ على استبعاد الأطباق غير المناسبة.' : 'These notes help flag unsuitable dishes for the kitchen.'}</p></div></div><div className="flex flex-wrap gap-2">{allergenOptions.map((allergen) => { const selected=allergies.includes(allergen.name); return <button type="button" key={allergen.name} aria-pressed={selected} onClick={() => setAllergies((previous) => selected ? previous.filter((item) => item !== allergen.name) : [...previous, allergen.name])} className={`rounded-full border px-4 py-2 text-xs font-bold ${selected ? 'border-red-600 bg-red-600 text-white' : 'border-primary/15 text-primary/70'}`}>{isRtl ? allergen.name_ar : allergen.name}</button>; })}</div><button type="button" onClick={save} disabled={saving} className="btn-primary mt-5 px-6 py-3 text-xs">{saving ? (isRtl ? 'جارٍ الحفظ…' : 'Saving…') : (isRtl ? 'حفظ ملاحظات سلامة الطعام' : 'Save food-safety notes')}</button></section>;
}

function PlanSettings({ subscriber, onUpdate, updating, setUpdating }: { subscriber: Subscriber, onUpdate: () => void, updating: boolean, setUpdating: (v: boolean) => void }) {
  const { signOut, user } = useAuth();
  const { t, isRtl } = useLanguage();
  const [pauseRequest, setPauseRequest] = useState<any>(null);
  const [requestDate, setRequestDate] = useState(qatarTomorrowString);
  const [requestReason, setRequestReason] = useState('');

  useEffect(() => {
    let mounted = true;
    supabase.from('subscription_pause_requests').select('*').eq('subscriber_id', subscriber.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { if (mounted) setPauseRequest(data); });
    return () => { mounted = false; };
  }, [subscriber.id]);

  const togglePause = async () => {
    if (!subscriber) return;
    setUpdating(true);
    try {
      const request_type = subscriber.status === 'active' ? 'pause' : 'resume';
      const { data, error } = await supabase.from('subscription_pause_requests').insert({ subscriber_id: subscriber.id, request_type, requested_date: requestDate, reason: requestReason.trim() }).select('*').single();
      if (error) throw error;
      setPauseRequest(data);
      alert(isRtl ? 'تم إرسال طلبك إلى فريق تراينجل هيلثي كيتشن للمراجعة.' : 'Your request has been sent to the Triangle Healthy Kitchen team for review.');
    } catch (error) { alert(error instanceof Error ? error.message : t('error_generic')); }
    finally { setUpdating(false); }
  };

  const requestDeletion = async () => {
    if (!confirm(isRtl ? 'هل تريد بالتأكيد طلب حذف حسابك؟ سيؤدي ذلك إلى إنهاء اشتراكك وإزالة بياناتك وفقاً لسياسة الخصوصية.' : "Are you sure you want to request account deletion? This will terminate your subscription and remove your data according to our privacy policy.")) return;
    setUpdating(true);
    const { error } = await supabase.from('deletion_requests').insert({
      user_id: user?.id,
      email: user?.email,
      requested_at: new Date().toISOString()
    });
    if (error) alert(t('error_generic'));
    else {
      alert(isRtl ? 'تم استلام الطلب. سيعالجه فريقنا خلال ٣٠ يوماً.' : 'Request received. Our team will process it within 30 days.');
      signOut();
    }
    setUpdating(false);
  };

  return (
    <div className="space-y-12 animate-reveal">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="glass-card p-16 border-white/20 bg-white/5 group">
             <div className="w-20 h-20 rounded-[2.5rem] bg-[#123F38]/10 flex items-center justify-center mb-10 group-hover:bg-[#C5A059] transition-all duration-700">
                <RefreshCcw className="w-10 h-10 text-[#C5A059] group-hover:text-[#123F38] transition-colors" />
             </div>
             <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-6 text-[#123F38]">{t('subscription_control')}</h3>
             <p className="text-[#123F38] font-black opacity-80 text-lg italic mb-12 leading-relaxed">{t('pause_desc')}</p>
             {pauseRequest ? <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900">{isRtl ? `طلب ${pauseRequest.request_type === 'pause' ? 'إيقاف' : 'استئناف'} بتاريخ ${pauseRequest.requested_date} بانتظار موافقة الفريق.` : `Your ${pauseRequest.request_type} request for ${pauseRequest.requested_date} is waiting for team approval.`}</p> : <><label className="mb-4 block text-sm font-semibold text-[#123F38]">{isRtl ? 'التاريخ المطلوب' : 'Requested date'}<input type="date" min={qatarTomorrowString()} value={requestDate} onChange={(event) => setRequestDate(event.target.value)} className="ops-control mt-2 w-full" /></label><label className="mb-5 block text-sm font-semibold text-[#123F38]">{isRtl ? 'السبب' : 'Reason'}<input value={requestReason} onChange={(event) => setRequestReason(event.target.value)} maxLength={300} placeholder={isRtl ? 'سفر أو عمل أو سبب آخر' : 'Travel, work, or another reason'} className="ops-control mt-2 w-full" /></label><button onClick={togglePause} disabled={updating || !['active','paused'].includes(subscriber.status) || (subscriber.status === 'paused' && !subscriber.tap_charge_id && !subscriber.last_payment_id)} className={`btn-primary w-full py-8 text-[11px] tracking-[0.4em] active:scale-95 ${subscriber.status === 'active' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {updating ? 'SENDING...' : subscriber.status === 'active' ? t('pause_plan') : subscriber.status === 'paused' ? t('resume_now') : 'Plan unavailable'}
             </button></>}
          </div>

          <div className="glass-card p-16 border-red-500/10 bg-red-50/5 group">
             <div className="w-20 h-20 rounded-[2.5rem] bg-red-50/50 flex items-center justify-center mb-10 group-hover:bg-red-600 transition-all duration-700">
                <Trash2 className="w-10 h-10 text-red-500 group-hover:text-white transition-colors" />
             </div>
             <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-6 text-red-600">{isRtl ? 'أمان الحساب' : 'Account Safety'}</h3>
             <p className="text-[#123F38] font-black opacity-80 text-lg italic mb-12 leading-relaxed">{isRtl ? 'سيؤدي طلب حذف الحساب إلى إلغاء اشتراكك النشط وحذف بياناتك من خوادمنا خلال ٣٠ يوماً.' : 'Requesting account deletion will terminate your active subscription protocols and remove your biological data from our secure cloud within 30 days.'}</p>
             <button onClick={requestDeletion} disabled={updating} className="flex items-center gap-4 text-red-600 font-black uppercase tracking-[0.3em] text-[10px] hover:text-red-700 transition-all group/btn active:scale-95">
                <Trash2 className="w-8 h-8 group-hover/btn:rotate-12 transition-transform" /> {updating ? 'PROCESSING...' : t('request_account_deletion')}
             </button>
          </div>
       </div>
    </div>
  );
}
