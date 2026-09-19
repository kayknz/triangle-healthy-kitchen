export interface Package {
  id: string;
  name: string;
  kcals: number;
  price: number;
  currency: string;
  meals: string;
  duration: string;
  description: string;
  highlight: string;
  image: string;
  meals_key?: string;
}

export interface BookingData {
  package_id: string;
  package_name: string;
  weight_kg: string;
  height_cm: string;
  fitness_goal: string;
  exercise_routine: string;
  wants_exercise_plan: boolean;
  dietary_restrictions: string;
  health_notes: string;
  appointment_date: string;
  appointment_time: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  terms_accepted: boolean;
}

export const PACKAGES: Package[] = [
  {
    id: '1100kcal',
    name: 'Essential Transformation',
    kcals: 1100,
    price: 1700,
    currency: 'QR',
    meals: '2_main_meals',
    duration: '28_day_cycle',
    description: 'Targeted calorie-control engineered for sustainable biological transformation.',
    highlight: 'clinical_precision',
    image: 'https://images.pexels.com/photos/7660437/pexels-photo-7660437.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    meals_key: '2_meals_1_snack',
  },
  {
    id: '1400kcal',
    name: 'Biological Balance',
    kcals: 1400,
    price: 2000,
    currency: 'QR',
    meals: '3_main_meals',
    duration: '28_day_cycle',
    description: 'Balanced macronutrient protocol for sustained energy and systemic vitality.',
    highlight: 'most_popular',
    image: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    meals_key: '3_main_meals',
  },
  {
    id: '1500kcal',
    name: 'Peak Performance',
    kcals: 1500,
    price: 2200,
    currency: 'QR',
    meals: '3_main_meals_supplemental',
    duration: '28_day_cycle',
    description: 'High-density nutrition engineered for active lifestyles and cognitive force.',
    highlight: 'premium_performance',
    image: 'https://images.pexels.com/photos/4929676/pexels-photo-4929676.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    meals_key: '3_meals_1_snack',
  },
  {
    id: 'signature_custom',
    name: 'Bespoke Master',
    kcals: 2000,
    price: 2800,
    currency: 'QR',
    meals: 'bespoke_selections',
    duration: 'unlimited_protocol',
    description: 'The pinnacle of Triangle. Hand-selected collections tailored to your exact taste profile.',
    highlight: 'bespoke_standard',
    image: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    meals_key: 'bespoke_menu',
  },
  {
    id: 'daily_trial',
    name: 'daily_trial',
    kcals: 1500,
    price: 175,
    currency: 'QR',
    meals: 'full_day_supply',
    duration: '1_day',
    description: 'daily_trial_desc',
    highlight: 'quick_access',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=1000',
    meals_key: 'flexible_meals',
  },
  {
    id: 'weekly_reset',
    name: 'weekly_reset',
    kcals: 1500,
    price: 1050,
    currency: 'QR',
    meals: '6_day_supply',
    duration: '1_week',
    description: 'weekly_reset_desc',
    highlight: 'short_term_focus',
    image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=1000',
    meals_key: 'flexible_meals',
  },
];

export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

export const FITNESS_GOALS = [
  'Weight Loss',
  'Muscle Gain',
  'Maintain Weight',
  'Improve Energy',
  'General Health',
  'Athletic Performance',
];

export const ALLERGIES = [
  'Nuts (Peanuts/Tree Nuts)',
  'Dairy',
  'Gluten',
  'Soy',
  'Eggs',
  'Seafood/Shellfish',
  'Sesame',
  'Mustard',
  'Celery'
];
