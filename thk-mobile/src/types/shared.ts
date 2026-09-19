export interface Booking {
  id: string;
  package_id: string;
  package_name: string;
  weight_kg: number | null;
  height_cm: number | null;
  fitness_goal: string | null;
  exercise_routine: string | null;
  wants_exercise_plan: boolean;
  dietary_restrictions: string | null;
  health_notes: string | null;
  appointment_date: string;
  appointment_time: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  status: string;
  created_at: string;
}

export interface RiderApplication {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  approved: boolean;
  created_at: string;
  approved_at: string | null;
  current_lat?: number;
  current_lng?: number;
  last_active_at?: string;
}

export interface RiderDelivery {
  id: string;
  rider_application_id: string;
  rider_user_id: string;
  subscriber_id: string;
  delivery_date: string;
  meal_type: string;
  time_window?: string;
  status: string;
  notes?: string;
  proof_photo_url?: string;
  assigned_at?: string;
  delivered_at?: string;
  updated_at?: string;
  rider_applications?: RiderApplication;
}
