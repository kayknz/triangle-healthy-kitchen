import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Ruler, Activity, Target, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export default function RhythmCalculator() {
  const { t, isRtl } = useLanguage();
  const [metrics, setMetrics] = useState({
    weight: 75,
    height: 180,
    age: 30,
    activity: 'moderate',
    goal: 'maintain'
  });

  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    // Mifflin-St Jeor Equation
    const bmr = (10 * metrics.weight) + (6.25 * metrics.height) - (5 * metrics.age) + 5;
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      moderate: 1.5,
      active: 1.8
    };
    const tdee = bmr * (multipliers[metrics.activity] || 1.2);
    const goalMultipliers: Record<string, number> = {
      lose: 0.8,
      maintain: 1.0,
      gain: 1.2
    };
    setResult(Math.round(tdee * (goalMultipliers[metrics.goal] || 1.0)));
  };

  const getRecommendedPlan = (calories: number) => {
    if (calories >= 1800) return 'signature_custom';
    if (calories >= 1450) return '1500kcal';
    if (calories >= 1250) return '1400kcal';
    return '1100kcal';
  };

  return (
    <div className="glass-card p-8 sm:p-16 border-white/30 bg-white/5 backdrop-blur-3xl shadow-4xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[80px] -mr-32 -mt-32" />

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="badge mb-6 bg-gold/10 border-gold/20 py-2.5 px-6 mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="font-black tracking-[0.5em] text-[10px] text-gold uppercase">{t('biological_audit')}</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-serif italic text-primary leading-none tracking-tight">
            {t('discover_your_rhythm')}<br />
            <span className="text-primary/40 font-sans font-black uppercase not-italic tracking-tighter">{t('rhythm.')}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16">
          <div className="space-y-10">
            <div className="space-y-6">
              <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">
                {t('weight')} <span className="text-gold">KG</span>
              </label>
              <input
                type="range" min="40" max="150" value={metrics.weight}
                onChange={(e) => setMetrics({...metrics, weight: parseInt(e.target.value)})}
                className="w-full accent-gold bg-primary/5 h-1.5 rounded-full appearance-none cursor-pointer"
              />
              <p className="text-4xl font-serif italic text-primary">{metrics.weight}<span className="text-xs font-sans not-italic ml-2 uppercase opacity-20">kg</span></p>
            </div>

            <div className="space-y-6">
              <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">
                {t('height')} <span className="text-gold">CM</span>
              </label>
              <input
                type="range" min="140" max="220" value={metrics.height}
                onChange={(e) => setMetrics({...metrics, height: parseInt(e.target.value)})}
                className="w-full accent-gold bg-primary/5 h-1.5 rounded-full appearance-none cursor-pointer"
              />
              <p className="text-4xl font-serif italic text-primary">{metrics.height}<span className="text-xs font-sans not-italic ml-2 uppercase opacity-20">cm</span></p>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 block">{t('energy_output')}</label>
              <div className="flex gap-4">
                {['sedentary', 'moderate', 'active'].map((a) => (
                  <button
                    key={a}
                    onClick={() => setMetrics({...metrics, activity: a})}
                    className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${
                      metrics.activity === a ? 'border-primary bg-primary text-ivory shadow-xl' : 'border-primary/10 bg-white/40 text-primary/60'
                    }`}
                  >
                    {t(a)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 block">{t('ambition')}</label>
              <div className="flex gap-4">
                {['lose', 'maintain', 'gain'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setMetrics({...metrics, goal: g})}
                    className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${
                      metrics.goal === g ? 'border-gold bg-gold text-primary shadow-xl' : 'border-primary/10 bg-white/40 text-primary/60'
                    }`}
                  >
                    {t(g)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 sm:mt-24 text-center">
          <button
            onClick={calculate}
            className="btn-primary px-16 py-8 scale-110 shadow-4xl group"
          >
            {t('formulate_plan')}
            <ArrowRight className="w-5 h-5 ml-4 inline-block group-hover:translate-x-2 transition-transform" />
          </button>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-20 pt-20 border-t border-primary/5"
              >
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gold mb-6">{t('calculated_daily_target')}</p>
                  <div className="flex items-end gap-4 mb-10">
                    <h3 className="text-7xl sm:text-9xl font-serif italic text-primary leading-none">{result}</h3>
                    <p className="text-primary/40 text-xl font-black uppercase tracking-widest mb-4">Kcal</p>
                  </div>
                  <div className="p-8 rounded-[3rem] bg-primary text-ivory max-w-md w-full shadow-4xl flex items-center justify-between">
                     <div className="text-left">
                        <p className="text-gold text-[9px] font-black uppercase tracking-widest mb-1">{t('recommended_protocol')}</p>
                        <h4 className="text-2xl font-serif italic uppercase leading-none">{t(getRecommendedPlan(result))}</h4>
                     </div>
                     <Activity className="w-10 h-10 text-gold animate-glow" />
                  </div>
                  <div className="flex items-center gap-3 mt-12 text-primary/60 max-w-sm mx-auto">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-[10px] italic font-medium leading-relaxed">
                      {t('educational_estimate')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
