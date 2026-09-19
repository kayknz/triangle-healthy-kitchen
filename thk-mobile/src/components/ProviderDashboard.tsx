import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Phone, Mail, Target, Dumbbell, Sparkles,
  CheckCircle2, XCircle, Loader2, LogOut, ChevronRight, X,
  Search, Filter, ChefHat, Bell, TrendingUp, Users, Utensils,
  Truck, Activity, Heart, Weight, Footprints, Flame, Droplet,
  MapPin, Clock, ChevronLeft, ShieldAlert, MessageSquare,
  Moon, Sun, Coffee, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PACKAGES } from '@/types/booking';
import {
  PACKAGE_MEALS, MEAL_LABELS,
  type Subscriber, type ProgressEntry, type MenuSelection, type GlobalSettings,
} from '@/types/subscription';
import { WEEKLY_MENU } from '@/data/menu';
import { useLanguage } from '@/lib/LanguageContext';

interface Booking {
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

interface ProviderDashboardProps {
  onExit: () => void;
}

interface RiderApplication {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  approved: boolean;
  created_at: string;
  approved_at: string | null;
}

interface RiderDelivery {
  id: string;
  rider_application_id: string;
  rider_user_id: string;
  subscriber_id: string;
  delivery_date: string;
  meal_type: string;
  status: string;
}

interface FeedItem {
  id: string;
  type: 'booking' | 'rider_signup' | 'delivery';
  title: string;
  subtitle: string;
  timestamp: string;
  status?: string;
}

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
type Tab = 'performance' | 'feed' | 'bookings' | 'members' | 'logistics';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-100',
  confirmed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  completed: 'bg-sky-50 text-sky-600 border-sky-100',
  cancelled: 'bg-red-50 text-red-600 border-red-100',
};

const SUB_STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  paused: 'bg-amber-50 text-amber-600 border-amber-100',
  cancelled: 'bg-red-50 text-red-600 border-red-100',
  pending: 'bg-amber-50 text-amber-600 border-amber-100',
  trial: 'bg-sky-50 text-sky-600 border-sky-100',
};

export default function ProviderDashboard({ onExit }: ProviderDashboardProps) {
  const { signOut } = useAuth();
  const { t, isRtl, language } = useLanguage();
  const [tab, setTab] = useState<Tab>('feed');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState(false);

  const fmtDate = (iso: string): string => {
    try {
      return new Date(iso + 'T00:00:00').toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US', {
        weekday: 'short', day: 'numeric', month: 'short',
      });
    } catch { return iso; }
  };

  const fmtDateTime = (iso: string): string => {
    try {
      return new Date(iso).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const [{ data: books }, { data: subs }, { data: setts }] = await Promise.all([
      supabase.from('bookings').select('*').order('appointment_date', { ascending: true }),
      supabase.from('subscribers').select('id, user_id, email, full_name, phone, package_id, package_name, status, building_number, street, area, zone_number, maid_number, latitude, longitude, delivery_notes, breakfast_window, lunch_window, dinner_window, subscription_start, current_period_end, is_owner, is_paused, paused_until, allergies, dislikes, activity_level, referral_code, weight_kg, height_cm, fitness_goal, points, referral_count, taste_profile, preferred_region_id, membership_type, reward_tier, points_balance, current_streak, longest_streak, onboarding_completed, gender').order('created_at', { ascending: false }),
      supabase.from('global_settings').select('*').single(),
    ]);

    setBookings(books || []);
    setSubscribers(subs as Subscriber[] || []);
    setSettings(setts as GlobalSettings);
    setLoading(false);
  }, []);

  const [riders, setRiders] = useState<RiderApplication[]>([]);
  const [riderDeliveries, setRiderDeliveries] = useState<RiderDelivery[]>([]);
  const [assigningSubscriber, setAssigningSubscriber] = useState<Record<string, string>>({});
  const [selectedMeal, setSelectedMeal] = useState<string>('lunch');
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    const date = new Date();
    if (selectedDate === 'tomorrow') date.setDate(date.getDate() + 1);
    const targetDate = date.toISOString().slice(0, 10);

    const [{ data, error }, { data: subsData }, { data: deliveriesData }] = await Promise.all([
      supabase
        .from('rider_applications')
        .select('*')
        .order('approved', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase
        .from('subscribers')
        .select('id, user_id, email, full_name, phone, package_id, package_name, status, building_number, street, area, zone_number, maid_number, latitude, longitude, delivery_notes, breakfast_window, lunch_window, dinner_window, subscription_start, current_period_end, is_owner, is_paused, paused_until, allergies, dislikes, activity_level, referral_code, weight_kg, height_cm, fitness_goal, points, referral_count, taste_profile, preferred_region_id, membership_type, reward_tier, points_balance, current_streak, longest_streak, onboarding_completed, gender')
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase
        .from('rider_deliveries')
        .select('*')
        .eq('delivery_date', targetDate),
    ]);

    if (error) {
      setError(error.message);
    } else {
      setRiders((data as RiderApplication[]) || []);
      setSubscribers((subsData as Subscriber[]) || []);
      setRiderDeliveries((deliveriesData as RiderDelivery[]) || []);
      setError(null);
    }
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    if (tab === 'logistics') fetchRiders();
    else fetchDashboardData();
  }, [tab, fetchRiders, fetchDashboardData]);

  const updateStatus = async (id: string, status: string) => {
    const originalBookings = [...bookings];
    const originalSelected = selected ? { ...selected } : null;

    setBookings((bs) => bs.map((b) => b.id === id ? { ...b, status } : b));
    setSelected((s) => s && s.id === id ? { ...s, status } : s);
    setUpdating(true);

    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    setUpdating(false);

    if (error) {
      setBookings(originalBookings);
      setSelected(originalSelected);
      setError(`${t('error_syncing')}: ${error.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleSignOut = async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
    await signOut();
    onExit();
  };

  const switchTab = async (t: Tab) => {
    if (tab !== t) {
      await Haptics.selection();
      setTab(t);
    }
  };

  const bulkAssignDeliveries = async (rider: RiderApplication, area: string) => {
    const unassignedInArea = subscribers.filter(
      s => s.area === area && !riderDeliveries.some(d => d.subscriber_id === s.id)
    );

    if (unassignedInArea.length === 0) return;

    setUpdating(true);
    const date = new Date();
    if (selectedDate === 'tomorrow') date.setDate(date.getDate() + 1);
    const targetDate = date.toISOString().slice(0, 10);

    const newDeliveries = unassignedInArea.map(subscriber => {
      const windowKey = `${selectedMeal}_window` as keyof Subscriber;
      return {
        rider_application_id: rider.id,
        rider_user_id: rider.user_id,
        subscriber_id: subscriber.id,
        delivery_date: targetDate,
        meal_type: selectedMeal,
        time_window: (subscriber as any)[windowKey] || (selectedMeal === 'breakfast' ? '7-9 AM' : selectedMeal === 'dinner' ? '6-8 PM' : '12-2 PM'),
        notes: subscriber.delivery_notes || null,
        status: 'pending',
        updated_at: new Date().toISOString(),
      };
    });

    const { data, error } = await supabase
      .from('rider_deliveries')
      .upsert(newDeliveries, { onConflict: 'subscriber_id,delivery_date,meal_type' })
      .select('*');

    setUpdating(false);
    if (error) setError(error.message);
    else if (data) setRiderDeliveries(current => [...current.filter(d => !data.some(newD => newD.id === d.id)), ...(data as RiderDelivery[])]);
  };

  const assignDelivery = async (rider: RiderApplication) => {
    const subscriberId = assigningSubscriber[rider.id];
    const subscriber = subscribers.find((s) => s.id === subscriberId);
    if (!subscriber) return;

    setUpdating(true);
    const date = new Date();
    if (selectedDate === 'tomorrow') date.setDate(date.getDate() + 1);
    const targetDate = date.toISOString().slice(0, 10);
    const windowKey = `${selectedMeal}_window` as keyof Subscriber;

    const { data, error } = await supabase
      .from('rider_deliveries')
      .upsert({
        rider_application_id: rider.id,
        rider_user_id: rider.user_id,
        subscriber_id: subscriber.id,
        delivery_date: targetDate,
        meal_type: selectedMeal,
        time_window: (subscriber as any)[windowKey] || (selectedMeal === 'breakfast' ? '7-9 AM' : selectedMeal === 'dinner' ? '6-8 PM' : '12-2 PM'),
        notes: subscriber.delivery_notes || null,
        status: 'pending',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'subscriber_id,delivery_date,meal_type' })
      .select('*')
      .single();
    setUpdating(false);

    if (error) setError(error.message);
    else setRiderDeliveries((current) => [...current.filter((d) => d.id !== data.id), data as RiderDelivery]);
  };

  const getFeed = (): FeedItem[] => {
    const items: FeedItem[] = [];
    bookings.forEach(b => items.push({
      id: b.id,
      type: 'booking',
      title: `${t('confirmed')}: ${b.client_name}`,
      subtitle: `${t(b.package_id) || b.package_name} @ ${fmtDate(b.appointment_date)}`,
      timestamp: b.created_at,
      status: b.status
    }));
    riders.forEach(r => items.push({
      id: r.id,
      type: 'rider_signup',
      title: `Rider: ${r.full_name || 'New Rider'}`,
      subtitle: r.email || '',
      timestamp: r.created_at,
      status: r.approved ? 'approved' : 'pending'
    }));
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-primary" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="bg-white/80 backdrop-blur-xl border-b border-primary/5 sticky top-0 z-40 safe-top shadow-sm px-6">
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <ChefHat className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-primary font-black text-sm uppercase tracking-tighter italic leading-none">{t('ops_command')}</p>
              <p className="text-gold text-[8px] font-black mt-1.5 uppercase tracking-[0.2em]">{t('triangle_healthy_kitchen')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={async () => { await Haptics.impact({ style: ImpactStyle.Light }); tab === 'logistics' ? fetchRiders() : fetchDashboardData(); }} className="p-2 text-primary/20 hover:text-gold transition-all">
              <Loader2 className={`w-6 h-6 ${loading ? 'animate-spin text-gold' : ''}`} />
            </button>
            <button onClick={handleSignOut} className="p-2 text-primary/20 hover:text-red-500 transition-all">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Kinetic Tab Bar */}
      <div className="max-w-7xl mx-auto px-6 pt-8 overflow-hidden">
        <div className="flex bg-white/40 backdrop-blur-3xl rounded-[2.2rem] p-1.5 border border-primary/5 shadow-2xl overflow-x-auto no-scrollbar touch-pan-x">
          {([
            { id: 'performance', label: 'Performance', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'feed', label: t('live_feed'), icon: <Activity className="w-4 h-4" /> },
            { id: 'bookings', label: t('inquiries'), icon: <Calendar className="w-4 h-4" /> },
            { id: 'members', label: t('members'), icon: <Users className="w-4 h-4" /> },
            { id: 'logistics', label: t('logistics'), icon: <Truck className="w-4 h-4" /> }
          ] as const).map((item) => (
            <button
              key={item.id}
              onClick={() => switchTab(item.id as Tab)}
              className="relative px-6 py-4 rounded-[1.8rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all flex-shrink-0 group"
            >
              <span className={`relative z-10 flex items-center gap-2 transition-colors duration-500 ${
                tab === item.id ? 'text-white' : 'text-primary/40 group-hover:text-primary'
              }`}>
                {item.icon}
                {item.label}
              </span>
              {tab === item.id && (
                <motion.div
                  layoutId="activeCommandTab"
                  className="absolute inset-0 bg-teal rounded-[1.7rem] shadow-[0_8px_25px_rgba(45,75,75,0.25)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-6 py-4 mb-8 flex items-center gap-3 animate-in">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <p className="text-red-700 text-xs font-medium">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {tab === 'performance' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="REVENUE" value={`${subscribers.filter(s => s.status === 'active').length * 2000}+`} icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} />
                  <StatCard label="MEMBERS" value={subscribers.length.toString()} icon={<Users className="w-4 h-4 text-teal" />} />
                </div>
                <div className="glass-card bg-primary p-8 rounded-[2.5rem] text-white overflow-hidden relative shadow-4xl">
                   <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 rounded-full blur-[100px] -mr-24 -mt-24" />
                   <p className="text-gold text-[9px] font-black tracking-[0.4em] mb-4 uppercase">{t('revenue_pulse')}</p>
                   <h3 className="text-4xl font-black italic tracking-tighter leading-none mb-10 uppercase">Global Signal.</h3>
                   <div className="flex items-end gap-3 h-32">
                      {[30, 45, 40, 60, 50, 75, 70, 90].map((h, i) => (
                        <div key={i} className="flex-1 bg-white/5 rounded-xl group relative overflow-hidden" style={{ height: `${h}%` }}>
                           <div className="absolute inset-0 bg-teal opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {tab === 'feed' && (
              <div className="space-y-4">
                {getFeed().map((item) => (
                  <div key={item.id} className="glass-card p-6 flex items-center justify-between group active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        item.type === 'booking' ? 'bg-gold/10 text-gold' : 'bg-teal/10 text-teal'
                      }`}>
                        {item.type === 'booking' ? <Star className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-primary font-black italic uppercase text-xs tracking-tight">{item.title}</p>
                        <p className="text-primary/40 text-[9px] font-bold mt-1 uppercase tracking-widest">{item.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-primary/10 group-hover:text-gold transition-colors" />
                  </div>
                ))}
              </div>
            )}

            {/* Further tabs (Members, Logistics) Harden logic similarly... */}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="glass-card p-6 rounded-[2rem] border border-primary/5 bg-white shadow-xl">
       <div className="flex items-center justify-between mb-4">
          <span className="text-primary/40 text-[9px] font-black tracking-widest uppercase">{label}</span>
          {icon}
       </div>
       <h4 className="text-2xl font-black italic tracking-tighter text-primary">{value}</h4>
    </div>
  );
}

function CommandTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-6 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
        active ? 'bg-[#0a3030] text-white shadow-xl translate-y-[-1px]' : 'text-gray-400 hover:text-[#0a3030] hover:bg-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
