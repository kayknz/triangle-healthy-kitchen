import { Phone, Instagram, MapPin } from 'lucide-react';
import { safeHaptics } from '@/lib/haptics';
import { useLanguage } from '@/lib/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer id="contact" className="bg-[#050f0f] text-white pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white/5">
                <img src="/logo.png" alt="Triangle Healthy Kitchen logo" className="w-full h-full object-contain p-1" />
              </div>
              <div>
                <p className="font-bold tracking-widest text-xs uppercase">{t('Triangle')}</p>
                <p className="text-[#C5A059] text-[9px] tracking-[0.2em] uppercase">{t('Healthy Kitchen')}</p>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed italic">
              {t('about_text_1')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer_quick_links')}</h4>
            <ul className="space-y-2">
              {['about', 'packages', 'menu', 'how_it_works', 'contact'].map((id) => (
                <li key={id}>
                  <a href={`#${id}`} className="text-white/50 hover:text-[#C5A059] text-sm transition-colors capitalize">
                    {t(`nav_${id.replace(/-/g, '_')}`)}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <a href="#privacy" className="text-white/30 hover:text-white text-xs transition-colors">
                  {t('footer_privacy')}
                </a>
              </li>
              <li>
                <a href="#terms" className="text-white/30 hover:text-white text-xs transition-colors">
                  {t('footer_terms')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer_contact')}</h4>
            <ul className="space-y-3">
              <li>
                <a href="tel:+97466624942" className="flex items-center gap-3 text-white/50 hover:text-[#D4A843] text-sm transition-colors">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  +974 6662 4942
                </a>
              </li>
              <li>
                <a href="https://wa.me/97466624942" className="flex items-center gap-3 text-white/50 hover:text-[#D4A843] text-sm transition-colors">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  {t('footer_whatsapp')}
                </a>
              </li>
              <li>
                <a href="https://instagram.com/trianglehealthykitchen" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/50 hover:text-[#D4A843] text-sm transition-colors">
                  <Instagram className="w-4 h-4 flex-shrink-0" />
                  @trianglehealthykitchen
                </a>
              </li>
              <li className="flex items-center gap-3 text-white/50 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {t('doha_qatar')}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-center text-white/20 text-xs">
            © {new Date().getFullYear()} {t('triangle_healthy_kitchen')}. {t('est_2017')}.
          </p>
          <button
            onClick={async () => {
              await safeHaptics.impact();
              window.location.hash = '#provider';
            }}
            className="text-white/10 hover:text-[#C5A059]/40 text-[10px] uppercase tracking-[0.2em] transition-all font-black"
          >
            {t('provider_login')}
          </button>
        </div>
      </div>
    </footer>
  );
}
