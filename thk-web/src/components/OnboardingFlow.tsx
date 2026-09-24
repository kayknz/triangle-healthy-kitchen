import React, { useState } from 'react';
import { ChevronRight, Check, Star, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/LanguageContext';
import { motion } from 'framer-motion';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user, refreshAuth } = useAuth();
  const { t, isRtl } = useLanguage();
  const [gender, setStepGender] = useState<'male' | 'female'>('male');
  const [submitting, setSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          gender,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'Member',
          status: 'pending'
        }, { onConflict: 'user_id' });

      if (error && error.message?.includes('gender')) {
        const { error: fallbackError } = await supabase
          .from('subscribers')
          .upsert({
            user_id: user.id,
            onboarding_completed: true,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'Member',
            status: 'pending'
          }, { onConflict: 'user_id' });
        if (fallbackError) throw fallbackError;
      } else if (error) {
        throw error;
      }

      await refreshAuth();
      onComplete();
    } catch (e) {
      console.error('Onboarding sync failure:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-[#F5F3EB] flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-[0.05] bg-food-atmosphere pointer-events-none grayscale" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full space-y-16 relative z-10"
      >
        <div className="text-center space-y-8">
          <div className="badge mx-auto bg-gold/10 border-gold/20 py-2.5 px-6">
            <Star className="w-3.5 h-3.5 fill-gold animate-glow" />
            <span className="font-black tracking-[0.5em] text-[10px] text-gold uppercase">Phase 01: Identification</span>
          </div>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-serif italic text-[#123F38] leading-[0.9] tracking-tighter">
            Define Your<br />
            <span className="text-[#123F38]/40 font-sans font-black uppercase not-italic tracking-tighter text-3xl sm:text-5xl">Biology.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setStepGender(g)}
              className={`group relative p-12 rounded-[3.5rem] border-2 transition-all duration-700 glass-card bg-white/40 ${
                gender === g ? 'border-primary bg-primary text-ivory shadow-4xl scale-105' : 'border-primary/5 hover:border-gold/30'
              }`}
            >
              <div className="flex flex-col items-center text-center gap-8">
                <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center border-2 transition-all duration-700 ${
                  gender === g ? 'bg-white/10 border-white/20' : 'bg-primary/5 border-primary/10'
                }`}>
                  {gender === g ? <Check className="w-8 h-8 text-white" /> : <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />}
                </div>
                <div>
                  <p className="text-2xl font-black uppercase tracking-tighter italic leading-none">{t(g)}</p>
                  <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-3 ${gender === g ? 'text-gold' : 'text-primary/30'}`}>Protocol Type</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-8">
           <button
             onClick={handleComplete}
             disabled={submitting}
             className="w-full btn-primary py-8 shadow-4xl text-sm flex items-center justify-center gap-4 active:scale-95"
           >
             {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'GET STARTED'}
           </button>

           <p className="text-center text-[10px] font-black text-primary/20 uppercase tracking-[0.5em]">
             Triangle Healthy Kitchen — Doha, Qatar
           </p>
        </div>
      </motion.div>
    </div>
  );
}
