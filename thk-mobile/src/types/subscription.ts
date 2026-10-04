export const PAYMENT_METHODS = [
  { id: 'card', name: 'Tap Payment (Card)', icon: 'card', available: true },
  { id: 'applepay', name: 'Apple Pay', icon: 'applepay', available: true },
  { id: 'cod', name: 'Cash on Delivery', icon: 'cod', available: true },
] as const;

export const DELIVERY_WINDOWS = {
  breakfast: ['6-8 AM', '7-9 AM', '8-10 AM'],
  lunch: ['11 AM-1 PM', '12-2 PM', '1-3 PM'],
  dinner: ['4-6 PM', '5-7 PM', '6-8 PM'],
} as const;

export const DAYS_OF_WEEK = [
  'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
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
  collection: 'summer' | 'autumn' | 'ramadan' | 'executive' | 'menu_a' | 'menu_c' | 'menu_d' | 'menu_e' | 'menu_f';
  items: {
    breakfast: MenuDish[];
    lunch: MenuDish[];
    dinner: MenuDish[];
    snacks: MenuDish[];
  };
}

export interface GlobalSettings {
  id?: string;
  current_menu_period?: string;
  selection_deadline?: string;
}

export interface RegionalCommunity {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  weekly_team_target_pct?: number | null;
}

export interface CommunityPost {
  id: string;
  content: string;
  created_at: string;
  subscriber?: { full_name?: string | null; current_streak?: number | null } | null;
  reactions?: Record<string, number>;
  user_reacted?: Record<string, boolean>;
}

// THK Meal Categories A-F
export const MEAL_CATEGORIES = [
  { id: 'A', proteinGrams: 150, carbsGrams: 120, label: 'Category A - Standard Balanced' },
  { id: 'B', proteinGrams: 200, carbsGrams: 200, label: 'Category B - High Protein & High Carbs' },
  { id: 'C', proteinGrams: 200, carbsGrams: 150, label: 'Category C - High Protein Balanced Carbs' },
  { id: 'D', proteinGrams: 200, carbsGrams: 100, label: 'Category D - High Protein Low Carbs' },
  { id: 'E', proteinGrams: 170, carbsGrams: 150, label: 'Category E - Medium Protein Balanced' },
  { id: 'F', proteinGrams: 150, carbsGrams: 100, label: 'Category F - Light Protein Low Carbs' },
] as const;

// THK Meal Selection Packages
export const MEAL_SELECTION_PACKAGES = [
  { id: '2m1s', label: '2 Meals + 1 Snack', price: 1700, mealCount: 2, meals: ['Lunch', 'Dinner'], snacks: 1 },
  { id: '3m', label: '3 Meals', price: 2000, mealCount: 3, meals: ['Breakfast', 'Lunch', 'Dinner'], snacks: 0 },
  { id: '3m1s', label: '3 Meals + 1 Snack', price: 2200, mealCount: 3, meals: ['Breakfast', 'Lunch', 'Dinner'], snacks: 1 },
  { id: '3m2s', label: '3 Meals + 2 Snacks', price: 2400, mealCount: 3, meals: ['Breakfast', 'Lunch', 'Dinner'], snacks: 2 },
  { id: '4m', label: '4 Meals', price: 2600, mealCount: 4, meals: ['Breakfast', 'Lunch', 'Dinner'], snacks: 0 },
  { id: '4m1s', label: '4 Meals + 1 Snack', price: 2800, mealCount: 4, meals: ['Breakfast', 'Lunch', 'Dinner'], snacks: 1 },
  { id: '4m2s', label: '4 Meals + 2 Snacks', price: 3000, mealCount: 4, meals: ['Breakfast', 'Lunch', 'Dinner'], snacks: 2 },
  { id: 'custom', label: 'Custom Protocol', price: null, mealCount: 0, meals: ['Breakfast', 'Lunch', 'Dinner'], snacks: 0, custom: true },
] as const;

export const PACKAGE_MEALS: Record<string, string[]> = {
  '2m1s': ['lunch', 'dinner', 'snacks'],
  '3m': ['breakfast', 'lunch', 'dinner'],
  '3m1s': ['breakfast', 'lunch', 'dinner', 'snacks'],
  '3m2s': ['breakfast', 'lunch', 'dinner', 'snacks'],
  '4m': ['breakfast', 'lunch', 'dinner', 'snacks'],
  '4m1s': ['breakfast', 'lunch', 'dinner', 'snacks'],
  '4m2s': ['breakfast', 'lunch', 'dinner', 'snacks'],
  '1100kcal': ['lunch', 'dinner', 'snacks'],
  '1400kcal': ['breakfast', 'lunch', 'dinner'],
  '1500kcal': ['breakfast', 'lunch', 'dinner', 'snacks'],
  '1600kcal': ['breakfast', 'lunch', 'dinner', 'snacks', 'snacks_2'],
  daily_trial: ['breakfast', 'lunch', 'dinner', 'snacks'],
  weekly_reset: ['breakfast', 'lunch', 'dinner', 'snacks'],
  '2000kcal': ['breakfast', 'lunch', 'dinner', 'snacks'],
};

export const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snack 1',
  snacks_2: 'Snack 2',
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
  subscriber_id: string;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  notes: string | null;
  logged_at: string;
}

export interface Subscriber {
  id: string;
  user_id: string;
  package_id: string;
  package_name: string;
  status: string;
  category?: string;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
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
  tap_charge_id?: string | null;
  last_payment_id?: string | null;
  current_period_end: string | null;
  is_owner?: boolean;
  friday_delivery_addon?: boolean;
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
  remaining_days?: number;
  payment_status?: string;
  subscription_status?: string;
}

export interface RiderApp {
  id: string;
  user_id: string;
  phone?: string;
  email?: string;
  full_name?: string;
  approved: boolean;
  is_online?: boolean;
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

// --- THK OPERATIONAL TYPES ---

export type THKRole = 'ceo' | 'admin' | 'transport' | 'kitchen' | 'driver' | 'customer' | 'owner' | 'rider' | 'subscriber';

export interface THKRegistration {
  id: string;
  phone?: string;
  email?: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  payload_json?: any;
  reviewed_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface THKCustomer {
  id: string;
  user_id: string;
  registration_id?: string;
  phone?: string;
  email?: string;
  name: string;
  status: 'Active' | 'Pending Payment' | 'Paused' | 'Pending';
  category?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'Standard';
  meal_package_id?: string;
  plan?: string;
  payment_status: 'Paid' | 'Awaiting Payment' | 'Cash Pending' | 'Payment Uploaded' | 'Waiting Admin Approval';
  subscription_status: 'Active' | 'Pending' | 'Paused';
  remaining_days: number;
  payload_json?: any;
  created_at: string;
  updated_at?: string;
}

export interface KitchenJob {
  id: string;
  customer_id: string;
  service_date: string;
  status: 'queued' | 'held_payment' | 'paused' | 'completed' | 'canceled';
  payload_json?: {
    menu?: any[];
    selections?: any[];
    package?: string;
    notes?: string;
    allergies?: string[];
  };
  customer_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface DeliveryJob {
  id: string;
  customer_id: string;
  service_date: string;
  zone?: string;
  area?: string;
  assigned_driver_user_id?: string;
  status: 'queued' | 'held_payment' | 'paused' | 'in_transit' | 'delivered' | 'failed';
  payload_json?: {
    address?: string;
    map?: string;
    time?: string;
    preference?: string;
    note?: string;
  };
  customer_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details_json?: any;
  ip_address?: string;
  created_at: string;
}

export const HEALTH_METRICS = [
  { id: 'weight_kg', label: 'Weight', unit: 'kg', icon: 'weight', color: '#D4A843' },
  { id: 'steps', label: 'Steps', unit: '', icon: 'steps', color: '#5BA889' },
  { id: 'calories_burned', label: 'Cal. Burned', unit: 'kcal', icon: 'flame', color: '#E07856' },
  { id: 'calories_consumed', label: 'Cal. Eaten', unit: 'kcal', icon: 'utensils', color: '#D4A843' },
  { id: 'sleep_hours', label: 'Sleep', unit: 'hrs', icon: 'moon', color: '#7B8DB8' },
  { id: 'water_ml', label: 'Water', unit: 'ml', icon: 'droplet', color: '#5B9BD5' },
] as const;
