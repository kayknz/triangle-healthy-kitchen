import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

interface AuthLayoutProps {
  children: React.ReactNode;
  onBack: () => void;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, onBack, title, subtitle }: AuthLayoutProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F5F3EB] flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Editorial Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gold/10 blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary/40 hover:text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-12 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t('return_to_site')}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 sm:p-12 border-white/50 bg-white/80 backdrop-blur-xl shadow-4xl relative"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-[2rem] bg-primary flex items-center justify-center mx-auto mb-6 shadow-2xl">
               <img src="/logo.png" alt="THK" className="w-8 h-8 object-contain brightness-0 invert" />
            </div>
            <div className="badge mb-4 bg-gold/10 border-gold/20 text-gold py-1.5 px-5 mx-auto">
               <Star className="w-3 h-3 fill-gold" />
               <span className="font-black text-[9px] tracking-widest">EST. 2017</span>
            </div>
            <h1 className="text-3xl font-serif italic text-primary leading-tight mb-2 uppercase">{title}</h1>
            <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed">{subtitle}</p>
          </div>

          {children}
        </motion.div>

        <p className="text-center mt-12 text-[9px] font-black uppercase tracking-[0.5em] text-primary/20">
          © 2026 Triangle Healthy Kitchen · Doha, Qatar
        </p>
      </div>
    </div>
  );
}
