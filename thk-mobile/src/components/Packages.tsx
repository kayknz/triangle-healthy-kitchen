import React from 'react';
import { Check, ShieldCheck, Star } from 'lucide-react';
import { PACKAGES } from '../types/booking';
import { useLanguage } from '../lib/LanguageContext';
import AnimatedSection from '../components/AnimatedSection';

interface PlansPageProps {
  onSubscribeClick: (pkgId: string) => void;
}

export default function PlansPage({ onSubscribeClick }: PlansPageProps) {
  const { t, isRtl } = useLanguage();

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-32">
          {PACKAGES.map((pkg) => (
            <AnimatedSection key={pkg.id}>
              <div className="glass-card h-full flex flex-col p-6 group">
                <div className="relative h-60 overflow-hidden rounded-[2rem] mb-8">
                  <img src={pkg.image} alt={t(pkg.id)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-gold text-[9px] font-black uppercase tracking-widest mb-1">{t(pkg.highlight)}</p>
                    <h3 className="text-white text-2xl font-black uppercase italic tracking-tighter">{t(pkg.name)}</h3>
                  </div>
                </div>

                <div className="px-4 flex-1">
                  <div className="flex items-center gap-2 mb-8">
                    <span className="text-4xl font-black text-primary tracking-tighter">{pkg.price}</span>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                      QR / {pkg.duration === '1_day' ? t('day') : pkg.duration === '1_week' ? t('week') : t('month')}
                    </span>
                  </div>

                  <div className="space-y-4 mb-10">
                     {[
                       t(pkg.meals_key || '3_main_meals'),
                       pkg.kcals + ' ' + t('kcal'),
                       t('continuous_delivery'),
                       t('tribe_status')
                     ].map((feature) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
