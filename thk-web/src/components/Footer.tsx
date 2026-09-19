import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, UserCheck, Instagram, MessageCircle, Triangle, Star } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export default function Footer() {
  const { t, isRtl } = useLanguage();

  return (
    <footer className="bg-[#123F38] py-32 sm:py-48 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-food-atmosphere opacity-[0.03] grayscale pointer-events-none" />

      <div className={`max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start gap-32 relative z-10 ${isRtl ? 'lg:flex-row-reverse' : ''}`}>
        <div className="max-w-md space-y-12">
          <Link to="/" className={`flex items-center gap-5 group w-fit ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="w-14 h-14 overflow-hidden group-hover:scale-105 transition-transform duration-700">
              <img src="/logo.png" alt="Triangle logo" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
               <p className="font-serif italic text-3xl tracking-tight text-[#F5F3EB] leading-none">Triangle</p>
               <p className="font-sans font-black text-[9px] tracking-[0.4em] text-gold uppercase mt-2">Healthy Kitchen</p>
            </div>
          </Link>
          <p className="text-[#F5F3EB] text-xl font-bold italic leading-relaxed text-left">
            "{t('mission_closing')}"
          </p>

          <div className={`flex gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
            {[
              { icon: Instagram, url: 'https://instagram.com/triangle_healthykitchen' },
              { icon: MessageCircle, url: 'https://wa.me/97466624942' },
              { icon: Phone, url: 'tel:+97466624942' }
            ].map((social, i) => (
              <a
                key={i} href={social.url} target="_blank" rel="noreferrer"
                className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-gold hover:text-[#123F38] transition-all duration-500 shadow-xl border border-white/20"
              >
                <social.icon className="w-6 h-6 text-[#F5F3EB]" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-24 flex-1">
          <div className={`space-y-10 ${isRtl ? 'text-right' : 'text-left'}`}>
            <p className="text-gold text-[10px] font-black tracking-[0.6em] uppercase">Navigation</p>
            <nav className="flex flex-col gap-6">
              {[
                { label: 'Menu Collections', path: '/menu' },
                { label: 'Subscription Plans', path: '/plans' },
                { label: 'How It Works', path: '/#why-triangle' },
                { label: 'Login', path: '/login' },
              ].map((link) => (
                <Link key={link.label} to={link.path} className="text-lg font-serif italic text-[#F5F3EB] hover:text-gold transition-all">{link.label}</Link>
              ))}
            </nav>
          </div>

          <div className={`space-y-10 ${isRtl ? 'text-right' : 'text-left'}`}>
            <p className="text-gold text-[10px] font-black tracking-[0.6em] uppercase">Contact Hub</p>
            <div className="space-y-8">
              <div className="group cursor-pointer">
                <p className="text-[9px] font-black text-gold uppercase tracking-widest mb-3">Doha Headquarters</p>
                <p className="text-lg font-bold italic group-hover:text-gold transition-colors text-[#F5F3EB]">Lusail Marina, Doha, Qatar</p>
              </div>
              <div className="group cursor-pointer">
                <p className="text-[9px] font-black text-gold uppercase tracking-widest mb-3">Official Communication</p>
                <p className="text-lg font-bold italic group-hover:text-gold transition-colors text-[#F5F3EB]">hello@triangle.qa</p>
              </div>
            </div>
          </div>

          <div className={`space-y-10 ${isRtl ? 'text-right' : 'text-left'}`}>
            <p className="text-gold text-[10px] font-black tracking-[0.6em] uppercase">Security</p>
            <div className="flex flex-col gap-6">
              <button className="text-[11px] font-black text-[#F5F3EB] hover:text-white transition-all uppercase tracking-[0.4em] w-fit">Privacy Protocol</button>
              <button className="text-[11px] font-black text-[#F5F3EB] hover:text-white transition-all uppercase tracking-[0.4em] w-fit">Service Terms</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-40 pt-16 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-6">
           <div className="badge bg-white/10 border-white/20 px-6 py-3">
              <Star className="w-4 h-4 fill-gold text-gold" />
              <span className="text-[10px] font-black text-[#F5F3EB] tracking-[0.3em] ml-2">EST. 2017</span>
           </div>
           <p className="text-[10px] font-black text-[#F5F3EB] opacity-60 uppercase tracking-[0.4em]">© 2026 TRIANGLE GROUP</p>
        </div>
        <div className="flex items-center gap-6">
           <div className="w-10 h-px bg-gold/20" />
           <p className="text-[10px] font-black text-gold uppercase tracking-[0.8em] italic">
             Doha Excellence Trust
           </p>
        </div>
      </div>
    </footer>
  );
}
