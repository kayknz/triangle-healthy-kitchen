import { Clock3, Sparkles } from 'lucide-react';
import { usePackages } from '@/lib/packages';
import { PACKAGES } from '@/types/booking';
import { useLanguage } from '@/lib/LanguageContext';

interface PlansPageProps {
  onSubscribeClick: (pkgId: string) => void;
}

export default function PlansPage({ onSubscribeClick }: PlansPageProps) {
  const { t, isRtl } = useLanguage();
  const { packages } = usePackages();
  const monthlyPlans = packages.filter((pkg) => !['daily_trial', 'weekly_reset'].includes(pkg.id));
  const trialPlans = packages.filter((pkg) => ['daily_trial', 'weekly_reset'].includes(pkg.id));

  const text = (key: string, fallback: string) => {
    const translated = t(key);
    return translated && translated !== key ? translated : fallback;
  };

  const mealLabel = (id: string, mealKey?: string) => {
    if (id === 'daily_trial' || id === 'weekly_reset') {
      return text('3_meals_1_snack', isRtl ? '٣ وجبات + سناك واحد' : '3 meals + 1 snack');
    }
    const key = mealKey || PACKAGES.find((item) => item.id === id)?.meals_key;
    if (key) return text(key, key.replace(/_/g, ' '));
    return isRtl ? 'وجبات حسب الخطة' : 'Meals as listed in this plan';
  };

  const titleFor = (id: string, fallback: string) => text(id, fallback);
  const currency = (value: string) => value.toUpperCase() === 'QR' ? 'QAR' : value;

  const PlanCard = ({ plan, isTrial = false }: { plan: (typeof packages)[number]; isTrial?: boolean }) => {
    const serviceDays = isTrial
      ? plan.id === 'daily_trial'
        ? text('plan_one_day', isRtl ? 'يوم واحد' : '1 day')
        : text('plan_six_days', isRtl ? '٦ أيام' : '6 days')
      : text('plan_24_days', isRtl ? '٢٤ يوم خدمة' : '24 service days');

    return (
      <article key={plan.id} className="rounded-3xl border border-primary/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            {isTrial && <span className="mb-2 inline-flex rounded-full bg-gold/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary/70">{text('trial', isRtl ? 'تجربة' : 'Trial')}</span>}
            <h3 className="text-lg font-black leading-tight text-primary sm:text-xl">{titleFor(plan.id, plan.name)}</h3>
          </div>
          <p className="shrink-0 text-right text-xl font-black tracking-tight text-primary sm:text-2xl">
            {plan.price.toLocaleString()} <span className="text-xs font-bold">{currency(plan.currency)}</span>
            {!isTrial && <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-primary/50">{text('per_month', isRtl ? 'شهرياً' : 'per month')}</span>}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-sage/10 px-3 py-1.5 text-xs font-bold text-primary">{mealLabel(plan.id, plan.meals)}</span>
          <span className="rounded-full bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary/70">{plan.kcals.toLocaleString()} {text('calories_per_day', isRtl ? 'سعرة حرارية يومياً' : 'Calories per day')}</span>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-primary/60">
          <Clock3 className="h-4 w-4 text-gold" />
          <span>{serviceDays}</span>
        </div>

        <button
          type="button"
          onClick={() => onSubscribeClick(plan.id)}
          className="mt-5 w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-black text-white transition-colors hover:bg-teal"
        >
          {text('choose_plan', isRtl ? 'اختر هذه الخطة' : 'Choose this plan')}
        </button>
      </article>
    );
  };

  return (
    <section className="relative overflow-hidden bg-background px-5 pb-12 pt-2 sm:px-8 sm:pb-16 sm:pt-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gold">
            <Sparkles className="h-4 w-4" />
            {text('plan_summary', isRtl ? 'ملخص الخطط' : 'Plans at a glance')}
          </div>
          <h2 className="text-3xl font-black leading-tight tracking-tight text-primary sm:text-4xl">
            {text('packages_title', isRtl ? 'اختر خطتك' : 'Choose your plan')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
            {text('plan_summary_hint', isRtl ? 'قارن الوجبات والسعرات وأيام الخدمة قبل الاختيار.' : 'Compare meals, calories and service days before you choose.')}
          </p>
          <p className="mt-4 rounded-2xl border border-gold/25 bg-gold/10 px-4 py-3 text-sm font-bold leading-relaxed text-primary">
            {text('plan_days_price_summary', isRtl ? 'الخطط الشهرية تشمل ٢٤ يوم خدمة. وجبات وتوصيل الجمعة إضافة اختيارية بـ١٩٩ ريالاً قطرياً شهرياً.' : 'Monthly plans include 24 service days. Friday meals and delivery are optional for 199 QAR/month.')}
          </p>
        </header>

        {monthlyPlans.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {monthlyPlans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
          </div>
        ) : (
          <p className="rounded-2xl border border-primary/10 bg-white p-5 text-sm text-muted">{text('plans_unavailable', isRtl ? 'الخطط غير متاحة حالياً.' : 'Plans are temporarily unavailable.')}</p>
        )}

        {trialPlans.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-3 text-lg font-black text-primary">{text('try_first', isRtl ? 'جرّب قبل الاشتراك' : 'Try before you subscribe')}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {trialPlans.map((plan) => <PlanCard key={plan.id} plan={plan} isTrial />)}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
