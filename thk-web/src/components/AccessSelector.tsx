import React from 'react';
import { Briefcase, User, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/LanguageContext';
import { motion } from 'framer-motion';

export default function AccessSelector() {
  const { setAccessMode, userRole } = useAuth();
  const { t, isRtl } = useLanguage();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background/95 backdrop-blur-3xl">
      <div className="max-w-3xl w-full">
        <header className="text-center mb-16">
          <div className="badge mb-6">
            <Star className="w-3 h-3 fill-gold" />
            <span>{t('identity_verification')}</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-primary tracking-tighter uppercase italic mb-4">
            Select Your <span className="text-teal">Access Mode.</span>
          </h2>
          <p className="text-muted text-sm font-medium uppercase tracking-[0.2em]">Choose your operational context for this session.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {/* Work Access */}
          <button
            onClick={() => setAccessMode('work')}
            className="glass-card p-8 sm:p-12 text-left group hover:bg-teal hover:text-white transition-all duration-700 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-food-atmosphere opacity-0 group-hover:opacity-10 grayscale transition-opacity" />
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[2rem] bg-teal/10 text-teal flex items-center justify-center mb-6 sm:mb-10 group-hover:bg-white group-hover:text-teal transition-all">
              <Briefcase className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter mb-2 group-hover:text-white transition-colors">Work Access</h3>
            <p className="text-[10px] sm:text-xs font-medium opacity-80 uppercase tracking-widest leading-relaxed mb-8 sm:mb-10 group-hover:text-white transition-colors">
              Access Operational Intelligence, manage fleet logistics, and view kitchen manifest.
            </p>
            <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] group-hover:text-gold transition-colors">
              Enter Ops <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Personal Tracking */}
          <button
            onClick={() => setAccessMode('personal')}
            className="glass-card p-8 sm:p-12 text-left group hover:bg-primary hover:text-white transition-all duration-700 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-food-atmosphere opacity-0 group-hover:opacity-10 grayscale transition-opacity" />
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[2rem] bg-primary/5 text-primary flex items-center justify-center mb-6 sm:mb-10 group-hover:bg-gold group-hover:text-white transition-all">
              <User className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter mb-2 group-hover:text-white transition-colors">Personal Tracking</h3>
            <p className="text-[10px] sm:text-xs font-medium opacity-80 uppercase tracking-widest leading-relaxed mb-8 sm:mb-10 group-hover:text-white transition-colors">
              Monitor your bio-metrics, track your daily nutrition plan, and manage your shipments.
            </p>
            <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] group-hover:text-gold transition-colors">
              View My Plan <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        <div className="mt-16 text-center">
           <p className="text-[9px] font-black text-muted uppercase tracking-[0.4em] opacity-40">Triangle Healthy Kitchen — Doha, Qatar</p>
        </div>
      </div>
    </div>
  );
}
