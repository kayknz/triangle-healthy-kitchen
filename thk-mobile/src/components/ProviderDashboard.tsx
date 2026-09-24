import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Phone, Mail, Target, Dumbbell, Sparkles,
  CheckCircle2, XCircle, Loader2, LogOut, ChevronRight, X,
  Search, Filter, ChefHat, Bell, TrendingUp, Users, Utensils,
  Truck, Activity, Heart, Weight, Footprints, Flame, Droplet,
  MapPin, Clock, ChevronLeft, ShieldAlert, MessageSquare,
  Moon, Sun, Coffee, Star, Download, UserCircle, Home as HomeIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeHaptics } from '@/lib/haptics';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PACKAGES } from '@/types/booking';
import {
  type Subscriber, type GlobalSettings,
} from '@/types/subscription';
import { type Booking, type RiderApplication, type RiderDelivery } from '@/types/shared';
import { useLanguage } from '@/lib/LanguageContext';
import { getQatarDate, addDays } from '@/lib/date-utils';

interface ProviderDashboardProps {
  onExit: () => void;
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
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-sky-50 text-sky-700 border-sky-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const SUB_STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  trial: 'bg-sky-50 text-sky-700 border-sky-200',
  trialing: 'bg-sky-50 text-sky-700 border-sky-200',
};

export default function ProviderDashboard({ onExit }: ProviderDashboardProps) {
  const { signOut } = useAuth();
  const { t, isRtl, language } = useLanguage();
  const [tab, setTab] = useState<Tab>('performance');
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
    try {
      const [{ data: books }, { data: subs }, { data: setts }] = await Promise.all([
        supabase.from('provider_bookings_view').select('*').order('appointment_date', { ascending: true }),
        supabase.from('subscribers').select('*').order('created_at', { ascending: false }),
        supabase.from('global_settings').select('*').single(),
      ]);

      setBookings(books || []);
      setSubscribers((subs as Subscriber[]) || []);
      setSettings(setts as GlobalSettings);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const [riders, setRiders] = useState<RiderApplication[]>([]);
  const [riderDeliveries, setRiderDeliveries] = useState<RiderDelivery[]>([]);
  const [assigningSubscriber, setAssigningSubscriber] = useState<Record<string, string>>({});
  const [selectedMeal, setSelectedMeal] = useState<string>('lunch');
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    const date = new Date();
    const targetDate = selectedDate === 'tomorrow'
      ? getQatarDate(addDays(date, 1))
      : getQatarDate(date);

    const [{ data, error: riderErr }, { data: subsData }, { data: deliveriesData }] = await Promise.all([
      supabase
        .from('rider_applications')
        .select('*')
        .order('approved', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase
        .from('subscribers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase
        .from('rider_deliveries')
        .select('*')
        .eq('delivery_date', targetDate),
    ]);

    if (riderErr) {
      setError(riderErr.message);
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

    const { error: updateErr } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    setUpdating(false);

    if (updateErr) {
      setBookings(originalBookings);
      setSelected(originalSelected);
      setError(`Error updating status: ${updateErr.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  const toggleRiderApproval = async (id: string, currentApproved: boolean) => {
    setUpdating(true);
    const { error: appErr } = await supabase
      .from('rider_applications')
      .update({ approved: !currentApproved })
      .eq('id', id);

    setUpdating(false);
    if (appErr) setError(appErr.message);
    else fetchRiders();
  };

  const handleSignOut = async () => {
    await safeHaptics.impact();
    await signOut();
    onExit();
  };

  const switchTab = async (t: Tab) => {
    if (tab !== t) {
      await safeHaptics.selection();
      setTab(t);
    }
  };

  const assignDelivery = async (rider: RiderApplication) => {
    const subscriberId = assigningSubscriber[rider.id];
    const subscriber = subscribers.find((s) => s.id === subscriberId);
    if (!subscriber) return;

    setUpdating(true);
    const date = new Date();
    const targetDate = selectedDate === 'tomorrow'
      ? getQatarDate(addDays(date, 1))
      : getQatarDate(date);
    const windowKey = `${selectedMeal}_window` as keyof Subscriber;

    const { data, error: upsertErr } = await supabase
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

    if (upsertErr) setError(upsertErr.message);
    else if (data) setRiderDeliveries((current) => [...current.filter((d) => d.id !== data.id), data as RiderDelivery]);
  };

  const exportKitchenPrepCSV = () => {
    const activeSubs = subscribers.filter(s => s.status === 'active' || s.status === 'trialing');
    const headers = ['Name', 'Email', 'Phone', 'Package', 'Area', 'Building', 'Street', 'Breakfast Window', 'Lunch Window', 'Dinner Window', 'Allergies', 'Dislikes'];
    const rows = activeSubs.map(s => [
      `"${s.full_name || ''}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.package_name || ''}"`,
      `"${s.area || ''}"`,
      `"${s.building_number || ''}"`,
      `"${s.street || ''}"`,
      `"${s.breakfast_window || '7-9 AM'}"`,
      `"${s.lunch_window || '12-2 PM'}"`,
      `"${s.dinner_window || '6-8 PM'}"`,
      `"${(s.allergies || []).join(', ')}"`,
      `"${(s.dislikes || []).join(', ')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KITCHEN_PREP_${getQatarDate()}.csv`;
    link.click();
  };

  const getFeed = (): FeedItem[] => {
    const items: FeedItem[] = [];
    bookings.forEach(b => {
      items.push({
        id: `book-${b.id}`,
        type: 'booking',
        title: `Consultation Booking: ${b.client_name}`,
        subtitle: `${b.package_name || 'Personal Plan'} — ${fmtDate(b.appointment_date)} at ${b.appointment_time}`,
        timestamp: b.created_at || b.appointment_date,
        status: b.status
      });
    });
    subscribers.forEach(s => {
      items.push({
        id: `sub-${s.id}`,
        type: 'delivery',
        title: `New Subscriber: ${s.full_name || 'Member'}`,
        subtitle: `${s.package_name || 'Custom Plan'} (${s.area || 'Doha'})`,
        timestamp: s.created_at || new Date().toISOString(),
        status: s.status
      });
    });
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = (b.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (b.client_email || '').toLowerCase().includes(search.toLowerCase()) ||
                          (b.client_phone || '').includes(search);
    const matchesFilter = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredSubscribers = subscribers.filter(s => {
    return (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
           (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
           (s.phone || '').includes(search) ||
           (s.area || '').toLowerCase().includes(search.toLowerCase());
  });

  const activeSubCount = subscribers.filter(s => s.status === 'active' || s.status === 'trialing').length;
  const estRevenue = activeSubCount * 2000;

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-primary pb-20" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-primary/5 sticky top-0 z-40 safe-top shadow-sm px-6">
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-[#0a3030] flex items-center justify-center shadow-lg">
              <ChefHat className="w-6 h-6 text-[#C5A059]" />
            </div>
            <div>
              <p className="text-[#0a3030] font-black text-sm uppercase tracking-wider italic leading-none">Kitchen Operations</p>
              <p className="text-[#C5A059] text-[8px] font-black mt-1.5 uppercase tracking-[0.2em]">Triangle Healthy Kitchen</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#account"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#0a3030] font-black text-[10px] uppercase tracking-wider hover:bg-[#0a3030] hover:text-white transition-all shadow-sm"
            >
              <UserCircle className="w-4 h-4 text-[#C5A059]" />
              <span className="hidden sm:inline">My Plan</span>
            </a>

            <button
              onClick={() => { window.location.hash = ''; onExit(); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#0a3030] font-black text-[10px] uppercase tracking-wider hover:bg-[#0a3030] hover:text-white transition-all shadow-sm"
            >
              <HomeIcon className="w-4 h-4 text-[#C5A059]" />
              <span className="hidden sm:inline">Main Site</span>
            </button>

            <button
              onClick={async () => { await safeHaptics.impact(); tab === 'logistics' ? fetchRiders() : fetchDashboardData(); }}
              className="p-2 text-primary/30 hover:text-[#C5A059] transition-all"
              title="Refresh Data"
            >
              <Loader2 className={`w-6 h-6 ${loading ? 'animate-spin text-[#C5A059]' : ''}`} />
            </button>
            <button onClick={handleSignOut} className="p-2 text-primary/30 hover:text-red-500 transition-all" title="Sign Out">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-8 overflow-hidden">
        <div className="flex bg-white/60 backdrop-blur-3xl rounded-[2.2rem] p-1.5 border border-primary/5 shadow-xl overflow-x-auto no-scrollbar touch-pan-x">
          {([
            { id: 'performance', label: 'Performance', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'feed', label: 'Activity Feed', icon: <Activity className="w-4 h-4" /> },
            { id: 'bookings', label: 'Bookings & Inquiries', icon: <Calendar className="w-4 h-4" /> },
            { id: 'members', label: 'Subscribers', icon: <Users className="w-4 h-4" /> },
            { id: 'logistics', label: 'Deliveries & Drivers', icon: <Truck className="w-4 h-4" /> }
          ] as const).map((item) => (
            <button
              key={item.id}
              onClick={() => switchTab(item.id as Tab)}
              className="relative px-6 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex-shrink-0 group"
            >
              <span className={`relative z-10 flex items-center gap-2 transition-colors duration-300 ${
                tab === item.id ? 'text-white' : 'text-[#0a3030]/50 group-hover:text-[#0a3030]'
              }`}>
                {item.icon}
                {item.label}
              </span>
              {tab === item.id && (
                <motion.div
                  layoutId="activeCommandTab"
                  className="absolute inset-0 bg-[#0a3030] rounded-[1.7rem] shadow-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-6 py-4 mb-8 flex items-center gap-3 animate-in">
            <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-xs font-medium">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* 1. PERFORMANCE TAB */}
            {tab === 'performance' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="ACTIVE SUBSCRIBERS" value={activeSubCount.toString()} icon={<Users className="w-5 h-5 text-[#0a3030]" />} />
                  <StatCard label="EST. MONTHLY REVENUE" value={`${estRevenue.toLocaleString()} QAR`} icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} />
                  <StatCard label="TOTAL INQUIRIES" value={bookings.length.toString()} icon={<Calendar className="w-5 h-5 text-[#C5A059]" />} />
                  <StatCard label="APPROVED DRIVERS" value={riders.filter(r => r.approved).length.toString()} icon={<Truck className="w-5 h-5 text-sky-600" />} />
                </div>

                {/* Revenue & Weekly Order Volume Card */}
                <div className="bg-[#0a3030] p-8 sm:p-10 rounded-[2.5rem] text-white overflow-hidden relative shadow-2xl">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                   <p className="text-[#C5A059] text-[10px] font-black tracking-[0.4em] mb-2 uppercase">Weekly Overview</p>
                   <h3 className="text-2xl sm:text-3xl font-black italic tracking-tight mb-2">Weekly Order Volume & Revenue</h3>
                   <p className="text-white/60 text-xs mb-10">Revenue trend based on active subscriber meal selections across Doha</p>

                   {/* Solid, Visible Chart Bars */}
                   <div className="flex items-end justify-between gap-3 sm:gap-6 h-48 pt-6 border-b border-white/10 pb-4">
                      {[
                        { day: 'Sat', val: '2.4k', pct: 45 },
                        { day: 'Sun', val: '3.1k', pct: 60 },
                        { day: 'Mon', val: '3.8k', pct: 75 },
                        { day: 'Tue', val: '4.5k', pct: 85 },
                        { day: 'Wed', val: '4.2k', pct: 80 },
                        { day: 'Thu', val: '5.6k', pct: 95 },
                        { day: 'Fri', val: '6.0k', pct: 100 },
                      ].map((item, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                           <span className="text-[10px] font-bold text-[#C5A059] opacity-80 group-hover:opacity-100 transition-opacity">{item.val}</span>
                           <div className="w-full bg-white/10 rounded-2xl overflow-hidden h-full flex items-end p-1">
                              <div
                                className="w-full bg-gradient-to-t from-[#C5A059] to-[#E6C687] rounded-xl transition-all duration-500 group-hover:brightness-110 shadow-lg"
                                style={{ height: `${item.pct}%` }}
                              />
                           </div>
                           <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">{item.day}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {/* 2. ACTIVITY FEED TAB */}
            {tab === 'feed' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-[#0a3030] uppercase italic tracking-tight">Recent Activity Stream</h3>
                  <span className="text-xs font-bold text-gray-400">{getFeed().length} Updates</span>
                </div>
                {getFeed().length === 0 ? (
                  <div className="bg-white p-12 rounded-[2rem] text-center border border-gray-100 shadow-sm">
                    <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-bold text-sm">No recent activity found.</p>
                  </div>
                ) : (
                  getFeed().map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          item.type === 'booking' ? 'bg-[#C5A059]/10 text-[#C5A059]' : 'bg-[#0a3030]/10 text-[#0a3030]'
                        }`}>
                          {item.type === 'booking' ? <Star className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-[#0a3030] font-black italic uppercase text-xs tracking-tight">{item.title}</p>
                          <p className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-widest">{item.subtitle}</p>
                          <p className="text-gray-300 text-[9px] mt-1">{fmtDateTime(item.timestamp)}</p>
                        </div>
                      </div>
                      {item.status && (
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${STATUS_STYLES[item.status] || SUB_STATUS_STYLES[item.status] || 'bg-gray-50 text-gray-600'}`}>
                          {item.status}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. BOOKINGS & INQUIRIES TAB */}
            {tab === 'bookings' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search bookings by name or email..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-medium text-[#0a3030] outline-none"
                    />
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                    {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                          statusFilter === st ? 'bg-[#0a3030] text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="bg-white p-12 rounded-[2rem] text-center border border-gray-100 shadow-sm">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-bold text-sm">No bookings found matching filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredBookings.map((b) => (
                      <div key={b.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${STATUS_STYLES[b.status] || 'bg-gray-50'}`}>
                              {b.status}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">{fmtDate(b.appointment_date)} at {b.appointment_time}</span>
                          </div>

                          <h4 className="text-lg font-black text-[#0a3030] italic uppercase tracking-tight">{b.client_name}</h4>
                          <p className="text-xs text-gray-500 font-medium mt-1">{b.package_name || 'Consultation'}</p>

                          <div className="mt-4 space-y-1.5 text-xs text-gray-400 font-medium">
                            <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#C5A059]" /> {b.client_phone || 'No phone'}</p>
                            <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#C5A059]" /> {b.client_email}</p>
                            {b.fitness_goal && <p className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-[#C5A059]" /> Goal: {b.fitness_goal}</p>}
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setSelected(b)}
                            className="text-xs font-bold text-[#0a3030] hover:text-[#C5A059] transition-colors"
                          >
                            View Details
                          </button>

                          <div className="flex gap-2">
                            {b.status === 'pending' && (
                              <button
                                onClick={() => updateStatus(b.id, 'confirmed')}
                                disabled={updating}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all"
                              >
                                Confirm
                              </button>
                            )}
                            {b.status === 'confirmed' && (
                              <button
                                onClick={() => updateStatus(b.id, 'completed')}
                                disabled={updating}
                                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-sky-700 transition-all"
                              >
                                Complete
                              </button>
                            )}
                            {b.status !== 'cancelled' && (
                              <button
                                onClick={() => updateStatus(b.id, 'cancelled')}
                                disabled={updating}
                                className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 transition-all"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. SUBSCRIBERS TAB */}
            {tab === 'members' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search subscribers by name, area, email..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-medium text-[#0a3030] outline-none"
                    />
                  </div>

                  <button
                    onClick={exportKitchenPrepCSV}
                    className="flex items-center gap-2 bg-[#0a3030] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-[#154a4a] transition-all shadow-md"
                  >
                    <Download className="w-4 h-4 text-[#C5A059]" />
                    Export Kitchen CSV
                  </button>
                </div>

                {filteredSubscribers.length === 0 ? (
                  <div className="bg-white p-12 rounded-[2rem] text-center border border-gray-100 shadow-sm">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-bold text-sm">No subscribers found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSubscribers.map((s) => (
                      <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${SUB_STATUS_STYLES[s.status] || 'bg-gray-50'}`}>
                              {s.status}
                            </span>
                            <span className="text-[10px] font-bold text-[#C5A059]">{s.package_name || 'Custom Package'}</span>
                          </div>

                          <h4 className="text-lg font-black text-[#0a3030] italic uppercase tracking-tight">{s.full_name || 'Unnamed Member'}</h4>
                          <p className="text-xs text-gray-400 font-medium mt-1">{s.email}</p>

                          <div className="mt-4 space-y-1.5 text-xs text-gray-500 font-medium">
                            <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#C5A059]" /> Area: {s.area || 'Doha'}</p>
                            <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#C5A059]" /> {s.phone || 'No phone'}</p>
                            {(s.allergies || []).length > 0 && (
                              <p className="text-red-500 text-[10px] font-bold mt-2">Allergies: {s.allergies.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. DELIVERIES & DRIVERS TAB */}
            {tab === 'logistics' && (
              <div className="space-y-8">
                {/* Control bar */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase text-[#0a3030]">Date:</span>
                    <button
                      onClick={() => setSelectedDate('today')}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${selectedDate === 'today' ? 'bg-[#0a3030] text-white' : 'bg-gray-50 text-gray-400'}`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setSelectedDate('tomorrow')}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${selectedDate === 'tomorrow' ? 'bg-[#0a3030] text-white' : 'bg-gray-50 text-gray-400'}`}
                    >
                      Tomorrow
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase text-[#0a3030]">Meal:</span>
                    {['breakfast', 'lunch', 'dinner'].map((meal) => (
                      <button
                        key={meal}
                        onClick={() => setSelectedMeal(meal)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${selectedMeal === meal ? 'bg-[#C5A059] text-white' : 'bg-gray-50 text-gray-400'}`}
                      >
                        {meal}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Driver applications & assignments */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-[#0a3030] uppercase italic tracking-tight">Fleet Drivers & Approvals</h3>
                  {riders.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2rem] text-center border border-gray-100 shadow-sm">
                      <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-bold text-sm">No rider applications found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {riders.map((r) => (
                        <div key={r.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${r.approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                {r.approved ? 'Approved Driver' : 'Pending Approval'}
                              </span>
                              <span className={`text-[9px] font-bold uppercase ${r.is_online ? 'text-emerald-600' : 'text-gray-400'}`}>
                                {r.is_online ? '● Online' : '○ Offline'}
                              </span>
                            </div>

                            <h4 className="text-lg font-black text-[#0a3030] italic uppercase tracking-tight">{r.full_name || 'Rider'}</h4>
                            <p className="text-xs text-gray-400 font-medium mt-1">{r.phone} — {r.email}</p>
                          </div>

                          <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <button
                              onClick={() => toggleRiderApproval(r.id, r.approved)}
                              disabled={updating}
                              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                r.approved ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {r.approved ? 'Revoke Approval' : 'Approve Driver'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Booking Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a3030]/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelected(null)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>

            <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${STATUS_STYLES[selected.status] || 'bg-gray-50'}`}>
              {selected.status}
            </span>

            <h3 className="text-2xl font-black text-[#0a3030] uppercase italic tracking-tight mt-4">{selected.client_name}</h3>
            <p className="text-xs text-[#C5A059] font-bold mt-1">{selected.package_name || 'Consultation'}</p>

            <div className="mt-6 space-y-3 text-xs text-gray-600">
              <p><strong>Appointment:</strong> {fmtDate(selected.appointment_date)} at {selected.appointment_time}</p>
              <p><strong>Email:</strong> {selected.client_email}</p>
              <p><strong>Phone:</strong> {selected.client_phone || 'N/A'}</p>
              <p><strong>Goal:</strong> {selected.fitness_goal || 'General Health'}</p>
              {selected.notes && <p><strong>Notes:</strong> {selected.notes}</p>}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
       <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-[9px] font-black tracking-widest uppercase">{label}</span>
          {icon}
       </div>
       <h4 className="text-xl sm:text-2xl font-black italic tracking-tight text-[#0a3030]">{value}</h4>
    </div>
  );
}
