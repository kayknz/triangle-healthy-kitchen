export const DELIVERY_WINDOWS = {
  breakfast: ['6-8 AM', '7-9 AM', '8-10 AM'],
  lunch: ['11 AM-1 PM', '12-2 PM', '1-3 PM'],
  dinner: ['4-6 PM', '5-7 PM', '6-8 PM'],
} as const;

export const DAYS_OF_WEEK = [
  'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
] as const;

export interface Ingredient {
  id: string;
  slug: string;
  name: string;
  name_ar?: string;
  is_required: boolean;
  is_removable: boolean;
  approved_substitutions?: string[];
  allergen?: string;
  dietary_impact?: string;
}

export interface MenuDish {
  id?: string;
  slug?: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  origin?: string;
  origin_ar?: string;
  history?: string;
  history_ar?: string;
  preparation_traditional?: string;
  preparation_traditional_ar?: string;
  preparation_triangle?: string;
  preparation_triangle_ar?: string;
  cooking_method?: string;
  cooking_method_ar?: string;
  interesting_fact?: string;
  interesting_fact_ar?: string;
  kcals: number;
  macros?: {
    protein: number;
    carbs: number;
    fats: number;
  };
  allergens?: string[];
  ingredients?: Ingredient[];
  isHeritage?: boolean;
}

export interface DailyMenu {
  day: string;
  short: string;
  week: number;
  collection: 'autumn' | 'summer' | 'ramadan';
  items: {
    breakfast: MenuDish[];
    lunch: MenuDish[];
    dinner: MenuDish[];
    snacks: MenuDish[];
  };
}

export interface GlobalSettings {
  id?: string;
  active_season: 'autumn' | 'summer' | 'ramadan';
  ramadan_mode: boolean;
  current_menu_period?: string;
  selection_deadline?: string;
}

export const PACKAGE_MEALS: Record<string, string[]> = {
  '1100kcal': ['breakfast', 'lunch', 'dinner', 'snacks'],
  '1400kcal': ['breakfast', 'lunch', 'dinner', 'snacks'],
  '1500kcal': ['breakfast', 'lunch', 'dinner', 'snacks'],
};

export const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

export interface MenuSelection {
  day_of_week: string;
  meal_type: string;
  dish_id?: string;
  dish_name: string;
  dish_kcals: number;
  week_start_date?: string;
  menu_period?: string;
  customizations?: {
    removed_ingredients?: string[];
    substitutions?: Record<string, string>;
  };
}

export interface ProgressEntry {
  id: string;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  notes: string | null;
  logged_at: string;
}

export interface Subscriber {
  id: string;
  package_id: string;
  package_name: string;
  status: string;
  full_name?: string | null;
  phone?: string | null;
  building_number: string | null;
  street: string | null;
  area: string | null;
  zone_number: string | null;
  maid_number: string | null;
  latitude: number | null;
  longitude: number | null;
  delivery_notes: string | null;
  breakfast_window: string | null;
  lunch_window: string | null;
  dinner_window: string | null;
  subscription_start?: string | null;
  current_period_end: string | null;
  is_owner?: boolean;
  paused_until?: string | null;
  allergies?: string[];
  weight_kg?: number | null;
  height_cm?: number | null;
  fitness_goal?: string | null;
  activity_level?: string;
  referral_code?: string;
  points_balance?: number;
  current_streak?: number;
  longest_streak?: number;
  membership_type?: string;
  reward_tier?: string;
}
