import { useState, useEffect, useCallback } from 'react';
import { Utensils, Truck, X, Loader2, Zap, Map as MapIcon, ShieldAlert, Phone, Trash2, Package, MapPin, CheckCircle, Camera, MessageCircle, Shield, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

import { PACKAGE_MEALS, type Subscriber, type MenuSelection, type GlobalSettings, type MenuDish } from '@/types/subscription';
import HealthTab from '@/components/HealthTab';
import { useLanguage } from '@/lib/LanguageContext';
import { BUSINESS_RULES } from '@/config/business';
import { getQatarDate, getQatarDayOfWeek, addDays } from '@/lib/date-utils';
import { parseGoogleMapsUrl } from '@/lib/location-utils';

type Tab = 'menu' | 'delivery' | 'health' | 'settings';
const qatarTomorrowString = () => { const date = new Date(`${getQatarDate()}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 1); return date.toISOString().slice(0, 10); };

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
      const [{ data: rawSubData }, { data: settsData }] = await Promise.all([
        supabase.from('subscribers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('global_settings').select('*').single(),
      ]);

      let subData: any = rawSubData;
      if (rawSubData && rawSubData.preferred_region_id) {
        try {
          const { data: comm } = await supabase
            .from('regional_communities')
            .select('*')
            .eq('id', rawSubData.preferred_region_id)
            .maybeSingle();
          subData = { ...rawSubData, preferred_region: comm };
        } catch (e) {}
      }

      setSubscriber(subData as Subscriber | null);
      const settings = settsData as GlobalSettings;
      setSettings(settings);

      if (subData) {
        const sid = subData.id;
        const today = getQatarDate();

        // Fetch activity data safely
        const [
          { data: goalData },
          { data: summaryData },
          { data: delivery },
          { count: dCount },
          { count: mCount }
        ] = await Promise.all([
          supabase.from('user_daily_goals').select('target_value').eq('subscriber_id', sid).eq('target_date', today).maybeSingle(),
          supabase.from('daily_activity_summaries').select('total_value').eq('subscriber_id', sid).eq('local_date', today).maybeSingle(),
          supabase
            .from('rider_deliveries')
            .select('*')
            .eq('subscriber_id', sid)
            .eq('delivery_date', today)
            .eq('status', 'pending')
            .maybeSingle(),
          supabase
            .from('rider_deliveries')
            .select('*', { count: 'exact', head: true })
            .eq('subscriber_id', sid)
            .eq('status', 'delivered'),
          settings?.current_menu_period ? supabase
            .from('weekly_menu_selections')
            .select('*', { count: 'exact', head: true })
            .eq('subscriber_id', sid)
            .eq('menu_period', settings.current_menu_period) : Promise.resolve({ count: null })
        ]);

        setActivityData({
          steps: summaryData?.total_value || 0,
          goal: goalData?.target_value || 10000,
          streak: subData.streak_history || [1, 1, 1, 1, 0, 0, 0]
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
                className={`relative whitespace-nowrap rounded-[1.25rem] px-4 py-3 text-[9px] font-black uppercase tracking-wider transition-all sm:rounded-[1.5rem] sm:px-8 sm:py-3.5 sm:text-[10px] sm:tracking-widest ${
                  tab === tKey ? 'bg-teal text-white shadow-xl' : 'text-primary/40 hover:text-primary'
                } ${isHardLocked && tKey !== 'menu' ? 'opacity-20 cursor-not-allowed' : ''}`}
              >
                {t(tKey) || tKey.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <section className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/10 bg-white p-5 shadow-sm">
          <div><h2 className="font-bold text-primary">{isRtl ? 'أهدافك ومكافآتك' : 'Your goals and rewards'}</h2><p className="mt-1 text-sm text-primary/60">{isRtl ? 'تابع تقدمك واستخدم نقاطك من صفحة المكافآت.' : 'Track progress and use your points from the Rewards page.'}</p></div>
          <button type="button" onClick={() => (window.location.hash = 'rewards')} className="btn-primary px-5 py-3 text-xs">{isRtl ? 'افتح المكافآت' : 'Open Rewards'}</button>
        </section>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
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
      <div className="fixed bottom-5 right-4 z-50 flex flex-col gap-3 sm:bottom-12 sm:right-12 sm:gap-4">
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

function AllergyPreferences({ subscriber, onUpdate }: { subscriber: Subscriber; onUpdate: () => void }) {
  const { t, isRtl } = useLanguage();
  const [allergies, setAllergies] = useState<string[]>(subscriber.allergies || []);
  const [saving, setSaving] = useState(false);
  const allergens = ['Fish', 'Dairy', 'Eggs', 'Gluten', 'Seafood', 'Sesame', 'Nuts'];
  const save = async () => { setSaving(true); const { error } = await supabase.from('subscribers').update({ allergies }).eq('id', subscriber.id); setSaving(false); if (error) alert(t('error_generic')); else { alert(t('safety_confirmed')); onUpdate(); } };
  return <section className="rounded-2xl border border-red-200 bg-white p-4"><div className="mb-3 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-600"/><div><h3 className="text-sm font-black uppercase text-primary">{t('safety_taste')}</h3><p className="text-[10px] text-primary/60">{isRtl ? 'ملاحظات سلامة الطعام لوجباتك.' : 'Kitchen safety notes for your meals.'}</p></div></div><div className="flex flex-wrap gap-2">{allergens.map((allergen) => { const selected=allergies.includes(allergen); return <button type="button" key={allergen} aria-pressed={selected} onClick={() => setAllergies((previous) => selected ? previous.filter((item) => item !== allergen) : [...previous, allergen])} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold ${selected ? 'border-red-600 bg-red-600 text-white' : 'border-primary/15 text-primary/70'}`}>{t(allergen.toLowerCase()) || allergen}</button>; })}</div><button type="button" onClick={save} disabled={saving} className="btn-primary mt-3 px-4 py-2 text-[10px]">{saving ? (isRtl ? 'جارٍ الحفظ…' : 'Saving…') : (isRtl ? 'حفظ ملاحظات سلامة الطعام' : 'Save food-safety notes')}</button></section>;
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
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Qatar', weekday: 'short' }).format(now);
    const qatarDate = new Date(`${getQatarDate(now)}T12:00:00Z`);
    const untilThursday = weekday === 'Thu' ? 0 : weekday === 'Fri' ? -1 : ({ Sat: 5, Sun: 4, Mon: 3, Tue: 2, Wed: 1 } as Record<string, number>)[weekday] ?? 0;
    if (untilThursday < 0) return 0;
    const deadline = addDays(qatarDate, untilThursday);
    deadline.setUTCHours(20, 59, 59, 999);
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
      // from dishes. Fetch the join rows separately so PostgREST can resolve them.
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
      const grouped = days.map((day) => ({
        day,
        items: {
          breakfast: menuWithIngredients.filter((row) => row.day_of_week === day && row.meal_period === 'breakfast').map((row) => row.dishes).filter(Boolean) || [],
          lunch: menuWithIngredients.filter((row) => row.day_of_week === day && row.meal_period === 'lunch').map((row) => row.dishes).filter(Boolean) || [],
          dinner: menuWithIngredients.filter((row) => row.day_of_week === day && row.meal_period === 'dinner').map((row) => row.dishes).filter(Boolean) || [],
          snacks: menuWithIngredients.filter((row) => row.day_of_week === day && row.meal_period === 'snacks').map((row) => row.dishes).filter(Boolean) || [],
        },
      }));
      setAvailableMenu(grouped);

      // Fetch User Selections
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
    <div className="space-y-6">
      <AllergyPreferences subscriber={subscriber} onUpdate={onUpdate} />
      {/* 1. Header & Week Selector */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-primary/5 shadow-lg">
        <div className="text-center">
          <p className="text-primary font-black text-[10px] uppercase tracking-[0.2em]">{t('next_week')}</p>
          <p className="text-gold text-[8px] font-bold mt-0.5 uppercase tracking-widest">{weekStart} · Cycle W{menuWeek}</p>
        </div>
      </div>

      {saveError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{isRtl ? 'تعذر تحديث قائمة الطعام:' : 'Menu update failed:'} {saveError}</p>}
      {!loading && !menuHasItems && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-semibold text-amber-900">{t('menu_not_published')}</p>}
      {qatarWeekday === 'Fri' && <p className="text-center text-[9px] font-bold text-primary/50">{t('menu_selection_closed')}</p>}

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
           <button disabled={!canEditMenu || saving} onClick={() => skipEntireDay(days[activeDayIndex])} className="text-[8px] font-black text-red-400 uppercase tracking-widest underline underline-offset-4 disabled:opacity-40">{isRtl ? 'تخطي اليوم' : 'Skip Day'}</button>
        </div>

        <div className="space-y-6">
          {availableMeals.map(mealType => {
            const sel = selections.find(s => s.day_of_week === days[activeDayIndex] && s.meal_type === mealType);
            const dishes = activeDay?.items[(mealType === 'snacks_2' ? 'snacks' : mealType) as keyof typeof activeDay.items] || [];
            const isSkipped = sel?.dish_name === 'SKIP DAY';

            if (dishes.length === 0) return null;

            return (
              <section key={mealType} className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gold">{t(mealType)}</p>
                   <div className="h-px flex-1 bg-primary/5" />
                   {isSkipped && <span className="text-[7px] font-black text-red-500 uppercase tracking-widest">{isRtl ? 'تم التخطي' : 'SKIPPED'}</span>}
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
                              <h4 className="font-serif italic text-base text-primary leading-tight truncate">{isRtl ? (dish.name_ar || dish.name) : dish.name}</h4>
                              <div className="flex gap-3 mt-1">
                                 <span className="text-[8px] font-bold text-primary/30 uppercase">{dish.kcals} KCAL</span>
                                 {dish.macros && <span className="text-[8px] font-bold text-gold uppercase">P:{dish.macros.protein} C:{dish.macros.carbs}</span>}
                              </div>
                           </div>
                           {isSelected && <CheckCircle className="w-4 h-4 text-teal fill-teal/10 shrink-0" />}
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                           <button onClick={() => setAboutMeal(dish)} className="flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-primary/5 hover:bg-primary/5">{isRtl ? 'التفاصيل' : 'About'}</button>
                           <button disabled={!canEditMenu || saving} onClick={() => setCustomizingMeal({dish, meal: mealType})} className="flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-gold/10 text-gold hover:bg-gold/5 disabled:opacity-40">{isRtl ? 'تخصيص' : 'Personalize'}</button>
                           <button
                             disabled={!canEditMenu || saving} onClick={() => pickDish(days[activeDayIndex], mealType, dish)}
                             className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                               isSelected ? 'bg-gold text-primary' : 'bg-primary/5 text-primary/60'
                             }`}
                           >
                             {isSelected ? (isRtl ? 'محدد' : 'Active') : (isRtl ? 'اختر' : 'Select')}
                           </button>
                        </div>

                        {isSelected && !hasAllergy && (
                          <button
                            disabled={!canEditMenu || saving} onClick={(e) => { e.stopPropagation(); applyWeeklyPattern(mealType, dish); }}
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-primary/40 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/40 bg-[#FDFCF7] shadow-4xl sm:max-h-[85vh] sm:rounded-[3rem]">
         <div className="flex items-center justify-between gap-3 border-b border-primary/5 bg-white/40 p-5 sm:p-10">
            <div>
               <span className="text-[10px] font-black text-gold uppercase tracking-[0.4em] mb-2 block">{isRtl ? 'تفاصيل الوجبة' : 'Meal Intel'}</span>
               <h2 className="break-words text-xl font-black tracking-tighter text-primary uppercase italic sm:text-3xl">{isRtl ? (dish.name_ar || dish.name) : dish.name}</h2>
            </div>
            <button onClick={onClose} className="p-4 hover:bg-primary/5 rounded-full transition-colors"><X className="w-8 h-8 text-primary/20" /></button>
         </div>

         <div className="flex-1 space-y-8 overflow-y-auto p-5 sm:space-y-12 sm:p-10">
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8">
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3" /> {isRtl ? 'المطبخ' : 'Culinary Origin'}</p>
                  <p className="font-serif italic text-xl text-primary">{isRtl ? (dish.origin_ar || dish.origin || 'مطبخ عالمي') : (dish.origin || 'Global Fusion')}</p>
               </div>
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3" /> {isRtl ? 'الخصائص الغذائية' : 'Integrity Tags'}</p>
                  <div className="flex gap-2">
                     {dish.isHeritage && <span className="pill bg-gold/10 text-gold text-[8px]">{isRtl ? 'تراثي' : 'HERITAGE'}</span>}
                     <span className="pill bg-teal/5 text-teal text-[8px]">{isRtl ? 'متوازن غذائياً' : 'MACRO OPTIMIZED'}</span>
                  </div>
               </div>
            </section>

            <section className="space-y-4">
               <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">{isRtl ? 'نبذة عن الطبق' : 'The History'}</h3>
               <p className="text-muted leading-relaxed italic text-lg">{isRtl ? (dish.history_ar || dish.description_ar || dish.history || dish.description) : (dish.history || dish.description)}</p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary/40">{isRtl ? 'طريقة التحضير التقليدية' : 'Traditional Craft'}</h3>
                  <p className="text-sm font-medium text-primary/60 leading-relaxed">{isRtl ? (dish.preparation_traditional_ar || dish.preparation_traditional || 'تحضير تقليدي بتوابل محلية وأساليب طهي أصيلة.') : (dish.preparation_traditional || 'Centuries of refinement using regional spices and hearth techniques.')}</p>
               </div>
               <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gold">{isRtl ? 'لمسة تراينغل' : 'Triangle Evolution'}</h3>
                  <p className="text-sm font-medium text-primary/80 leading-relaxed">{isRtl ? (dish.preparation_triangle_ar || dish.preparation_triangle || 'وصفة متوازنة للعافية الحديثة مع الحفاظ على نكهتها الأصيلة.') : (dish.preparation_triangle || 'Optimized for modern wellness without compromising cultural depth.')}</p>
               </div>
            </section>

            <section className="p-8 rounded-[2rem] bg-[#1A2E2E] text-white">
               <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#C5A059] mb-8 text-center">{isRtl ? 'القيم الغذائية' : 'Nutritional Breakdown'}</h3>
               <div className="grid grid-cols-4 gap-4 text-center">
                  <div><p className="text-2xl font-serif mb-1">{dish.kcals}</p><p className="text-[7px] opacity-40 uppercase tracking-widest">{isRtl ? 'سعرة' : 'Kcal'}</p></div>
                  <div><p className="text-2xl font-serif mb-1">{dish.macros?.protein || '--'}</p><p className="text-[7px] opacity-40 uppercase tracking-widest">{isRtl ? 'بروتين' : 'Protein'}</p></div>
                  <div><p className="text-2xl font-serif mb-1">{dish.macros?.carbs || '--'}</p><p className="text-[7px] opacity-40 uppercase tracking-widest">{isRtl ? 'كربوهيدرات' : 'Carbs'}</p></div>
                  <div><p className="text-2xl font-serif mb-1">{dish.macros?.fats || '--'}</p><p className="text-[7px] opacity-40 uppercase tracking-widest">{isRtl ? 'دهون' : 'Fats'}</p></div>
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-primary/40 backdrop-blur-md" />
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-white w-full max-w-xl max-h-[85vh] rounded-[3rem] shadow-4xl overflow-hidden flex flex-col">
         <div className="p-8 border-b border-primary/5">
            <span className="text-[9px] font-black text-gold uppercase tracking-[0.4em] mb-2 block">{isRtl ? 'تخصيص الوجبة' : 'Meal Customization'}</span>
            <h2 className="text-2xl font-black text-primary uppercase italic tracking-tighter">{isRtl ? `خصص ${dish.name_ar || dish.name}` : `Customize Your ${dish.name}`}</h2>
         </div>

         <div className="flex-1 overflow-y-auto p-8 space-y-10">
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
               <p className="text-[10px] font-black uppercase text-primary/40 mb-4 tracking-widest">{isRtl ? 'مكونات أساسية لا يمكن تغييرها' : 'Core Integrity (Non-changeable)'}</p>
               <div className="flex flex-wrap gap-2">
                  {currentIngredients.filter(i => i.is_required).map(i => (
                    <span key={i.slug} className="pill bg-white text-primary text-[9px] border border-primary/5">{i.name}</span>
                  ))}
               </div>
            </div>

            <div className="space-y-6">
               <p className="text-[10px] font-black uppercase text-gold mb-4 tracking-widest">{isRtl ? 'مكونات قابلة للتعديل' : 'Adjustable Elements'}</p>
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
                           {removed.includes(ing.slug) ? (isRtl ? 'تم الاستبعاد' : 'REMOVED') : (isRtl ? 'استبعاد' : 'REMOVE')}
                         </button>
                       )}
                    </div>

                    {!removed.includes(ing.slug) && ing.approved_substitutions && ing.approved_substitutions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-primary/30 uppercase">{isRtl ? 'بدائل معتمدة' : 'Approved Alternatives'}</p>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                           <button
                             onClick={() => { const newSubs = {...subs}; delete newSubs[ing.slug]; setSubs(newSubs); }}
                             className={`flex-shrink-0 px-4 py-2 rounded-xl text-[8px] font-black uppercase border-2 transition-all ${
                               !subs[ing.slug] ? 'border-teal bg-teal text-white' : 'border-primary/5 bg-white text-primary/40'
                             }`}
                           >{isRtl ? 'الأصلي' : 'Original'}</button>
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
               <h4 className="text-[9px] font-black text-gold uppercase mb-4 tracking-widest">{isRtl ? 'ملخص التخصيص' : 'Personalized Outcome'}</h4>
               <p className="text-sm font-medium text-primary/80 leading-relaxed italic">
                 {isRtl ? `${dish.name_ar || dish.name} مع ${Object.values(subs).length > 0 ? Object.values(subs).map(s => s.replace(/_/g, ' ')).join('، ') : 'المكونات الأصلية'}${removed.length > 0 ? ` · دون ${removed.join('، ')}` : ''}` : `${dish.name} prepared with ${Object.values(subs).length > 0 ? Object.values(subs).map(s => s.replace(/_/g, ' ')).join(', ') : 'original ingredients'}${removed.length > 0 ? ` and no ${removed.join(', ')}.` : '.'}`}
               </p>
            </div>
         </div>

         <div className="p-8 bg-gray-50 border-t border-primary/5">
            <button onClick={handleSave} className="btn-primary w-full py-5 uppercase tracking-widest text-xs">{isRtl ? 'تأكيد التخصيص' : 'Confirm My Protocol'}</button>
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
                       <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">{isRtl ? 'تم تجهيز الطلب.' : 'Package Secured.'}</h3>
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
            <div className="space-y-3">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted">{isRtl ? 'رابط الموقع من خرائط Google (اختياري)' : 'Google Maps Location Link (Optional)'}</p>
               <input
                 type="text"
                 placeholder="{isRtl ? 'ألصق رابط خرائط Google أو موقع WhatsApp' : 'Paste Google Maps URL or WhatsApp location link'}"
                 className="input-field py-4 font-black text-xs"
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
         <p className="text-xs font-medium uppercase mt-4 tracking-widest">{isRtl ? 'تتبع السائق مباشرة' : 'Live Driver Tracking'}</p>
      </div>
    </div>
  );
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
      alert(isRtl ? 'تم إرسال طلبك إلى فريق تراينغل للمراجعة.' : 'Your request has been sent to the Triangle Healthy Kitchen team for review.');
    } catch (error) { alert(error instanceof Error ? error.message : t('error_generic')); }
    finally { setUpdating(false); }
  };

  const requestDeletion = async () => {
    if (!confirm(isRtl ? 'هل تريد بالتأكيد طلب حذف الحساب؟ سيؤدي ذلك إلى إنهاء اشتراكك وحذف بياناتك وفقاً لسياسة الخصوصية.' : 'Are you sure you want to request account deletion? This will terminate your subscription and remove your data according to our privacy policy.')) return;
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
       <div className="glass-card p-12 border-primary/5 bg-white/40">
          <Shield className="w-12 h-12 text-teal mb-8" />
          <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">{t('subscription_control')}</h3>
          <p className="text-muted text-lg italic mb-10 leading-relaxed">{t('pause_desc')}</p>
          {pauseRequest ? <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900">{isRtl ? `طلب ${pauseRequest.request_type === 'pause' ? 'إيقاف' : 'استئناف'} بتاريخ ${pauseRequest.requested_date} بانتظار موافقة الفريق.` : `Your ${pauseRequest.request_type} request for ${pauseRequest.requested_date} is waiting for team approval.`}</p> : <><label className="mb-4 block text-sm font-semibold">{isRtl ? 'التاريخ المطلوب' : 'Requested date'}<input type="date" min={qatarTomorrowString()} value={requestDate} onChange={(event) => setRequestDate(event.target.value)} className="mt-2 w-full rounded-xl border border-primary/20 bg-white p-3" /></label><label className="mb-5 block text-sm font-semibold">{isRtl ? 'السبب' : 'Reason'}<input value={requestReason} onChange={(event) => setRequestReason(event.target.value)} maxLength={300} placeholder={isRtl ? 'سفر أو عمل أو سبب آخر' : 'Travel, work, or another reason'} className="mt-2 w-full rounded-xl border border-primary/20 bg-white p-3" /></label><button onClick={togglePause} disabled={updating || !['active','paused'].includes(subscriber.status) || (subscriber.status === 'paused' && !subscriber.tap_charge_id && !subscriber.last_payment_id)} className={`btn-primary w-full py-6 uppercase tracking-widest ${subscriber.status === 'active' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
             {updating ? '...' : subscriber.status === 'active' ? t('pause_plan') : subscriber.status === 'paused' ? t('resume_now') : (isRtl ? 'الخطة غير متاحة' : 'Plan unavailable')}
          </button></>}
       </div>

       <div className="glass-card p-12 border-red-500/10 bg-red-50/5">
          <ShieldAlert className="w-12 h-12 text-red-500 mb-8" />
          <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-red-500">{isRtl ? 'أمان الحساب' : 'Account Safety'}</h3>
          <p className="text-muted text-lg italic mb-10 leading-relaxed">{isRtl ? 'سيؤدي طلب حذف الحساب إلى إلغاء اشتراكك النشط وحذف بيانات ملفك من خوادمنا خلال ٣٠ يوماً.' : 'Requesting account deletion will cancel your active subscription and remove your profile data from our servers within 30 days.'}</p>
          <button onClick={requestDeletion} disabled={updating} className="flex items-center gap-3 text-red-500 font-black uppercase tracking-[0.2em] text-[10px] hover:text-red-700 transition-colors">
             <Trash2 className="w-6 h-6" /> {updating ? (isRtl ? 'جارٍ التنفيذ…' : 'PROCESSING...') : t('request_account_deletion')}
          </button>
       </div>
    </div>
  );
}
