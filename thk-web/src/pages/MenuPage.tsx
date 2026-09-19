import React, { useState } from 'react';
import { ChefHat, Flame, Sparkles, ChevronRight, Utensils, Star, Plus } from 'lucide-react';
import { WEEKLY_MENU } from '../data/menu'; // Synchronized Data Source
import { useLanguage } from '../lib/LanguageContext';
import AnimatedSection from '../components/AnimatedSection';

interface MenuPageProps {
  onSubscribeClick: (pkgId?: string) => void;
}

export default function MenuPage({ onSubscribeClick }: MenuPageProps) {
  const { t, isRtl } = useLanguage();

  // Filter for Week 1 of the current season (Standard logic)
  const menuData = WEEKLY_MENU.filter(d => d.week === 1 && d.collection === 'summer');
  const [activeDay, setActiveDay] = useState(menuData[0] || WEEKLY_MENU[0]);

  return (
    <div className="min-h-screen bg-background py-32 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-[60vh] bg-food-atmosphere opacity-5 grayscale pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-12 mb-24 sm:mb-32 ${isRtl ? 'text-right' : 'text-left'}`}>
          <div className="max-w-2xl">
            <div className="badge mb-10 bg-gold/10 border-gold/20 py-2.5 px-6">
              <Sparkles className="w-3.5 h-3.5 fill-gold animate-glow" />
              <span className="font-black tracking-[0.5em] text-[10px] text-gold uppercase">Culinary Collections</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-serif italic text-primary leading-[0.9] tracking-tighter drop-shadow-xl">
              Seasonal<br />
              <span className="text-gold selection:bg-gold selection:text-primary">Signatures.</span>
            </h1>
          </div>

          <div className="flex flex-wrap gap-3 p-2 bg-white/40 backdrop-blur-[100px] rounded-[2.5rem] border border-white/20 shadow-4xl overflow-x-auto no-scrollbar touch-pan-x">
            {menuData.map((day) => (
              <button
                key={day.day}
                onClick={() => setActiveDay(day)}
                className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap ${
                  activeDay.day === day.day
                    ? 'bg-primary text-ivory shadow-3xl scale-105'
                    : 'text-primary/60 hover:text-primary hover:bg-white/50'
                }`}
              >
                {t(day.day)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-20">
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((mealType) => (
            <AnimatedSection key={mealType}>
              <div className="glass-card p-12 h-full bg-white/5 backdrop-blur-[80px] border-white/20 shadow-4xl hover:shadow-gold/5">
                <div className="flex items-center justify-between mb-12 pb-8 border-b border-primary/5">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-primary/5 flex items-center justify-center group-hover:bg-gold transition-colors">
                      <Utensils className="w-8 h-8 text-primary/40 group-hover:text-primary" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif italic text-primary leading-none">{t(mealType)}</h3>
                      <p className="text-gold text-[10px] font-black uppercase tracking-[0.3em] mt-3 italic">{t('chef_tailored')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-primary/10" />
                </div>

                <div className="space-y-10">
                  {activeDay.items[mealType]?.map((item: any, idx: number) => (
                    <div key={idx} className="group cursor-default">
                      <div className="flex items-start justify-between gap-8">
                        <div>
                          <h4 className="text-xl font-serif italic text-primary leading-tight group-hover:text-gold transition-colors duration-500">
                            {isRtl && item.name_ar ? item.name_ar : item.name}
                          </h4>
                          <div className="flex items-center gap-5 mt-5">
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-background/50 rounded-full border border-primary/5">
                              <Flame className="w-3.5 h-3.5 text-gold animate-glow" />
                              <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em]">{item.kcals} {t('kcal')}</span>
                            </div>
                            {item.isHeritage && (
                              <div className="badge border-gold/20 bg-gold/5 scale-95">
                                <Star className="w-3 h-3 fill-gold text-gold" />
                                <span className="text-gold font-black tracking-widest">{t('heritage')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const targetPkg = item.kcals <= 1100 ? '1100kcal' : item.kcals <= 1400 ? '1400kcal' : '1500kcal';
                            onSubscribeClick(targetPkg);
                          }}
                          className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold hover:bg-gold hover:text-primary transition-all duration-500 mt-2 flex-shrink-0"
                          title="Integrate into Plan"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <div className="mt-32 p-16 sm:p-24 glass-card bg-primary flex flex-col lg:flex-row items-center justify-between gap-16 relative overflow-hidden border-none shadow-4xl group">
          <div className="absolute inset-0 bg-food-atmosphere opacity-10 grayscale pointer-events-none group-hover:scale-105 transition-transform duration-[10s]" />
          <div className="relative z-10 max-w-2xl text-center lg:text-left">
            <h3 className="text-5xl sm:text-7xl font-serif italic tracking-tight mb-8 text-white">Bio-Synchronous Intake.</h3>
            <p className="text-white opacity-100 text-xl italic font-bold leading-tight tracking-tighter">
              {t('based_on_metrics')}
            </p>
          </div>
          <button
            onClick={() => onSubscribeClick()}
            className="relative z-10 btn-primary bg-gold text-primary hover:bg-white hover:text-primary !px-20 !py-8 scale-110 shadow-gold/20"
          >
            {t('hero_cta_book')}
          </button>
        </div>
      </div>
    </div>
  );
}
