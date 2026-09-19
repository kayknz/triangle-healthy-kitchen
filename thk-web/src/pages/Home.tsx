import React from 'react';
import { Star, ArrowRight, Sparkles, ChefHat, Activity, Brain, Leaf, Wind, Utensils, Quote, Heart, CheckCircle, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLanguage } from '../lib/LanguageContext';
import AnimatedSection from '../components/AnimatedSection';
import CinematicSlider from '../components/CinematicSlider';
import SafeImage from '../components/SafeImage';
import TriangleSculpture from '../components/TriangleSculpture';
import RhythmCalculator from '../components/RhythmCalculator';

interface HomeProps {
  onSubscribeClick: (pkgId?: string) => void;
  onBookClick: (pkgId?: string) => void;
}

export default function Home({ onSubscribeClick, onBookClick }: HomeProps) {
  const { t, isRtl } = useLanguage();

  return (
    <div className={`overflow-x-hidden bg-[#F5F3EB] ${isRtl ? 'text-right' : 'text-left'}`}>
      {/* Cinematic Airy Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-20">
        <div className="absolute inset-0 z-0">
          <CinematicSlider />
        </div>

        <div className="relative z-10 w-full container-hq flex flex-col lg:grid lg:grid-cols-[1.1fr_0.9fr] gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={`badge mb-10 w-fit ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Star className="w-3.5 h-3.5 fill-gold text-gold" />
              <span className="font-black">{t('est_2017')} — {t('doha_excellence')}</span>
            </div>

            <h1 className="mb-10 text-shadow-premium lg:text-8xl text-[#123F38]">
              {t('hero_title_1')}<br />
              <span className="text-[#C5A059] selection:bg-[#C5A059] selection:text-[#123F38]">{t('hero_title_2')}</span><br />
              <span className="text-[#123F38]/50 font-sans font-black uppercase not-italic tracking-tighter text-3xl sm:text-5xl">{t('hero_title_3')}</span>
            </h1>

            <p className="text-[#123F38] text-xl md:text-2xl font-bold italic mb-16 max-w-xl leading-relaxed opacity-80">
              {t('hero_subtitle')}
            </p>

            <div className={`flex flex-wrap gap-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => onSubscribeClick()}
                className="btn-primary group"
              >
                {t('start_today')}
                <ArrowRight className="w-5 h-5 ml-4 inline-block group-hover:translate-x-2 transition-transform" />
              </button>
              <button
                onClick={() => onBookClick()}
                className="btn-secondary"
              >
                {t('nav_book')}
              </button>
            </div>
          </motion.div>

          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card p-8 lg:p-12 space-y-8 lg:space-y-12 shadow-4xl bg-white/60 backdrop-blur-xl border-white/40"
            >
               {[
                 { icon: Brain, label: t('healthy_mind_title'), sub: t('healthy_mind_subtitle') },
                 { icon: Leaf, label: t('healthy_body_title'), sub: t('healthy_body_subtitle') },
                 { icon: Wind, label: t('healthy_soul_title'), sub: t('healthy_soul_subtitle') }
               ].map((item, i) => (
                 <div key={i} className={`flex items-center gap-8 group ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                   <div className="w-16 h-16 rounded-[1.8rem] bg-[#123F38] flex items-center justify-center flex-shrink-0 shadow-2xl group-hover:bg-[#C5A059] transition-all duration-700">
                     <item.icon className="w-7 h-7 text-[#C5A059] group-hover:text-[#123F38] transition-colors" />
                   </div>
                   <div>
                     <p className="text-base font-black uppercase tracking-widest text-[#123F38] mb-1">{item.label}</p>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059]">{item.sub}</p>
                   </div>
                 </div>
               ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20"
        >
           <span className="text-[8px] font-black uppercase tracking-[0.5em] text-[#123F38]">Command Scroll</span>
           <div className="w-px h-12 bg-[#123F38]" />
        </motion.div>
      </section>

      {/* Editorial Spread 1: Pic Left, Text Right (THE FADE) */}
      <section className="py-24 sm:py-48 bg-[#F5F3EB] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
           <motion.div initial={{ opacity: 0, x: -100 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} className="relative h-[500px] sm:h-[800px]">
              <img src="https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=1200" className="w-full h-full object-cover rounded-[5rem]" />
              {/* Correct Side Fade: Right side of image */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#F5F3EB] opacity-100 pointer-events-none hidden lg:block" />
           </motion.div>
           <AnimatedSection>
              <div className="badge mb-10 bg-[#123F38] text-[#F5F3EB]">
                <ChefHat className="w-4 h-4" />
                <span className="ml-2 font-black tracking-widest">{t('artisanal')}</span>
              </div>
              <h2 className="mb-10 text-[#123F38]">{t('chef_crafted_title')}.<br /><span className="text-[#C5A059]">{t('expert_quality_title')}.</span></h2>
              <p className="text-[#123F38] text-xl font-medium italic mb-12 max-w-xl leading-relaxed">
                 {t('visual_transparency_desc')}
              </p>
              <button onClick={() => onSubscribeClick()} className="btn-primary">{t('explore_collections')}</button>
           </AnimatedSection>
        </div>
      </section>

      {/* Rhythm Calculator */}
      <section className="py-32 sm:py-48 bg-[#F5F3EB]">
        <div className="max-w-4xl mx-auto px-6">
           <RhythmCalculator />
        </div>
      </section>

      {/* Editorial Spread 2: Text Left, Pic Right (THE FADE) */}
      <section id="why-triangle" className="py-24 sm:py-48 bg-[#F5F3EB] border-y border-[#123F38]/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
           <AnimatedSection className={isRtl ? 'lg:order-last' : ''}>
              <div className="badge mb-10 bg-[#C5A059] text-[#123F38]">
                <Star className="w-4 h-4 fill-current" />
                <span className="ml-2 font-black tracking-widest uppercase">{t('triangle_philosophy')}</span>
              </div>
              <h2 className="mb-8 text-[#123F38]">{t('one_triangle')}.<br /><span className="text-[#123F38]/30 font-sans font-black uppercase not-italic tracking-tighter text-3xl sm:text-5xl">{t('three_pillars')}.</span></h2>
              <p className="text-primary/60 text-lg leading-relaxed italic mb-14 max-w-xl">
                 One brand. Three pillars. A complete ecosystem for Doha.
              </p>
              <div className="space-y-12">
                 {[
                   { step: "01", title: t('hiw_step1_title'), desc: t('hiw_step1_desc') },
                   { step: "02", title: t('hiw_step2_title'), desc: t('hiw_step2_desc') },
                   { step: "03", title: t('hiw_step4_title'), desc: t('hiw_step4_desc') }
                 ].map((p) => (
                   <div key={p.step} className="group flex items-start gap-8 border-b border-primary/10 pb-8 transition-all hover:translate-x-3">
                      <span className="text-5xl font-sans font-black text-gold/20 group-hover:text-gold transition-colors">{p.step}</span>
                      <div>
                        <h4 className="text-2xl mb-2 text-primary">{p.title}</h4>
                        <p className="text-primary/60 text-sm font-bold uppercase tracking-widest leading-relaxed">{p.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </AnimatedSection>
           <motion.div initial={{ opacity: 0, x: 100 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} className="relative h-[500px] sm:h-[800px]">
              <img src="https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?auto=compress&cs=tinysrgb&w=1200" className="w-full h-full object-cover rounded-[5rem]" />
              {/* Correct Side Fade: Left side of image */}
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#F5F3EB] opacity-100 pointer-events-none hidden lg:block" />
           </motion.div>
        </div>
      </section>

      {/* Simple Breakdown: What, Cost, Get, Start */}
      <section className="py-32 sm:py-56 bg-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            <AnimatedSection>
              <div className="badge mb-10 bg-gold/10 border-gold/20 text-gold py-2.5 px-6">
                <Star className="w-4 h-4 fill-gold" />
                <span className="ml-2 font-black tracking-widest uppercase">The Basics</span>
              </div>
              <h2 className="mb-12 text-primary">{t('what_is_triangle')}</h2>
              <div className="space-y-12">
                <div className="group">
                  <h4 className="text-2xl text-primary mb-4 flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary text-gold flex items-center justify-center text-xs font-black">1</span>
                    {t('what_get')}
                  </h4>
                  <p className="text-primary/60 text-lg leading-relaxed italic ml-12">
                    {t('what_get_desc')}
                  </p>
                </div>
                <div className="group">
                  <h4 className="text-2xl text-primary mb-4 flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary text-gold flex items-center justify-center text-xs font-black">2</span>
                    {t('what_cost')}
                  </h4>
                  <p className="text-primary/60 text-lg leading-relaxed italic ml-12">
                    {t('starting_from')}
                  </p>
                </div>
                <div className="group">
                  <h4 className="text-2xl text-primary mb-4 flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary text-gold flex items-center justify-center text-xs font-black">3</span>
                    {t('how_start')}
                  </h4>
                  <div className="flex flex-col gap-6 ml-12">
                    {[
                      { step: "01", title: t('hiw_step1_title'), desc: t('hiw_step1_desc') },
                      { step: "02", title: t('hiw_step2_title'), desc: t('hiw_step2_desc') },
                      { step: "03", title: t('hiw_step4_title'), desc: t('hiw_step4_desc') }
                    ].map((p) => (
                      <div key={p.step} className="flex items-start gap-4">
                        <span className="text-2xl font-black text-gold/20">{p.step}</span>
                        <div>
                          <p className="font-black text-primary uppercase text-xs tracking-widest mb-1">{p.title}</p>
                          <p className="text-primary/40 text-[10px] font-bold uppercase tracking-widest">{p.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <div className="relative">
              <div className="absolute -inset-10 bg-[#C5A059]/10 blur-[100px] rounded-full" />
              <div className="p-6 sm:p-12 bg-white/80 relative z-10 border-[#123F38]/5 rounded-[3rem] sm:rounded-[4rem] shadow-4xl">
                <h3 className="text-2xl lg:text-3xl text-[#123F38] mb-8 lg:mb-12 italic">Targeted Value</h3>
                <div className="space-y-8">
                  {[
                    { label: 'Clinical Accuracy', value: '100%' },
                    { label: 'Chef Preparation', value: 'Daily' },
                    { label: 'Logistics Sync', value: 'Real-time' },
                    { label: 'Member Support', value: '24/7' }
                  ].map((stat) => (
                    <div key={stat.label} className="flex justify-between items-end border-b border-[#123F38]/10 pb-4">
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#123F38]/40">{stat.label}</span>
                      <span className="text-3xl font-serif text-[#C5A059] italic">{stat.value}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => onSubscribeClick()} className="w-full btn-primary mt-12 py-6">Begin Plan</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Grid */}
      <section className="py-32 sm:py-48 bg-[#F5F3EB]">
        <div className="max-w-7xl mx-auto px-6 text-center">
             <div className="badge mb-10 bg-[#C5A059] text-[#123F38] py-3 px-8 mx-auto">
                <CheckCircle className="w-4 h-4" />
                <span className="ml-2 font-black tracking-widest uppercase">{t('doha_standard')}</span>
             </div>
             <h2 className="mb-24 text-primary">Happy with us?</h2>

          {/* Mobile Optimized Scrollable Grid */}
          <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-6 lg:gap-12 no-scrollbar px-4 sm:px-6 -mx-6 pb-12 lg:pb-0 snap-x">
            {[
              { icon: Shield, label: t('food_safety'), sub: t('food_safety_desc') },
              { icon: Activity, label: t('bio_science'), sub: t('bio_science_desc') },
              { icon: ChefHat, label: t('artisanal'), sub: t('artisanal_desc') },
              { icon: Utensils, label: t('logistics'), sub: t('logistics_desc') }
            ].map((item, i) => (
              <div key={i} className="min-w-[260px] sm:min-w-[280px] lg:min-w-0 snap-center p-6 lg:p-12 text-center group hover:translate-y-[-10px] duration-500 shadow-xl bg-white/90 border border-primary/5 rounded-[2.5rem] lg:rounded-[3.5rem]">
                 <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl bg-[#123F38] flex items-center justify-center mx-auto mb-6 lg:mb-10 group-hover:bg-[#C5A059] transition-colors duration-500 shadow-xl">
                   <item.icon className="w-6 h-6 lg:w-8 lg:h-8 text-[#C5A059] group-hover:text-[#123F38] transition-colors" />
                 </div>
                 <h4 className="text-[#123F38] mb-3 lg:mb-4 font-black uppercase text-sm lg:text-base tracking-tight">{item.label}</h4>
                 <p className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-[#C5A059] leading-relaxed">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Simple CTA Banner */}
      <section id="contact" className="bg-[#123F38] py-24 text-center px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-food-atmosphere opacity-[0.05] grayscale pointer-events-none" />
          <AnimatedSection>
            <div className="max-w-4xl mx-auto space-y-12 relative z-10">
               <h2 className="text-4xl sm:text-6xl font-serif italic text-white tracking-tight">Ready to eat healthy?</h2>
               <p className="text-white/60 text-lg sm:text-xl font-medium italic">Join the Doha community and start your plan today.</p>
               <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <button onClick={() => onSubscribeClick()} className="btn-primary !bg-gold !text-primary px-12 py-5 text-sm shadow-2xl">Start Plan</button>
                  <button onClick={() => onBookClick()} className="btn-secondary !bg-white/10 !text-white border-white/20 px-12 py-5 text-sm">Book Free Chat</button>
               </div>
            </div>
          </AnimatedSection>
      </section>
    </div>
  );
}
