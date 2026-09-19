import { useState, useRef } from 'react';
import { Menu, X, UserCircle, Languages, Star, Calendar, Users, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/auth';

interface NavbarProps {
  onBookClick: () => void;
  onSubscribeClick: () => void;
}

export default function Navbar({ onBookClick, onSubscribeClick }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const { language, setLanguage, t, isRtl } = useLanguage();
  const { session } = useAuth();

  const logoTaps = useRef(0);
  const lastTapTime = useRef(0);
  const handleLogoClick = async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
    const now = Date.now();
    if (now - lastTapTime.current < 600) {
      logoTaps.current += 1;
    } else {
      logoTaps.current = 1;
    }
    lastTapTime.current = now;

    if (logoTaps.current >= 5) {
      logoTaps.current = 0;
      setOpen(false); // Close mobile menu if open
      window.location.hash = '#provider';
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const baseLinks = [
    { label: t('nav_about') || 'About', href: '#about' },
    { label: t('nav_packages') || 'Packages', href: '#packages' },
    { label: t('nav_menu') || 'Menu', href: '#menu' },
    { label: t('nav_contact') || 'Contact', href: '#contact' },
  ];

  const premiumLinks = [
    { label: t('Today') || 'My Rhythm', href: '#today', icon: Calendar },
    { label: t('Community') || 'Community', href: '#community', icon: Users },
    { label: t('Rewards') || 'Rewards', href: '#rewards', icon: Gift },
  ];

  const toggleLanguage = async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleBookClick = async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
    onBookClick();
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-[#F5F3EB]/90 backdrop-blur-xl border-b border-[#123F38]/10 shadow-sm px-3 sm:px-6 md:px-12 safe-top"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20">
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 sm:gap-3 group transition-transform active:scale-95"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 overflow-hidden group-hover:scale-105 transition-transform duration-500 flex-shrink-0">
            <img src="/logo.png" alt="Triangle logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col leading-none text-left">
            <p
              className="font-black text-[11px] sm:text-[12px] tracking-[0.25em] text-[#123F38] whitespace-nowrap uppercase italic"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {t('Triangle') || 'Triangle'}
            </p>
            <p className="font-bold text-[7px] sm:text-[8px] tracking-[0.1em] text-[#123F38]/60 whitespace-nowrap uppercase">
              {t('Healthy Kitchen') || 'Healthy Kitchen'}
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {baseLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={async () => await Haptics.impact({ style: ImpactStyle.Light })}
              className="text-[#123F38]/70 font-black text-[10px] uppercase tracking-widest hover:text-[#123F38] transition-colors"
            >
              {l.label}
            </a>
          ))}

          {/* Fully Integrated Premium Navigation Sections */}
          <div className="flex items-center gap-6 border-l border-[#123F38]/20 pl-6 ml-2">
            {premiumLinks.map((pl) => {
              const Icon = pl.icon;
              return (
                <a
                  key={pl.label}
                  href={pl.href}
                  onClick={async () => await Haptics.impact({ style: ImpactStyle.Light })}
                  className="text-[#123F38]/80 font-black text-[10px] uppercase tracking-widest hover:text-[#C5A059] transition-colors flex items-center gap-1.5"
                >
                  <Icon className="w-3.5 h-3.5 text-[#C5A059]" /> {pl.label}
                </a>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#123F38]/5 hover:bg-[#123F38]/10 text-[#123F38] font-black transition-all text-[10px] uppercase tracking-widest border border-[#123F38]/5"
          >
            <Languages className="w-3 h-3 text-[#C5A059]" />
            {language === 'en' ? 'ع' : 'EN'}
          </button>

          <a
            href="#my-plan"
            className="hidden sm:flex items-center gap-1.5 text-[#123F38] font-black text-[10px] uppercase tracking-widest hover:text-[#C5A059] transition-colors"
          >
            <UserCircle className="w-4 h-4 text-[#C5A059]" />
            {t('nav_my_plan') || 'My Plan'}
          </a>

          <button
            onClick={handleBookClick}
            className="hidden md:block bg-[#123F38] text-[#F5F3EB] font-black text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-[#123F38]/20"
          >
            {t('nav_book') || 'Begin Journey'}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={async () => {
              await Haptics.impact({ style: ImpactStyle.Light });
              setOpen(!open);
            }}
            className="lg:hidden p-2 text-[#123F38]/70 hover:text-[#123F38] transition-all"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-[#F5F3EB] border-b border-[#123F38]/5 shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-12 space-y-8 flex flex-col items-center text-center">
              {baseLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={async () => {
                    await Haptics.selection();
                    setOpen(false);
                  }}
                  className="text-xs font-black tracking-[0.4em] uppercase text-[#123F38]/60 hover:text-[#123F38] transition-colors"
                >
                  {l.label}
                </a>
              ))}

              {/* Mobile Premium Integrated Sections */}
              <div className="flex flex-col gap-5 py-4 w-full border-y border-[#123F38]/10">
                {premiumLinks.map((pl) => {
                  const Icon = pl.icon;
                  return (
                    <a
                      key={pl.label}
                      href={pl.href}
                      onClick={() => setOpen(false)}
                      className="text-[11px] font-black tracking-[0.3em] uppercase text-[#123F38]/90 flex items-center justify-center gap-3 transition-colors hover:text-[#C5A059]"
                    >
                      <Icon className="w-4 h-4 text-[#C5A059]" /> {pl.label}
                    </a>
                  );
                })}
              </div>

              <div className="flex flex-col gap-6 w-full max-w-[240px]">
                <a
                  href="#my-plan"
                  onClick={() => setOpen(false)}
                  className="text-[10px] font-black tracking-[0.3em] uppercase text-[#123F38]/60 hover:text-[#C5A059]"
                >
                  {t('nav_my_plan') || 'MY PLAN PROTOCOL'}
                </a>
                <button
                  onClick={() => { setOpen(false); onBookClick(); }}
                  className="bg-[#123F38] text-[#F5F3EB] py-5 rounded-2xl text-[11px] font-black tracking-[0.4em] uppercase shadow-xl hover:bg-[#123F38]/90 transition-all"
                >
                  {t('nav_book') || 'BEGIN EXCELLENCE JOURNEY'}
                </button>
              </div>

              <div className="pt-8">
                 <div className="badge border-[#C5A059]/30 bg-[#C5A059]/5 px-4 py-2 rounded-full">
                    <Star className="w-3 h-3 fill-[#C5A059] text-[#C5A059] inline mr-1" />
                    <span className="text-[9px] tracking-[0.3em] text-[#123F38] font-bold">EST. 2017</span>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
