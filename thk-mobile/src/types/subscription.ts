export const PAYMENT_METHODS = [
  { id: 'card', name: 'Tap Payment (Card)', icon: 'card', available: true },
] as const;

export const DELIVERY_WINDOWS = {
  breakfast: ['6-8 AM', '7-9 AM', '8-10 AM'],
  lunch: ['11 AM-1 PM', '12-2 PM', '1-3 PM'],
  dinner: ['4-6 PM', '5-7 PM', '6-8 PM'],
} as const;

export const DAYS_OF_WEEK = [
  'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
] as const;

export interface MenuDish {
  name: string;
  name_ar?: string;
  kcals: number;
  allergens?: string[];
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

// Package-specific meal availability
export const PACKAGE_MEALS: Record<string, string[]> = {
  '1100kcal': ['breakfast', 'lunch', 'snacks'],
  '1400kcal': ['breakfast', 'lunch', 'dinner'],
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
  dish_name: string;
  dish_kcals: number;
  week_start_date?: string;
  menu_period?: string;
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
  is_paused?: boolean;
  paused_until?: string | null;
  allergies?: string[];
  dislikes?: string[];
  activity_level?: string;
  referral_code?: string;
  weight_kg?: number | null;
  height_cm?: number | null;
  fitness_goal?: string | null;
  points?: number;
  referral_count?: number;
  taste_profile?: Record<string, any>;
  preferred_region_id?: string | null;
  membership_type?: string;
  reward_tier?: string;
  points_balance?: number;
  current_streak?: number;
  longest_streak?: number;
  regional_communities?: { name: string };
}

export interface RiderApp {
  id: string;
  user_id: string;
  current_lat?: number;
  current_lng?: number;
  last_active_at?: string;
}

export interface HealthEntry {
  id: string;
  data_type: string;
  payload: {
    weight_kg?: number;
    steps?: number;
    calories_burned?: number;
    calories_consumed?: number;
    sleep_hours?: number;
    water_ml?: number;
    notes?: string;
    manual?: boolean;
  };
  received_at: string;
}

export const HEALTH_METRICS = [
  { id: 'weight_kg', label: 'Weight', unit: 'kg', icon: 'weight', color: '#D4A843' },
  { id: 'steps', label: 'Steps', unit: '', icon: 'steps', color: '#5BA889' },
  { id: 'calories_burned', label: 'Cal. Burned', unit: 'kcal', icon: 'flame', color: '#E07856' },
  { id: 'calories_consumed', label: 'Cal. Eaten', unit: 'kcal', icon: 'utensils', color: '#D4A843' },
  { id: 'sleep_hours', label: 'Sleep', unit: 'hrs', icon: 'moon', color: '#7B8DB8' },
  { id: 'water_ml', label: 'Water', unit: 'ml', icon: 'droplet', color: '#5B9BD5' },
] as const;
