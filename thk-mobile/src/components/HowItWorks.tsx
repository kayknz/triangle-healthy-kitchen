import { ArrowRight } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useLanguage } from '@/lib/LanguageContext';

interface HowItWorksProps {
  onBookClick: () => void;
}

export default function HowItWorks({ onBookClick }: HowItWorksProps) {
  const { t } = useLanguage();

  const handleBookClick = async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
    onBookClick();
  };

  const steps = [
    {
      n: '01',
      title: t('hiw_step1_title'),
      desc: t('hiw_step1_desc'),
    },
    {
      n: '02',
      title: t('hiw_step2_title'),
      desc: t('hiw_step2_desc'),
    },
    {
      n: '03',
      title: t('hiw_step3_title'),
      desc: t('hiw_step3_desc'),
    },
    {
      n: '04',
      title: t('hiw_step4_title'),
      desc: t('hiw_step4_desc'),
    },
  ];

  return (
    <section id="how-it-works" className="relative py-32 px-6 sm:px-8 lg:px-12 bg-white overflow-hidden">
      <div className="absolute inset-0 z-0">
         <div
           className="absolute inset-0 bg-cover bg-center opacity-[0.03]"
           style={{ backgroundImage: `url('https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')` }}
         />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-24">
          <div className="flex items-center justify-center gap-3 mb-6 animate-in">
            <span className="h-px w-8 bg-[#C5A059]" />
            <p className="text-[#C5A059] text-sm tracking-[0.4em] uppercase font-black">
              {t('nav_how_it_works')}
            </p>
            <span className="h-px w-8 bg-[#C5A059]" />
          </div>
          <h2 className="text-5xl sm:text-6xl font-black text-[#0a3030] mb-6 tracking-tighter">
            {t('how_it_works_title')}
          </h2>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto font-medium">
            {t('how_it_works_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={s.n} className="relative group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[65%] w-[calc(35%+1.5rem)] h-0.5 bg-gradient-to-r from-[#C5A059]/20 to-transparent transition-all group-hover:from-[#C5A059]/40" />
              )}
              <div className="premium-card p-8 h-full bg-white border border-gray-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-[#0a3030]/5 flex items-center justify-center mb-6 group-hover:bg-[#0a3030] transition-colors duration-500">
                  <span className="text-[#0a3030] font-black text-lg group-hover:text-white transition-colors duration-500">{s.n}</span>
                </div>
                <h3 className="text-[#0a3030] font-black text-lg mb-3 leading-tight">{s.title}</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-20">
          <button
            onClick={handleBookClick}
            className="bg-[#0a3030] text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#154a4a] hover:shadow-2xl transition-all inline-flex items-center gap-2 group"
          >
            {t('start_journey')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
