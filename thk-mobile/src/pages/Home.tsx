import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Packages from '@/components/Packages';
import Menu from '@/components/Menu';
import HowItWorks from '@/components/HowItWorks';
import Footer from '@/components/Footer';
import { Shield, Activity, Users, Box, Star, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';

interface HomeProps {
  onBookClick: (pkgId?: string) => void;
  onSubscribeClick: (pkgId?: string) => void;
}

export default function Home({ onBookClick, onSubscribeClick }: HomeProps) {
  const { t, isRtl } = useLanguage();

  return (
    <div className="bg-[#F5F3EB] min-h-screen text-[#123F38]" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <Navbar onBookClick={onBookClick} onSubscribeClick={onSubscribeClick} />

      {/* Pillar 1: What is Triangle? */}
      <Hero onBookClick={onBookClick} onSubscribeClick={onSubscribeClick} />

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-6xl font-black uppercase italic tracking-tighter text-primary mb-8">
            What is Triangle?
          </h2>
          <p className="text-2xl font-bold italic text-muted max-w-3xl mx-auto leading-tight">
            Chef-made healthy meals, delivered daily to your door in Doha.
          </p>
        </div>
      </section>

      {/* Pillar 2: What do I get? */}
      <section className="py-32 px-6 bg-primary text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-24">
             <h2 className="text-5xl sm:text-7xl font-black uppercase italic tracking-tighter leading-none mb-8">
               What do I <span className="text-gold">get?</span>
             </h2>
             <p className="text-xl font-medium italic text-white/80 max-w-2xl mx-auto">
               Fresh breakfast, lunch, and dinner. Macro-counted. No cooking, no cleaning.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: Box, title: 'Daily Delivery', desc: 'Fresh meals dropped at your door every morning.' },
              { icon: Shield, title: 'Chef Made', desc: 'Fresh food prepared by professional chefs.' },
              { icon: Activity, title: 'Health Tracking', desc: 'Track your steps and progress in your dashboard.' },
              { icon: Users, title: 'Community', desc: 'Join our local Doha healthy living community.' },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-10 rounded-[3rem] hover:bg-white/10 transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-black uppercase italic mb-4">{benefit.title}</h3>
                <p className="text-white/60 text-sm font-medium leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillar 3: How much does it cost? */}
      <section id="pricing" className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-4xl sm:text-6xl font-black uppercase italic tracking-tighter text-primary mb-4">
            How much does it cost?
          </h2>
          <p className="text-3xl font-black italic text-gold">From QR 180/day</p>
          <p className="text-muted font-medium italic mt-4">Simple pricing. No hidden fees.</p>
        </div>
        <Packages onSubscribeClick={onSubscribeClick} />
      </section>

      {/* Pillar 4: How do I start? */}
      <section className="py-20 bg-gold/5 border-y border-gold/10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-6xl font-black uppercase italic tracking-tighter text-primary mb-12">
            How do I start?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto">1</div>
              <h3 className="text-xl font-black uppercase italic">Pick Plan</h3>
              <p className="text-muted font-medium">Choose the meal plan that fits your life.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto">2</div>
              <h3 className="text-xl font-black uppercase italic">Share Allergies</h3>
              <p className="text-muted font-medium">Tell us what you can't eat. We'll handle the rest.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto">3</div>
              <h3 className="text-xl font-black uppercase italic">Get Food</h3>
              <p className="text-muted font-medium">Enjoy fresh healthy meals at your door.</p>
            </div>
          </div>
          <button
            onClick={() => onSubscribeClick()}
            className="btn-primary mt-16 px-12 py-6 text-xl tracking-widest uppercase"
          >
            Start Now →
          </button>
        </div>
      </section>

      <Menu />
      <Footer />
    </div>
  );
}
