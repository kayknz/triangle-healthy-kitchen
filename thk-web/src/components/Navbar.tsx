import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/LanguageContext';
import { Menu, X, Star, RefreshCcw, Truck, LogOut, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  onBookClick: () => void;
  onSubscribeClick: () => void;
}

export default function Navbar({ onBookClick, onSubscribeClick }: NavbarProps) {
  const { user, userRole, signOut, accessMode, setAccessMode, hasDualAccess } = useAuth();
  const location = useLocation();
  const { t, setLanguage, language, isRtl } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const accountPath = accessMode === 'work'
    ? (userRole === 'owner' ? '/dashboard' : '/rider')
    : '/account';

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const navLinks = [
    { label: t('nav_home'), path: '/' },
    { label: t('nav_menu'), path: user ? '/account' : '/menu' },
    { label: t('nav_packages'), path: '/plans' },
    { label: t('Community'), path: '/community' },
    { label: t('Rewards'), path: '/rewards' },
    { label: t('nav_book'), onClick: () => { setIsOpen(false); onBookClick(); } }
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'h-20 bg-white shadow-2xl border-b border-primary/10' : 'h-28 bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1500px] items-center justify-between px-6 sm:px-10">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-4 group flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 relative overflow-hidden group-hover:scale-105 transition-transform duration-700 flex-shrink-0">
             <img src="/logo.png" alt="Triangle logo" className="w-full h-full object-contain" />
          </div>
          <div className={`flex flex-col leading-none ${isRtl ? 'text-right' : 'text-left'}`}>
            <p className="font-serif italic text-lg sm:text-2xl tracking-tight text-primary">Triangle</p>
            <p className="font-sans font-black text-[5px] sm:text-[7px] tracking-[0.3em] sm:tracking-[0.4em] text-gold uppercase mt-0.5 sm:mt-1">Healthy Kitchen</p>
          </div>
        </Link>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 2xl:gap-10 mx-8 flex-1 justify-center">
          {navLinks.map((link) => (
            link.path ? (
              <Link
                key={link.label}
                to={link.path}
                className={`nav-link whitespace-nowrap text-[11px] font-black uppercase tracking-widest ${location.pathname === link.path ? 'nav-link-active text-primary' : 'text-primary/60'}`}
              >
                {link.label}
              </Link>
            ) : (
              <button
                key={link.label}
                onClick={link.onClick}
                className="nav-link whitespace-nowrap text-[11px] font-black uppercase tracking-widest text-primary/60"
              >
                {link.label}
              </button>
            )
          ))}
        </nav>

        {/* Right Section: Auth & Language */}
        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="text-[10px] font-black text-primary/60 hover:text-gold transition-all tracking-[0.2em] uppercase whitespace-nowrap px-2"
          >
            {language === 'en' ? 'العربية' : 'English'}
          </button>

          <div className="hidden lg:flex items-center gap-4 sm:gap-6">
            {!user ? (
              <>
                <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50 hover:text-primary transition-colors whitespace-nowrap">
                  {t('login')}
                </Link>
                <button
                  onClick={onSubscribeClick}
                  className="btn-primary !py-3 !px-8 text-[9px] scale-105 whitespace-nowrap shadow-xl"
                >
                  {t('join')}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                {hasDualAccess && (
                  <button
                    onClick={() => setAccessMode(accessMode === 'work' ? 'personal' : 'work')}
                    className="group flex items-center gap-2 text-[9px] font-black text-gold hover:text-primary transition-all whitespace-nowrap"
                  >
                    <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-1000" />
                    <span>{accessMode === 'work' ? 'PERSONAL' : 'OPS'}</span>
                  </button>
                )}
                <Link
                  to={accountPath}
                  className="btn-primary !py-3 !px-6 text-[9px] shadow-lg whitespace-nowrap flex items-center gap-2 min-w-fit"
                >
                  <UserCircle className="w-3.5 h-3.5" />
                  <span className="tracking-[0.1em]">{accessMode === 'work' ? (userRole === 'owner' ? 'COMMAND' : 'RIDER OPS') : 'MY PLAN'}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-[9px] font-black text-red-500/60 hover:text-red-600 transition-colors tracking-widest flex items-center gap-2 whitespace-nowrap"
                >
                  <LogOut className="w-3 h-3" />
                  <span>EXIT</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-3 rounded-2xl bg-primary/5 text-primary hover:bg-primary/10 transition-all"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-primary/80 backdrop-blur-md z-[140]"
            />
            <motion.div
              initial={{ x: isRtl ? -400 : 400 }} animate={{ x: 0 }} exit={{ x: isRtl ? -400 : 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 ${isRtl ? 'left-0' : 'right-0'} h-full w-[85vw] max-w-sm bg-background z-[200] p-10 sm:p-12 flex flex-col shadow-[-30px_0_100px_rgba(0,0,0,0.5)] border-l border-primary/20 !opacity-100`}
            >
              <div className="flex justify-between items-center mb-12 relative z-10">
                 <div className="badge border-gold/20 bg-gold/5 px-4 py-2">
                    <Star className="w-2.5 h-2.5 fill-gold animate-glow" />
                    <span className="text-[8px] tracking-[0.3em] font-black uppercase text-gold">Active Plan</span>
                 </div>
                 <button onClick={() => setIsOpen(false)} className="p-3 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors shadow-sm"><X className="w-5 h-5" /></button>
              </div>

              <nav className="flex flex-col gap-5 relative z-10 overflow-y-auto no-scrollbar">
                {navLinks.map((link) => (
                  link.path ? (
                    <Link
                      key={link.label} to={link.path}
                      onClick={() => setIsOpen(false)}
                      className="text-2xl font-serif italic text-primary hover:text-gold transition-colors tracking-tight whitespace-nowrap"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      key={link.label}
                      onClick={link.onClick}
                      className="text-2xl font-serif italic text-left text-primary hover:text-gold transition-colors tracking-tight whitespace-nowrap"
                    >
                      {link.label}
                    </button>
                  )
                ))}

                {userRole === 'owner' && (
                  <Link
                    to="/rider"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 text-[9px] font-black text-gold uppercase tracking-[0.2em] mt-4 p-4 rounded-2xl bg-gold/5 border border-gold/10 whitespace-nowrap"
                  >
                    <Truck className="w-4 h-4" />
                    Rider Rosie View
                  </Link>
                )}

                {hasDualAccess && (
                  <button
                    onClick={() => { setAccessMode(accessMode === 'work' ? 'personal' : 'work'); setIsOpen(false); }}
                    className="flex items-center gap-4 text-[10px] font-black text-white uppercase tracking-[0.2em] mt-4 bg-[#123F38] p-5 rounded-2xl shadow-xl border border-gold/20 whitespace-nowrap"
                  >
                    <RefreshCcw className="w-4 h-4 text-gold" />
                    {accessMode === 'work' ? 'Switch to Personal' : 'Switch to Operations'}
                  </button>
                )}
              </nav>

              <div className="mt-auto space-y-6 pt-10 border-t border-primary/10 relative z-10">
                {!user ? (
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)} className="block text-center py-2 text-xs font-black uppercase tracking-[0.4em] text-primary/60">AUTHORIZE</Link>
                    <button onClick={() => { setIsOpen(false); onSubscribeClick(); }} className="w-full btn-primary py-5 text-[10px] tracking-[0.3em] shadow-xl">INITIALIZE</button>
                  </>
                ) : (
                  <>
                    <Link to={accountPath} onClick={() => setIsOpen(false)} className="w-full btn-primary py-5 text-center text-[10px] tracking-[0.3em] block shadow-2xl">
                       {accessMode === 'work' ? (userRole === 'owner' ? 'COMMAND CENTER' : 'RIDER OPS') : 'MY PROTOCOL'}
                    </Link>
                    <button onClick={() => { setIsOpen(false); handleSignOut(); }} className="w-full text-center py-4 text-[9px] font-black uppercase tracking-[0.5em] text-red-500/60 hover:text-red-600 transition-colors">Terminate Session</button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
