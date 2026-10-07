import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, ChefHat, Flame, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '../supabase';
import { getUpcomingServiceWeekStart } from '../lib/date-utils';

interface MenuPageProps {
  onSubscribeClick: (pkgId?: string) => void;
}

type Dish = {
  id: string;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  kcals?: number | null;
  allergens?: string[] | null;
};

type MenuRow = {
  id: string;
  day_of_week: string;
  meal_period: string;
  dishes: Dish | Dish[] | null;
};

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'];

// Stock images are illustrative references, not photos of Triangle's plated meals.
const STOCK_IMAGES = {
  chicken: 'https://images.unsplash.com/photo-1744444202869-54debf97b285?auto=format&fit=crop&w=900&q=80',
  fish: 'https://images.unsplash.com/photo-1674655491431-ab599ebe3c06?auto=format&fit=crop&w=900&q=80',
  eggs: 'https://images.unsplash.com/photo-1494597706938-de2cd7341979?auto=format&fit=crop&w=900&q=80',
  breakfast: 'https://images.unsplash.com/photo-1676843577301-464c4ee6634a?auto=format&fit=crop&w=900&q=80',
  snack: 'https://images.unsplash.com/photo-1642588417228-170f2a073ff1?auto=format&fit=crop&w=900&q=80',
  bowl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80',
};

function stockImageFor(dish: Dish, meal: string) {
  const name = dish.name.toLowerCase();
  if (/salmon|tuna|fish|sea bass|seafood|shrimp|prawn/.test(name)) return STOCK_IMAGES.fish;
  if (/chicken|turkey/.test(name)) return STOCK_IMAGES.chicken;
  if (/snack|energy|bite|bar|ball/.test(name) || meal === 'snacks') return STOCK_IMAGES.snack;
  if (/egg|omelet|omelette|frittata|muffin/.test(name)) return STOCK_IMAGES.eggs;
  if (/beef|steak|lamb/.test(name)) return STOCK_IMAGES.bowl;
  if (/oat|porridge|chia|yogurt|yoghurt|granola/.test(name)) return STOCK_IMAGES.breakfast;
  return STOCK_IMAGES.bowl;
}

function serviceWeekBounds(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00+03:00`).toISOString();
  const endDate = new Date(`${weekStart}T12:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const end = new Date(`${endDate.toISOString().slice(0, 10)}T00:00:00+03:00`).toISOString();
  return { start, end };
}

export default function MenuPage({ onSubscribeClick }: MenuPageProps) {
  const { isRtl } = useLanguage();
  const [activeDay, setActiveDay] = useState('Saturday');
  const [rows, setRows] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [usedPreviousMenu, setUsedPreviousMenu] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadMenu() {
      setLoading(true);
      setError('');
      try {
        const serviceWeek = getUpcomingServiceWeekStart();
        const { data: prepared, error: prepareError } = await supabase.rpc('ensure_service_week_menu', { p_week_start: serviceWeek });
        if (prepareError) throw prepareError;
        if (!prepared?.ready || !prepared?.collection) {
          if (!cancelled) {
            setRows([]);
            setWeekStart(serviceWeek);
            setUsedPreviousMenu(false);
          }
          return;
        }

        const bounds = serviceWeekBounds(serviceWeek);
        const { data, error: menuError } = await supabase
          .from('menu_availability')
          .select('id,day_of_week,meal_period,dishes!inner(id,name,name_ar,description,kcals,allergens)')
          .eq('collection', prepared.collection)
          .eq('is_active', true)
          .gte('available_from', bounds.start)
          .lt('available_from', bounds.end)
          .order('day_of_week')
          .order('meal_period');
        if (menuError) throw menuError;
        if (!cancelled) {
          setRows((data || []) as unknown as MenuRow[]);
          setWeekStart(serviceWeek);
          setUsedPreviousMenu(Boolean(prepared.used_previous_menu));
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : (isRtl ? 'تعذر تحميل القائمة الحالية.' : 'The current menu could not be loaded.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadMenu();
    return () => { cancelled = true; };
  }, [isRtl]);

  const dayRows = useMemo(() => rows.filter((row) => row.day_of_week === activeDay), [rows, activeDay]);
  const dateLabel = weekStart
    ? new Intl.DateTimeFormat(isRtl ? 'ar-QA' : 'en-QA', { timeZone: 'Asia/Qatar', dateStyle: 'long' }).format(new Date(`${weekStart}T12:00:00Z`))
    : '';

  return (
    <main className={`min-h-screen bg-background px-4 pb-20 pt-28 sm:px-6 md:px-12 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-6 sm:mb-10 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <div className="badge mb-4 bg-gold/10 px-4 py-2">
              <Sparkles className="h-3.5 w-3.5 fill-gold" />
              <span className="text-[10px]">{isRtl ? 'القائمة المنشورة من المطبخ' : 'THE KITCHEN’S PUBLISHED MENU'}</span>
            </div>
            <h1 className="text-4xl font-serif italic leading-tight text-primary sm:text-5xl">
              {isRtl ? 'وجبات هذا الأسبوع' : 'This week’s menu'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary/65 sm:text-base">
              {isRtl
                ? 'تصفّح الأطباق المنشورة لهذا الأسبوع قبل اختيار باقتك. تختلف الوجبات المشمولة حسب الباقة.'
                : 'Browse the dishes the kitchen has released for the upcoming service week. The meals included depend on your plan.'}
            </p>
            {dateLabel && <p className="mt-2 text-xs font-bold text-primary/50">{isRtl ? 'يبدأ أسبوع الخدمة في' : 'Service week starts'} · {dateLabel}</p>}
          </div>
          <button onClick={() => onSubscribeClick()} className="btn-primary flex items-center justify-center gap-3 !px-7 !py-4 text-xs tracking-[0.15em]">
            {isRtl ? 'عرض الباقات والاشتراك' : 'See plans and subscribe'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </header>

        {usedPreviousMenu && <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {isRtl ? 'تعرض هذه الصفحة آخر قائمة منشورة أثناء تجهيز قائمة الأسبوع الجديد.' : 'The kitchen has carried forward its latest published menu while the new week is being prepared.'}
        </p>}

        <nav aria-label={isRtl ? 'أيام القائمة' : 'Menu days'} className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {DAYS.map((day) => (
            <button key={day} type="button" onClick={() => setActiveDay(day)} aria-pressed={activeDay === day}
              className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${activeDay === day ? 'border-primary bg-primary text-white' : 'border-primary/10 bg-white text-primary hover:bg-emerald-50'}`}>
              {isRtl ? ({ Saturday: 'السبت', Sunday: 'الأحد', Monday: 'الاثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة' } as Record<string, string>)[day] : day}
            </button>
          ))}
        </nav>

        {loading && <div className="flex min-h-56 items-center justify-center gap-3 rounded-2xl border border-primary/10 bg-white text-sm font-semibold text-primary/70"><Loader2 className="h-5 w-5 animate-spin" />{isRtl ? 'جارٍ تحميل قائمة المطبخ…' : 'Loading the kitchen menu…'}</div>}
        {!loading && error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0"/><div><p className="font-bold">{isRtl ? 'تعذر تحميل القائمة' : 'Menu unavailable'}</p><p className="mt-1">{isRtl ? 'يرجى المحاولة مرة أخرى لاحقاً أو التواصل معنا.' : 'Please try again later or contact the kitchen.'}</p></div></div>}
        {!loading && !error && rows.length === 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-950">
          <ChefHat className="mx-auto mb-3 h-7 w-7" />
          <p className="font-bold">{isRtl ? 'قائمة هذا الأسبوع قيد الإعداد' : 'This week’s menu is being prepared'}</p>
          <p className="mt-1">{isRtl ? 'ستظهر الأطباق هنا فور نشر المطبخ للقائمة.' : 'The dishes will appear here when the kitchen publishes the menu.'}</p>
        </div>}

        {!loading && !error && rows.length > 0 && <div className="space-y-8">
          {MEALS.map((meal) => {
            const dishes = dayRows.filter((row) => row.meal_period === meal).flatMap((row) => {
              const dish = Array.isArray(row.dishes) ? row.dishes[0] : row.dishes;
              return dish ? [{ ...dish, availabilityId: row.id }] : [];
            });
            if (!dishes.length) return null;
            const mealName = isRtl ? ({ breakfast: 'الإفطار', lunch: 'الغداء', dinner: 'العشاء', snacks: 'وجبات خفيفة' } as Record<string, string>)[meal] : ({ breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks' } as Record<string, string>)[meal];
            return <section key={meal} aria-labelledby={`menu-${meal}`}>
              <div className="mb-3 flex items-center gap-2"><h2 id={`menu-${meal}`} className="text-xl font-bold not-italic text-primary">{mealName}</h2><span className="rounded-full bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary/60">{dishes.length} {isRtl ? 'خيارات' : dishes.length === 1 ? 'choice' : 'choices'}</span></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dishes.map((dish) => <article key={dish.availabilityId} className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm">
                  <div className="relative aspect-[16/10] bg-emerald-50">
                    <img src={stockImageFor(dish, meal)} alt={isRtl && dish.name_ar ? dish.name_ar : dish.name} loading="lazy" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />
                    <span className="absolute bottom-2 start-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-primary/70"><ImageIcon className="h-3 w-3"/>{isRtl ? 'صورة توضيحية' : 'Illustrative photo'}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold not-italic leading-snug text-primary">{isRtl && dish.name_ar ? dish.name_ar : dish.name}</h3>
                    {dish.description && <p className="mt-2 line-clamp-3 text-sm leading-5 text-primary/65">{dish.description}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {dish.kcals != null && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900"><Flame className="h-3.5 w-3.5"/>{dish.kcals} {isRtl ? 'سعرة' : 'kcal'}</span>}
                      {(dish.allergens || []).map((allergen) => <span key={allergen} className="rounded-full border border-primary/10 px-2.5 py-1 text-xs text-primary/65">{allergen}</span>)}
                    </div>
                  </div>
                </article>)}
              </div>
            </section>;
          })}
          {dayRows.length === 0 && <p className="rounded-xl border border-primary/10 bg-white p-5 text-sm text-primary/70">{isRtl ? 'لا توجد وجبات منشورة لهذا اليوم.' : 'No dishes have been published for this day.'}</p>}
        </div>}

        <aside className="mt-10 rounded-2xl bg-primary p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div><p className="font-bold">{isRtl ? 'كل باقة تشمل وجبات مختلفة' : 'Your plan determines your included meals'}</p><p className="mt-1 text-sm text-white/75">{isRtl ? 'راجع الباقات لمعرفة الوجبات المشمولة والسعر قبل الاشتراك.' : 'Compare the meal periods and price for each package before you subscribe.'}</p></div>
          <button onClick={() => onSubscribeClick()} className="mt-4 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary sm:mt-0">{isRtl ? 'قارن الباقات' : 'Compare plans'}</button>
        </aside>
      </div>
    </main>
  );
}
