import type { DailyMenu, MenuDish, Ingredient } from '../types/subscription';

// --- INGREDIENT REGISTRY ---
const I: Record<string, Ingredient> = {
  chicken_breast: { id: 'i1', slug: 'chicken_breast', name: 'Premium Chicken Breast', name_ar: 'صدر دجاج فاخر', is_required: true, is_removable: false },
  grilled_tuna: { id: 'i2', slug: 'grilled_tuna', name: 'Sustainable Grilled Tuna', name_ar: 'تونا مشوية مستدامة', is_required: true, is_removable: false, allergen: 'fish' },
  beef_strips: { id: 'i3', slug: 'beef_strips', name: 'Grass-Fed Beef Strips', name_ar: 'شرائح لحم بقري', is_required: true, is_removable: false },
  organic_eggs: { id: 'i4', slug: 'organic_eggs', name: 'Organic Farm Eggs', name_ar: 'بيض عضوي', is_required: true, is_removable: false, allergen: 'eggs' },
  atlantic_salmon: { id: 'i5', slug: 'atlantic_salmon', name: 'Wild Atlantic Salmon', name_ar: 'سلمون أطلسي', is_required: true, is_removable: false, allergen: 'fish' },
  olive_oil: { id: 'i10', slug: 'olive_oil', name: 'Extra Virgin Olive Oil', name_ar: 'زيت زيتون بكر', is_required: false, is_removable: true, approved_substitutions: ['avocado_oil'] },
  avocado_oil: { id: 'i11', slug: 'avocado_oil', name: 'Refined Avocado Oil', name_ar: 'زيت أفوكادو', is_required: false, is_removable: true, approved_substitutions: ['olive_oil'] },
  white_rice: { id: 'i20', slug: 'white_rice', name: 'Basmati Rice', name_ar: 'أرز بسمتي', is_required: false, is_removable: true, approved_substitutions: ['cauliflower_rice', 'quinoa'] },
  cauliflower_rice: { id: 'i21', slug: 'cauliflower_rice', name: 'Riced Cauliflower', name_ar: 'أرز القرنبيط', is_required: false, is_removable: true, approved_substitutions: ['white_rice', 'quinoa'] },
  quinoa: { id: 'i22', slug: 'quinoa', name: 'Organic Quinoa', name_ar: 'كينوا عضوية', is_required: false, is_removable: true, approved_substitutions: ['white_rice', 'cauliflower_rice'] },
  eggplant: { id: 'i23', slug: 'eggplant', name: 'Air-Fried Eggplant', name_ar: 'باذنجان مشوي', is_required: false, is_removable: true },
  okra: { id: 'i24', slug: 'okra', name: 'Fresh Baby Okra', name_ar: 'بامية طازجة', is_required: true, is_removable: false },
  feta_cheese: { id: 'i30', slug: 'feta_cheese', name: 'Low-Fat Feta', name_ar: 'جبنة فيتا لايت', is_required: false, is_removable: true, allergen: 'dairy' },
  walnuts: { id: 'i31', slug: 'walnuts', name: 'Raw Walnuts', name_ar: 'جوز نيء', is_required: false, is_removable: true, allergen: 'nuts' },
};

const DISHES: Record<string, MenuDish> = {
  tuna_melt: {
    id: 'b1', slug: 'tuna_avocado_melt',
    name: 'Grilled Tuna Avocado Melt',
    name_ar: 'تونا مشوية مع أفوكادو',
    description: 'Sustainable tuna paired with fresh avocado on sprouted grain bread.',
    origin: 'USA',
    history: 'A mid-century diner classic evolved for heart health.',
    preparation_traditional: 'Mayo-heavy tuna on buttered white bread.',
    preparation_triangle: 'Greek yogurt binder, fresh avocado, and skim mozzarella.',
    kcals: 210, macros: { protein: 22, carbs: 18, fats: 6 },
    allergens: ['fish', 'gluten', 'dairy'],
    ingredients: [I.grilled_tuna, I.avocado_oil, I.feta_cheese],
  },
  shakshuka: {
    id: 'b2', slug: 'shakshuka',
    name: 'Spiced Shakshuka',
    name_ar: 'شكشوكة بالتوابل',
    description: 'Poached organic eggs in a rich tomato and bell pepper reduction.',
    origin: 'North Africa',
    preparation_triangle: 'Sauce prepared with cold-pressed olive oil.',
    kcals: 195, macros: { protein: 14, carbs: 12, fats: 9 },
    allergens: ['eggs', 'gluten'],
    ingredients: [I.organic_eggs, I.olive_oil],
  },
  halloumi_wrap: {
    id: 'b3', slug: 'halloumi_wrap',
    name: 'Halloumi & Zaatar Wrap',
    name_ar: 'لفائف الحلوم والزعتر',
    description: 'Grilled low-sodium halloumi with aromatic thyme.',
    origin: 'Cyprus',
    kcals: 230, macros: { protein: 18, carbs: 24, fats: 8 },
    allergens: ['dairy', 'gluten', 'sesame'],
    ingredients: [I.feta_cheese, I.olive_oil],
  },
  majboos: {
    id: 'l1', slug: 'chicken_majboos',
    name: 'Traditional Chicken Majboos',
    name_ar: 'مجبوس دجاج قطري',
    description: 'The aromatic heartbeat of Qatari cuisine, reimagined for modern vitality.',
    origin: 'Qatar',
    history: 'Majboos is the national dish of Qatar. It evolved from ancient spice trade routes connecting the Gulf to India.',
    preparation_traditional: 'Often uses heavy amounts of ghee and fried chicken parts with skin.',
    preparation_triangle: 'We use skinless, sous-vide chicken breast and a precise measure of heart-healthy oils.',
    isHeritage: true,
    kcals: 345, macros: { protein: 35, carbs: 42, fats: 6 },
    ingredients: [I.chicken_breast, I.white_rice, I.olive_oil],
  },
  maqlouba: {
    id: 'l2', slug: 'chicken_maqlouba',
    name: 'Levantine Maqlouba',
    name_ar: 'مقلوبة دجاج',
    description: 'Layered chicken and vegetables.',
    origin: 'Levant',
    kcals: 380, macros: { protein: 32, carbs: 45, fats: 8 },
    ingredients: [I.chicken_breast, I.white_rice, I.eggplant, I.olive_oil],
  },
  kabsa: {
    id: 'l3', slug: 'chicken_kabsa',
    name: 'Aromatic Chicken Kabsa',
    name_ar: 'كبسة دجاج عطرة',
    origin: 'Saudi Arabia',
    kcals: 360, macros: { protein: 34, carbs: 40, fats: 7 },
    ingredients: [I.chicken_breast, I.white_rice, I.olive_oil],
  },
  bamia: {
    id: 'd1', slug: 'beef_bamia',
    name: 'Premium Beef Bamia',
    name_ar: 'بامية باللحم',
    origin: 'Middle East',
    kcals: 310, macros: { protein: 28, carbs: 15, fats: 10 },
    ingredients: [I.beef_strips, I.okra, I.olive_oil],
  },
  salmon: {
    id: 'd2', slug: 'baked_salmon',
    name: 'Wild Salmon with Quinoa',
    name_ar: 'سلمون مع كينوا',
    kcals: 320, macros: { protein: 30, carbs: 20, fats: 12 },
    allergens: ['fish'],
    ingredients: [I.atlantic_salmon, I.quinoa, I.avocado_oil],
  },
  steak: {
    id: 'd3', slug: 'beef_steak',
    name: 'Lean Sirloin with Mash',
    name_ar: 'ستيك مع بطاطا مهروسة',
    kcals: 390, macros: { protein: 40, carbs: 25, fats: 14 },
    ingredients: [I.beef_strips, I.olive_oil],
  },
  acai: {
    id: 's1', slug: 'acai_bowl',
    name: 'Amazonian Açai Bowl',
    name_ar: 'وعاء آساي الأمازون',
    kcals: 180, macros: { protein: 4, carbs: 32, fats: 5 },
    allergens: ['nuts'],
    ingredients: [I.walnuts],
  }
};

const BASE_WEEK = [
  'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'
].map((day) => ({
  day,
  short: day.substring(0, 3),
  week: 1,
  items: {
    breakfast: [DISHES.tuna_melt, DISHES.shakshuka, DISHES.halloumi_wrap],
    lunch: [DISHES.majboos, DISHES.maqlouba, DISHES.kabsa],
    dinner: [DISHES.bamia, DISHES.salmon, DISHES.steak],
    snacks: [DISHES.acai],
  }
}));

export const WEEKLY_MENU: DailyMenu[] = [
  ...BASE_WEEK.map(d => ({ ...d, collection: 'autumn' as const })),
  ...BASE_WEEK.map(d => ({ ...d, collection: 'summer' as const })),
  ...BASE_WEEK.map(d => ({ ...d, collection: 'ramadan' as const })),
];
