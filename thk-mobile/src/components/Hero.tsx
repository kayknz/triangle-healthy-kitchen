import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { motion } from 'framer-motion';
import { Star, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface HeroProps {
  onBookClick: () => void;
  onSubscribeClick: () => void;
}

export default function Hero({ onBookClick, onSubscribeClick }: HeroProps) {
  const { t, isRtl } = useLanguage();

  const handleBookClick = async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
    onBookClick();
  };

  const handleSubscribeClick = async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
    onSubscribeClick();
  };

  const handlePackagesClick = async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
    window.location.hash = '#packages';
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background pt-20">
      {/* Background Layer — Deep Blur Cinematic */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 grayscale mix-blend-multiply"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

      <div className="relative z-10 w-full px-6 py-12 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="w-full max-w-xl"
        >
          {/* Badge */}
          <div className="badge mb-8 animate-reveal">
            <Star className="w-3 h-3 fill-gold" />
            <span>{t('est_2017')} — {t('doha_excellence')}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-black text-primary leading-[1] mb-8 tracking-tighter uppercase italic">
            {t('hero_title_1')}<br />
            <span className="text-teal underline decoration-gold/10 underline-offset-[10px]">
               {t('hero_title_2')}
            </span><br />
            {t('hero_title_3')}
          </h1>

          <p className="text-muted text-base sm:text-lg leading-relaxed mb-12 max-w-md mx-auto font-medium italic border-l-4 border-sage/20 pl-6">
            {t('hero_subtitle')}
          </p>

          <div className={`flex flex-col gap-5 w-full ${isRtl ? 'items-end' : 'items-start'}`}>
            <button
              onClick={handleBookClick}
              className="w-full btn-primary flex items-center justify-center gap-4 group"
            >
              {t('hero_cta_book')}
              <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={handlePackagesClick}
              className="w-full py-5 rounded-3xl border-2 border-primary/5 text-primary font-black text-[10px] tracking-[0.2em] uppercase hover:bg-primary/5 transition-all"
            >
              {t('hero_cta_packages')}
            </button>

            <button
              onClick={handleSubscribeClick}
              className="w-full flex items-center justify-center gap-3 text-gold text-[10px] font-black uppercase tracking-[0.3em] hover:text-teal transition-colors py-4"
            >
              <Sparkles className="w-4 h-4" />
              {t('explore_collections')}
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-6 mt-16 pt-10 border-t border-primary/5">
            <div>
              <p className="text-primary text-2xl font-black italic tracking-tighter leading-none">500+</p>
              <p className="text-primary/30 text-[8px] uppercase font-black tracking-widest mt-2">{t('members_count')}</p>
            </div>
            <div>
              <p className="text-primary text-2xl font-black italic tracking-tighter leading-none">3</p>
              <p className="text-primary/30 text-[8px] uppercase font-black tracking-widest mt-2">{t('cities_count')}</p>
            </div>
            <div>
              <p className="text-primary text-2xl font-black italic tracking-tighter leading-none">7</p>
              <p className="text-primary/30 text-[8px] uppercase font-black tracking-widest mt-2">{t('plans_count')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
