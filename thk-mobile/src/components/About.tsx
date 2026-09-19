import { HeartPulse, ChefHat, Dumbbell, CalendarHeart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';

export default function About() {
  const { t, isRtl } = useLanguage();

  return (
    <section id="about" className="bg-[#FDFCF7] py-32 px-6 sm:px-8 lg:px-12 relative overflow-hidden border-y border-primary/5">
      <div className="absolute inset-0 bg-primary opacity-[0.01] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          {/* Image */}
          <div className="relative order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="relative rounded-[4rem] sm:rounded-[6rem] overflow-hidden h-[500px] sm:h-[750px] shadow-4xl border-[16px] sm:border-[24px] border-background group"
            >
              <img
                src="https://images.pexels.com/photos/8844888/pexels-photo-8844888.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                alt="Excellent Culinary Preparation"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[6s]"
              />
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-[#FDFCF7] opacity-90 ${isRtl ? 'rotate-180' : ''}`} />
            </motion.div>

            {/* Floating High-End Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className={`absolute glass-card p-10 max-w-[240px] hidden sm:block border-[10px] border-white shadow-4xl ${isRtl ? '-bottom-10 -right-10' : '-bottom-10 -left-10'}`}
            >
              <Star className="w-8 h-8 text-gold mb-6 opacity-30" />
              <p className="text-primary font-black text-5xl italic tracking-tighter leading-none mb-3">7+</p>
              <p className="text-primary font-black text-[10px] uppercase tracking-[0.2em] opacity-60">
                {t('years_of_excellence')}
              </p>
            </motion.div>
          </div>

          {/* Content */}
          <div className={`order-1 lg:order-2 ${isRtl ? 'text-right' : 'text-left'}`}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-4 mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <span className="h-px w-12 bg-teal" />
              <p className="text-teal text-[10px] sm:text-xs tracking-[0.5em] uppercase font-black">
                {t('nav_about')}
              </p>
            </motion.div>

            <h2 className="text-4xl sm:text-7xl font-black text-primary leading-[0.95] mb-10 tracking-tighter uppercase italic">
              Verified Doha<br />
              <span className="text-sage underline decoration-gold/10 underline-offset-[12px]">Lifestyle & Nutritional Ecosystem</span>
            </h2>

            <p className={`text-muted text-base sm:text-2xl leading-relaxed mb-10 font-medium italic border-sage/20 ${isRtl ? 'border-r-4 pr-6' : 'border-l-4 pl-6'}`}>
              Triangle is more than a meal plan. It is a clinical-grade nutritional ecosystem designed to fuel the Doha lifestyle through verified bio-data and chef-crafted precision.
            </p>

            <p className="text-muted text-sm sm:text-lg leading-relaxed mb-16 font-medium opacity-80">
              Since 2017, we have merged traditional heritage flavors with modern bio-science to create a continuous supply of performance nutrition for our community.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: ChefHat, title: 'chef_crafted', desc: 'chef_crafted_desc' },
                { icon: HeartPulse, title: 'bio_aligned', desc: 'bio_aligned_desc' },
                { icon: Dumbbell, title: 'performance_focus', desc: 'performance_focus_desc' },
                { icon: CalendarHeart, title: 'direct_service', desc: 'direct_service_desc' },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`glass-card p-6 bg-white/40 border-primary/5 hover:border-gold/20 transition-all ${isRtl ? 'text-right' : 'text-left'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center mb-4 ${isRtl ? 'ml-auto' : ''}`}>
                    <f.icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-3">{t(f.title)}</h3>
                  <p className="text-muted text-[11px] font-medium leading-relaxed italic opacity-80">{t(f.desc)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
