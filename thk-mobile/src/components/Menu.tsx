import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { WEEKLY_MENU } from '@/data/menu';
import * as NewMenus from '@/data/new_menus';
import { useLanguage } from '@/lib/LanguageContext';

const COLLECTIONS = [
  { id: 'standard', name: 'weekly_menu', data: WEEKLY_MENU },
  { id: 'menu_a', name: 'menu_a', data: NewMenus.MENU_A },
  { id: 'menu_c', name: 'menu_c', data: NewMenus.MENU_C },
  { id: 'menu_d', name: 'menu_d', data: NewMenus.MENU_D },
  { id: 'menu_e', name: 'menu_e', data: NewMenus.MENU_E },
  { id: 'menu_f', name: 'menu_f', data: NewMenus.MENU_F },
  { id: 'menu_2026', name: 'Excellent_2026', data: NewMenus.MENU_2026 },
  { id: 'summer_j', name: 'summer_special_j', data: NewMenus.SUMMER_J },
  { id: 'ramadan', name: 'ramadan_special', data: NewMenus.RAMADAN_SPECIAL },
  { id: 'summer_coll', name: 'summer_collection', data: NewMenus.SUMMER_COLLECTION },
];

const MEAL_COLORS: Record<string, string> = {
  breakfast: 'text-[#C5A059]',
  lunch: 'text-[#0a3030]',
  dinner: 'text-[#5BA889]',
  snacks: 'text-gray-400',
};

export default function Menu() {
  const [activeCollection, setActiveCollection] = useState(COLLECTIONS[0]);
  const [activeDay, setActiveDay] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState<string | null>('breakfast');
  const [searchTerm, setSearchTerm] = useState('');
  const { t, isRtl } = useLanguage();

  const currentMenu = activeCollection.data;
  const day = currentMenu[activeDay] || currentMenu[0];

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return day.items;

    const term = searchTerm.toLowerCase();
    const newItems: any = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: []
    };

    Object.entries(day.items).forEach(([meal, dishes]: [string, any]) => {
      newItems[meal] = dishes.filter((d: any) => d.name.toLowerCase().includes(term));
    });

    return newItems;
  }, [day, searchTerm]);

  return (
    <section id="menu" className="bg-[#F9FBF9] py-32 px-6 sm:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl sm:text-6xl font-black text-[#0a3030] mb-6 tracking-tighter">
            {t('menu_title')}
          </h2>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto font-medium">
            {t('menu_subtitle')}
          </p>
        </div>

        {/* Collection Selector */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {COLLECTIONS.map((c) => (
            <button
              key={c.id}
              onClick={async () => {
                await Haptics.impact({ style: ImpactStyle.Light });
                setActiveCollection(c);
                setActiveDay(0);
              }}
              className={`flex-shrink-0 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCollection.id === c.id
                  ? 'bg-[#C5A059] text-white shadow-lg'
                  : 'bg-white text-gray-400 border border-gray-100 hover:border-[#C5A059]/30'
              }`}
            >
              {t(c.name)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-12">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('menu_search_placeholder')}
            className="w-full bg-white border border-gray-100 shadow-sm rounded-3xl py-4 pl-12 pr-6 text-[#0a3030] text-sm outline-none"
          />
        </div>

        {/* Days */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-12 scrollbar-none">
          {currentMenu.map((d, i) => (
            <button
              key={`${d.day}-${i}`}
              onClick={async () => {
                await Haptics.impact({ style: ImpactStyle.Light });
                setActiveDay(i);
              }}
              className={`flex-shrink-0 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                activeDay === i
                  ? 'bg-[#0a3030] text-white shadow-xl'
                  : 'bg-white text-gray-400 border border-gray-100 hover:text-[#0a3030]'
              }`}
            >
              {t(d.day)}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {Object.entries(filteredItems).map(([meal, dishes]: [string, any]) => (
            <div key={meal} className="premium-card p-0 overflow-hidden">
              <button
                onClick={async () => {
                  await Haptics.impact({ style: ImpactStyle.Light });
                  setExpandedMeal(expandedMeal === meal ? null : meal);
                }}
                className="w-full flex items-center justify-between px-8 py-6 group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${expandedMeal === meal ? 'bg-[#C5A059]' : 'bg-gray-200'}`} />
                  <span className={`text-sm font-black uppercase tracking-[0.2em] ${MEAL_COLORS[meal]}`}>
                    {t(meal)}
                  </span>
                  <span className="text-gray-300 text-[10px] font-bold uppercase">{dishes.length} {t('choices')}</span>
                </div>
                {expandedMeal === meal ? <ChevronUp className="w-5 h-5 text-gray-300" /> : <ChevronDown className="w-5 h-5 text-gray-300" />}
              </button>

              {expandedMeal === meal && dishes.length > 0 && (
                <div className="px-8 pb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dishes.map((d: any) => (
                    <div key={d.name} className="bg-gray-50/50 border border-gray-100 rounded-[1.5rem] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-[#0a3030] font-black text-base">
                          {isRtl && d.name_ar ? d.name_ar : d.name}
                        </span>
                        <span className={`text-xs font-black ${MEAL_COLORS[meal]}`}>{d.kcals} {t('kcal')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-gray-50 rounded-3xl border border-gray-100 flex items-start gap-4">
          <Sparkles className="w-6 h-6 text-[#C5A059] flex-shrink-0" />
          <p className="text-gray-400 text-xs font-medium leading-relaxed">
            {t('menu_disclaimer')}
          </p>
        </div>
      </div>
    </section>
  );
}
