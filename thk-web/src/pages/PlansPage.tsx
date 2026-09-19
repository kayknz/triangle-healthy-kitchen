import React from 'react';
import { Check, ShieldCheck, Star, ArrowRight, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PACKAGES } from '../types/booking';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/auth';
import AnimatedSection from '../components/AnimatedSection';

interface PlansPageProps {
  onSubscribeClick: (pkgId: string) => void;
}

export default function PlansPage({ onSubscribeClick }: PlansPageProps) {
  const { t, isRtl } = useLanguage();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const isSubscribed = user && userRole === 'subscriber';

  return (
    <div className="min-h-screen bg-background py-32 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 grayscale bg-food-atmosphere pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="text-center mb-24 max-w-3xl mx-auto">
          <div className="badge mb-8 mx-auto bg-gold/10 border-gold/20 text-gold py-2 px-6">
            <Star className="w-3.5 h-3.5 fill-gold animate-glow" />
            <span className="font-black tracking-[0.4em] uppercase text-[10px]">{t('premium_experience')}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-primary leading-[1] tracking-tighter uppercase italic mb-8">
            Curated<br />
            <span className="text-gold selection:bg-gold selection:text-primary">Nutrition.</span>
          </h1>
          <p className="text-primary/60 text-lg md:text-xl font-medium italic leading-relaxed">
            {t('packages_subtitle')}
          </p>
        </header>

        {isSubscribed && (
          <div className="mb-20 glass-card p-12 bg-primary text-white border-none shadow-4xl relative overflow-hidden rounded-[4rem] group hover:scale-[1.01] transition-all duration-700">
             <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-gold/20 transition-all" />
             <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/5">
                         <ShieldCheck className="w-6 h-6 text-gold" />
                      </div>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter">Active Protocol Identified.</h3>
                   </div>
                   <p className="text-white/60 text-lg italic max-w-xl">
                      You are currently enrolled in a Triangle protocol. To modify your current selections or track your biological momentum, enter your personal workstation.
                   </p>
                </div>
                <button
                  onClick={() => navigate('/account')}
                  className="btn-primary !bg-gold !text-primary px-16 py-8 flex items-center gap-4 shadow-2xl scale-110 active:scale-95"
                >
                   ACCESS DASHBOARD <ArrowRight className="w-5 h-5" />
                </button>
             </div>
          </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32 ${isSubscribed ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
          {PACKAGES.map((pkg) => (
            <AnimatedSection key={pkg.id}>
              <div className="glass-card h-full flex flex-col p-8 group border-white/20 bg-white/5 backdrop-blur-[80px] hover:border-gold/30 transition-all duration-700">
                <div className="relative h-64 overflow-hidden rounded-[2.5rem] mb-10 shadow-3xl border border-white/10">
                  <img src={pkg.image} alt={t(pkg.id)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[6s]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <p className="text-gold text-[9px] font-black uppercase tracking-[0.4em] mb-2">{t(pkg.highlight)}</p>
                    <h3 className="text-white text-2xl font-serif italic tracking-tight uppercase leading-none">{t(pkg.name)}</h3>
                  </div>
                </div>

                <div className="px-2 flex-1">
                  <div className="flex items-center gap-3 mb-10 border-b border-primary/5 pb-8">
                    <span className="text-5xl font-serif italic text-primary tracking-tighter">{pkg.price}</span>
                    <div className="h-8 w-px bg-primary/5 mx-2" />
                    <span className="text-[10px] font-black text-gold uppercase tracking-[0.4em]">
                      {pkg.duration === '1_day' ? t('day') : pkg.duration === '1_week' ? t('week') : t('month')}
                    </span>
                  </div>

                  <div className="space-y-6 mb-12">
                     {[
                       t(pkg.meals_key || '3_main_meals'),
                       pkg.kcals + ' ' + t('kcal'),
                       t('continuous_delivery'),
                       'Regional Tribe Access'
                     ].map((feature) => (
                       <div key={feature} className="flex items-center gap-5 group/feature">
                         <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center group-hover/feature:bg-gold transition-colors">
                           <Check className="w-3.5 h-3.5 text-gold group-hover:text-primary transition-colors" />
                         </div>
                         <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{feature}</span>
                       </div>
                     ))}
                  </div>
                </div>

                <button
                  onClick={() => onSubscribeClick(pkg.id)}
                  className="w-full btn-primary scale-105 active:scale-95 shadow-2xl"
                >
                  {isSubscribed ? 'UPGRADE PROTOCOL' : t('hero_cta_book')}
                </button>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {isSubscribed && (
          <div className="text-center">
             <button
               onClick={() => navigate('/account')}
               className="text-primary/30 hover:text-gold transition-all text-[11px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-3 mx-auto"
             >
                <RefreshCcw className="w-4 h-4" /> Return to personal workstation
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
