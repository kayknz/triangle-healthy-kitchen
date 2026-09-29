import React, { useEffect, useState } from 'react';
import { Check, Star } from 'lucide-react';
import { PACKAGES } from '../types/booking';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import AnimatedSection from '../components/AnimatedSection';

interface PlansPageProps {
  onSubscribeClick: (pkgId: string) => void;
}

export default function PlansPage({ onSubscribeClick }: PlansPageProps) {
  const { t } = useLanguage();
  const [packages, setPackages] = useState<Array<{ id: string; name: string; description: string | null; price: number; currency: string; kcals: number; duration: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (cancelled || settled) return;
      settled = true;
      setLoadError(true);
      setLoading(false);
    }, 15000);
    void Promise.resolve(supabase.from('packages')
      .select('id, name, description, price, currency, kcals, duration')
      .eq('active', true)
      .order('sort_order'))
      .then(({ data, error }) => {
        if (cancelled || settled) return;
        settled = true;
        window.clearTimeout(timeout);
        setPackages(data || []);
        setLoadError(Boolean(error));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled || settled) return;
        settled = true;
        window.clearTimeout(timeout);
        setLoadError(true);
        setLoading(false);
      });
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [retryCount]);

  return (
    <div className="min-h-screen bg-background py-32 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 grayscale bg-food-atmosphere" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="text-center mb-24 max-w-3xl mx-auto">
          <div className="badge mb-8 mx-auto">
            <Star className="w-2.5 h-2.5 fill-gold" />
            <span>{t('premium_experience')}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-primary leading-[1] tracking-tighter uppercase italic mb-8">
            Curated<br />
            <span className="text-sage">Nutrition.</span>
          </h1>
          <p className="text-muted text-lg md:text-xl font-medium italic leading-relaxed">
            {t('packages_subtitle')}
          </p>
        </header>

        {loading && <p className="mb-20 text-center text-muted" role="status">Loading meal plans…</p>}
        {!loading && loadError && <div className="mb-20 text-center text-red-700" role="alert"><p>Meal plans are temporarily unavailable. Please try again shortly.</p><button type="button" className="mt-3 underline" onClick={() => { setLoading(true); setLoadError(false); setRetryCount((count) => count + 1); }}>Try again</button></div>}
        {!loading && !loadError && packages.length === 0 && <p className="mb-20 text-center text-muted">No meal plans are available right now.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          {packages.map((pkg) => {
            const details = PACKAGES.find((item) => item.id === pkg.id);
            const title = t(pkg.id) !== pkg.id ? t(pkg.id) : pkg.name;
            return (
            <AnimatedSection key={pkg.id}>
              <div className="glass-card h-full flex flex-col p-6 sm:p-8 group">
                <div className="relative h-60 overflow-hidden rounded-[2rem] mb-8">
                  <img src={details?.image || ''} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-gold text-[9px] font-black uppercase tracking-widest mb-1">{details ? t(details.highlight) : t('premium')}</p>
                    <h3 className="text-white text-2xl font-black uppercase italic tracking-tighter">{title}</h3>
                  </div>
                </div>

                <div className="px-4 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-8 border-b border-primary/5 pb-6">
                    <span className="whitespace-nowrap text-3xl sm:text-4xl font-black text-primary tracking-tighter">{pkg.price.toLocaleString()} <span className="text-xs">{pkg.currency}</span></span>
                    <span className="min-w-0 text-[10px] font-bold text-gold uppercase tracking-widest break-words">
                      {pkg.id === 'daily_trial' ? '1 Day Trial' : pkg.id === 'weekly_reset' ? '6 Day Trial' : ['1100kcal', '1400kcal', '1500kcal'].includes(pkg.id) ? '24 Service Days' : pkg.duration || t('month')}
                    </span>
                  </div>

                  <div className="space-y-4 mb-10">
                     {[
                       details ? t(details.meals_key || '3_main_meals') : pkg.description,
                       pkg.kcals + ' ' + t('kcal'),
                       t('continuous_delivery')
                     ].filter(Boolean).map((feature) => (
                       <div key={feature} className="flex items-center gap-4">
                         <div className="w-5 h-5 rounded-full bg-sage/10 flex items-center justify-center">
                           <Check className="w-3 h-3 text-sage" />
                         </div>
                         <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.15em]">{feature}</span>
                       </div>
                     ))}
                  </div>
                </div>

                <button
                  onClick={() => onSubscribeClick(pkg.id)}
                  className="w-full btn-primary py-5 text-[11px] tracking-[0.3em] font-black"
                >
                  {t('hero_cta_book')}
                </button>
              </div>
            </AnimatedSection>
          );})}
        </div>
      </div>
    </div>
  );
}
