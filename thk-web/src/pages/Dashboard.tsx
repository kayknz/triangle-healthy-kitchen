import React, { useState, useEffect, useCallback } from 'react';
import {
  ChefHat, Activity, TrendingUp, Users, Truck, Calendar, Bell,
  ShieldAlert, Loader2, LogOut, ChevronRight, X, Search,
  Utensils, MapPin, MessageSquare, TrendingDown, Star, CheckCircle, XCircle, Clock,
  ArrowLeft, Heart, Zap, Flame, Scale, Ruler, Target, Trash2, Phone, MessageCircle, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { useAuth } from '../lib/auth';
import { getQatarDate } from '../lib/date-utils';
import { useLanguage } from '../lib/LanguageContext';
import { PACKAGES } from '../types/booking';
import { Subscriber } from '../types/subscription';

interface GlobalSettings {
  id?: string;
  active_season: 'autumn' | 'summer' | 'ramadan';
  ramadan_mode: boolean;
  current_menu_period?: string;
  selection_deadline?: string;
}

interface Rider {
  id: string;
  user_id: string;
  full_name?: string | null;
  phone?: string | null;
  approved: boolean;
  is_online?: boolean;
}

interface Booking {
  id: string;
  client_name: string;
  package_name: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  client_email: string;
  client_phone: string;
  created_at: string;
}

type Tab = 'performance' | 'feed' | 'bookings' | 'members' | 'logistics';

interface FeedEvent {
  time: string;
  event: string;
  type: 'booking' | 'rider' | 'delivery' | 'system';
}

export default function Dashboard() {
  const { signOut, isOwner } = useAuth();
  const { t, isRtl } = useLanguage();
  const [tab, setTab] = useState<Tab>('performance');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [pendingRiders, setPendingRiders] = useState<any[]>([]);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Member Detail States
  const [selectedMember, setSelectedMember] = useState<Subscriber | null>(null);
  const [memberMenu, setMemberMenu] = useState<any[]>([]);
  const [memberProgress, setMemberProgress] = useState<any[]>([]);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const addFeedEvent = useCallback((message: string, type: FeedEvent['type']) => {
    const newEvent: FeedEvent = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      event: message,
      type
    };
    setFeedEvents(prev => [newEvent, ...prev].slice(0, 50));
  }, []);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const { data: isProvider } = await supabase.rpc('is_provider');
      if (!isProvider && !isOwner) {
        setAccessDenied(true);
        return;
      }

      const [subsRes, bookingsRes, ridersRes, pendingRidersRes, notificationsRes, settingsRes] = await Promise.all([
        supabase.from('subscribers').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*').order('appointment_date', { ascending: true }),
        supabase.from('rider_applications').select('id, user_id, full_name, phone, approved, is_online').eq('approved', true).order('full_name'),
        supabase.from('rider_applications').select('id, user_id, full_name, phone, approved, created_at').eq('approved', false).order('created_at', { ascending: false }),
        supabase.from('notifications').select('subject, status, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('global_settings').select('*').single()
      ]);

      if (subsRes.error) throw subsRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      if (ridersRes.error) throw ridersRes.error;
      if (pendingRidersRes.error) throw pendingRidersRes.error;

      setSubscribers(subsRes.data as Subscriber[] || []);
      setBookings(bookingsRes.data as Booking[] || []);
      setRiders((ridersRes.data || []) as Rider[]);
      setPendingRiders(pendingRidersRes.data || []);

      if (!isSilent) {
        const initialEvents: FeedEvent[] = [];
        bookingsRes.data?.slice(0, 5).forEach(b => initialEvents.push({
          time: new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: `Consultation: ${b.client_name}`,
          type: 'booking'
        }));

        const safeNotifications = notificationsRes.data || [];
        safeNotifications.forEach(n => initialEvents.push({
          time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: `Email Status: ${n.status.toUpperCase()}`,
          type: 'system'
        }));
        setFeedEvents(initialEvents.sort((a,b) => b.time.localeCompare(a.time)));
      }

      if (settingsRes.data) {
        setSettings(settingsRes.data as GlobalSettings);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 45000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const approveRider = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('rider_applications').update({ approved: true }).eq('id', id);
      if (error) throw error;
      alert('Rider Approved.');
      fetchData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    setLoading(true);
    try {
      const booking = bookings.find(b => b.id === id);
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
      if (error) throw error;

      addFeedEvent(`Booking updated to ${status.toUpperCase()}`, 'system');

      if (status === 'cancelled' && booking) {
        await supabase.functions.invoke('send-booking-notification', {
          body: {
            type: 'cancellation',
            client_name: booking.client_name,
            client_email: booking.client_email,
            appointment_date: booking.appointment_date,
            appointment_time: booking.appointment_time,
            package_name: booking.package_name
          }
        });
      }

      fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updates: Partial<GlobalSettings>) => {
    setSavingSettings(true);
    try {
      const { error } = await supabase.from('global_settings').update(updates).eq('id', settings?.id);
      if (error) throw error;
      setSettings(prev => prev ? { ...prev, ...updates } : null);
      alert('Global Settings Synchronized.');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const assignRider = async (subscriberId: string, riderApplicationId: string) => {
    if (!riderApplicationId) return;
    setLoading(true);
    try {
      const rider = riders.find(r => r.id === riderApplicationId);
      if (!rider) throw new Error('Rider identification failure.');

      const { error: assignmentError } = await supabase.from('rider_deliveries').upsert({
        subscriber_id: subscriberId,
        rider_application_id: rider.id,
        rider_user_id: rider.user_id,
        status: 'pending',
        delivery_date: getQatarDate(),
        meal_type: 'lunch'
      }, { onConflict: 'subscriber_id,delivery_date,meal_type' });

      if (assignmentError) throw assignmentError;
      alert('Unit assigned.');
      fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const viewMemberDetails = async (subscriber: Subscriber) => {
    setSelectedMember(subscriber);
    setFetchingDetails(true);
    try {
      const [menuRes, progressRes] = await Promise.all([
        supabase.from('weekly_menu_selections').select('*').eq('subscriber_id', subscriber.id).order('day_of_week'),
        supabase.from('progress_entries').select('*').eq('subscriber_id', subscriber.id).order('logged_at', { ascending: false }).limit(10)
      ]);
      setMemberMenu(menuRes.data || []);
      setMemberProgress(progressRes.data || []);
    } catch (e) {
      console.error('Audit Latency');
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleExportPrepList = async () => {
    const active = subscribers.filter(s => s.status === 'active');
    const { data: allSelections } = await supabase.from('weekly_menu_selections').select('*');
    const headers = ['Name', 'Package', 'Area', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
    const rows = active.map(s => {
      const selections = allSelections?.filter(sel => sel.subscriber_id === s.id) || [];
      const getDish = (day: string) => selections.find(sel => sel.day_of_week === day)?.dish_name || 'CHEF CHOICE';
      return [s.full_name, s.package_name, s.area || 'DOHA', getDish('Saturday'), getDish('Sunday'), getDish('Monday'), getDish('Tuesday'), getDish('Wednesday'), getDish('Thursday')];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `KITCHEN-PREP-${getQatarDate()}.csv`;
    link.click();
  };

  const stats = {
    revenue: subscribers.filter(s => s.status === 'active').reduce((acc, s) => acc + (PACKAGES.find(p => p.id === s.package_id)?.price || 0), 0),
    activeMembers: subscribers.filter(s => s.status === 'active').length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="glass-card p-16 max-w-lg border-red-500/20 shadow-4xl">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-8" />
          <h2 className="text-4xl font-black text-primary tracking-tighter uppercase italic">Security Clearance Required</h2>
          <button onClick={handleSignOut} className="btn-primary mt-10 w-full">Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background py-32 px-4 md:px-12 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-20 sm:mb-32">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 sm:gap-24">
            <div className="space-y-6 sm:space-y-10 flex-1 min-w-fit">
              <div className="badge bg-gold/10 border-gold/20 py-2.5 px-6 w-fit">
                <Activity className="w-3.5 h-3.5 fill-gold animate-glow" />
                <span className="font-black tracking-[0.5em] text-[10px] text-gold uppercase">{t('ops_command') || 'Ops Command'}</span>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif italic text-primary leading-[0.85] tracking-tighter drop-shadow-xl uppercase w-full max-w-[800px] flex-shrink-0">
                <span className="whitespace-nowrap">Operational</span><br />
                <span className="text-gold font-sans font-black not-italic tracking-tighter text-2xl sm:text-4xl lg:text-5xl opacity-80 block mt-2">Command Center.</span>
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 justify-end w-full lg:w-auto flex-shrink-0">
               <div className="glass-card bg-primary p-8 md:p-10 border-none shadow-4xl relative overflow-hidden w-full sm:w-[320px] lg:w-[380px] flex-shrink-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="flex justify-between items-start mb-4 relative z-10">
                     <p className="text-gold text-[9px] font-black uppercase tracking-[0.4em]">Revenue Pulse</p>
                     <div className="flex items-center gap-1.5 text-emerald-400">
                        <Zap className="w-3 h-3 fill-current animate-pulse" />
                        <span className="text-[7px] font-black uppercase tracking-widest">Live Sync</span>
                     </div>
                  </div>
                  <div className="flex items-end gap-3 relative z-10">
                     <h4 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter leading-none whitespace-nowrap">QAR {stats.revenue.toLocaleString()}</h4>
                     <span className="text-white/30 text-[10px] font-black uppercase mb-1 tracking-widest">Total</span>
                  </div>
               </div>

               <div className="flex bg-white/60 backdrop-blur-xl rounded-[3rem] p-2 border border-primary/10 shadow-4xl overflow-x-auto no-scrollbar touch-pan-x w-full sm:w-auto justify-start sm:justify-center scroll-smooth snap-x snap-mandatory">
                 {(['performance', 'feed', 'bookings', 'members', 'logistics'] as const).map((tKey) => (
                   <button
                     key={tKey}
                     onClick={() => setTab(tKey)}
                     className={`relative px-6 sm:px-10 py-4 sm:py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all snap-start whitespace-nowrap ${
                       tab === tKey ? 'bg-primary !text-white shadow-3xl scale-105' : 'text-primary/70 hover:text-primary hover:bg-white/40'
                     }`}
                   >
                     {t(tKey) || tKey.toUpperCase()}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </header>

        {loading && !selectedMember && <div className="flex justify-center py-40"><Loader2 className="w-16 h-16 animate-spin text-gold" /></div>}

        {!loading && (
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-20">
              {tab === 'performance' && (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                    <StatCard label="Monthly Pipeline" value={`${stats.revenue.toLocaleString()} QR`} icon={TrendingUp} theme="white" />
                    <StatCard label="Active Portfolio" value={stats.activeMembers.toString()} icon={Users} theme="teal" />
                    <StatCard label="Incoming Audits" value={stats.pendingBookings.toString()} icon={Calendar} theme="white" />
                  </div>

                  {/* Menu Command Hub */}
                  <div className="glass-card p-10 bg-white shadow-3xl">
                     <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
                           <ChefHat className="w-6 h-6 text-gold" />
                        </div>
                        <h3 className="text-xl font-serif italic text-primary uppercase">Menu Strategy</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">Active Collection</p>
                           <div className="flex gap-3">
                              {['summer', 'autumn', 'ramadan'].map(s => (
                                <button
                                  key={s}
                                  onClick={() => saveSettings({ active_season: s as any, ramadan_mode: s === 'ramadan' })}
                                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${settings?.active_season === s ? 'border-primary bg-primary text-white shadow-xl' : 'border-primary/5 bg-white'}`}
                                >
                                  {s}
                                </button>
                              ))}
                           </div>
                        </div>
                        <div className="space-y-4">
                           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">Selection Deadline</p>
                           <input
                             type="datetime-local"
                             value={settings?.selection_deadline ? new Date(settings.selection_deadline).toISOString().slice(0, 16) : ''}
                             onChange={(e) => saveSettings({ selection_deadline: new Date(e.target.value).toISOString() })}
                             className="input-field py-3 text-sm font-bold bg-white"
                           />
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {tab === 'bookings' && (
                <div className="space-y-6">
                   <div className="relative mb-10">
                    <Search className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 text-primary ${isRtl ? 'right-8' : 'left-8'}`} />
                    <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field py-8 text-xl font-black italic bg-white shadow-2xl pl-20" />
                   </div>
                   <div className="grid grid-cols-1 gap-6">
                     {bookings.filter(b => b.client_name.toLowerCase().includes(search.toLowerCase())).map(b => (
                       <div key={b.id} className="glass-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:scale-[1.01] transition-transform">
                          <div className="flex items-center gap-6">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl italic shadow-xl ${
                               b.status === 'confirmed' ? 'bg-emerald-500' : b.status === 'cancelled' ? 'bg-red-500' : 'bg-gold'
                             }`}>{b.client_name[0]}</div>
                             <div>
                               <h4 className="text-xl font-black text-primary tracking-tighter uppercase italic">{b.client_name}</h4>
                               <div className="flex flex-wrap gap-3 mt-3">
                                 <span className="badge text-[10px] bg-gold/5 border-gold/10 text-gold">{b.package_name}</span>
                                 <span className="pill text-[10px] bg-primary/5 text-primary/70">{b.appointment_date} @ {b.appointment_time}</span>
                               </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="relative group/select">
                                <select value={b.status} onChange={(e) => updateBookingStatus(b.id, e.target.value)} className="appearance-none bg-white border-2 border-primary/5 rounded-[1.2rem] px-8 py-4 text-[10px] font-black uppercase outline-none cursor-pointer hover:border-gold/30 pr-12 text-primary">
                                   <option value="pending">PENDING</option>
                                   <option value="confirmed">CONFIRMED</option>
                                   <option value="completed">COMPLETED</option>
                                   <option value="cancelled">CANCELLED</option>
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold rotate-90 pointer-events-none" />
                             </div>
                             <a href={`https://wa.me/974${b.client_phone?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><MessageCircle className="w-6 h-6" /></a>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {tab === 'members' && (
                <div className="space-y-6">
                    <div className="relative mb-10">
                      <Search className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 text-muted ${isRtl ? 'right-8' : 'left-8'}`} />
                      <input type="text" placeholder="Search Members..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field py-8 text-xl font-black italic bg-white/40 pl-20" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {subscribers.filter(s => (s.full_name || '').toLowerCase().includes(search.toLowerCase())).map((s) => (
                        <div key={s.id} onClick={() => viewMemberDetails(s)} className="glass-card p-8 flex flex-col gap-8 group hover:scale-[1.02] transition-all cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-[1.8rem] bg-teal flex items-center justify-center text-white font-black text-2xl italic">{(s.full_name || '?')[0]}</div>
                              <div>
                                <h4 className="text-xl font-black text-primary tracking-tighter uppercase italic truncate">{s.full_name || 'Member'}</h4>
                                <p className="text-[10px] font-black text-gold uppercase mt-1">{s.package_name || 'Protocol Active'}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-primary/10 group-hover:text-teal group-hover:translate-x-1 transition-all" />
                          </div>
                          <div className="flex gap-4">
                            <div className="pill bg-background border-primary/5 text-muted text-[8px]">{s.area || 'DOHA'}</div>
                            <div className={`pill text-[8px] ${s.status === 'active' ? 'bg-teal/5 text-teal' : 'bg-red-50 text-red-500'}`}>{s.status.toUpperCase()}</div>
                            <div className="flex-1" />
                            <a onClick={(e) => e.stopPropagation()} href={`https://wa.me/974${(s.phone || '').replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><MessageCircle className="w-4 h-4" /></a>
                            <a onClick={(e) => e.stopPropagation()} href={`tel:+974${(s.phone || '').replace(/\D/g,'')}`} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all"><Phone className="w-4 h-4" /></a>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
              )}

              {tab === 'logistics' && (
                <div className="space-y-12">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <button onClick={handleExportPrepList} className="glass-card p-12 text-left group hover:bg-primary hover:text-white transition-all">
                         <Utensils className="w-12 h-12 text-gold mb-8" />
                         <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Export Kitchen Manifest</h3>
                         <p className="text-xs opacity-60 uppercase tracking-widest">Generate CSV for production facility.</p>
                      </button>
                      <div className="glass-card p-12 bg-primary text-white relative overflow-hidden group border-none">
                         <div className="absolute inset-0 bg-food-atmosphere opacity-10 grayscale pointer-events-none group-hover:scale-110 transition-transform duration-[10s]" />
                         <Truck className="w-12 h-12 text-gold mb-8 relative z-10" />
                         <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2 relative z-10">Fleet Intelligence</h3>
                         <button onClick={() => window.location.href = '/rider'} className="relative z-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-gold hover:text-white transition-all">Access Rider View <ChevronRight className="w-4 h-4" /></button>
                      </div>
                   </div>

                   {/* Active Fleet Profiles */}
                   <div className="space-y-8 pt-10 border-t border-primary/5">
                      <div className="flex items-center gap-4 mb-4">
                         <div className="w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-teal" />
                         </div>
                         <h3 className="text-xl font-serif italic text-primary uppercase">Approved Fleet</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {riders.map((r) => (
                           <div key={r.id} className="glass-card p-8 bg-white/40 border-primary/5 flex items-center justify-between group">
                              <div className="flex items-center gap-6">
                                 <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl italic">
                                    {r.full_name?.[0] || 'R'}
                                 </div>
                                 <div>
                                    <h4 className="text-lg font-black text-primary uppercase italic">{r.full_name || 'Rider'}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                       <div className={`w-2 h-2 rounded-full ${r.is_online ? 'bg-emerald-500 animate-glow' : 'bg-red-400'}`} />
                                       <p className="text-[10px] text-primary/40 font-bold uppercase">{r.is_online ? 'Signal Active' : 'Offline'}</p>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex gap-2">
                                 <a href={`tel:${r.phone}`} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all"><Phone className="w-4 h-4" /></a>
                                 <a href={`https://wa.me/974${(r.phone || '').replace(/\D/g,'')}`} className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><MessageCircle className="w-4 h-4" /></a>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   {pendingRiders.length > 0 && (
                     <div className="space-y-8 pt-10 border-t border-primary/5">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-12 h-12 rounded-2xl bg-gold/20 flex items-center justify-center">
                              <ShieldAlert className="w-6 h-6 text-gold" />
                           </div>
                           <h3 className="text-xl font-serif italic text-primary uppercase">Pending Approvals</h3>
                        </div>
                        <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.4em] ml-2 mb-8">Authorize new logistics units for Doha deployment.</p>
                        <div className="grid grid-cols-1 gap-6">
                           {pendingRiders.map((r) => (
                             <div key={r.id} className="glass-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-gold/10 bg-white/40">
                                <div className="flex items-center gap-6">
                                   <div className="w-14 h-14 rounded-2xl bg-gold/10 text-gold flex items-center justify-center font-black text-xl italic shadow-inner">
                                      {r.full_name?.[0] || 'R'}
                                   </div>
                                   <div>
                                      <h4 className="text-xl font-black text-primary uppercase italic tracking-tighter">{r.full_name || 'Anonymous Applicant'}</h4>
                                      <div className="flex items-center gap-3 mt-1.5">
                                         <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest">{r.phone || 'No phone provided'}</p>
                                         <span className="w-1 h-1 rounded-full bg-primary/10" />
                                         <p className="text-[10px] text-primary/30 font-bold uppercase tracking-widest">Signal: Pending</p>
                                      </div>
                                   </div>
                                </div>
                                <div className="flex items-center gap-4">
                                   <button
                                     onClick={() => approveRider(r.id)}
                                     className="btn-primary !bg-emerald-600 !py-4 !px-10 text-[9px] hover:!bg-emerald-700 shadow-2xl active:scale-95 transition-all"
                                   >
                                      APPROVE UNIT
                                   </button>
                                   <button className="p-4 rounded-2xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90">
                                      <X className="w-5 h-5" />
                                   </button>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Member Details Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMember(null)} className="absolute inset-0 bg-primary/60 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-background w-full max-w-4xl max-h-[90vh] rounded-[3.5rem] shadow-4xl overflow-hidden flex flex-col border border-white/20">
               <div className="flex items-center justify-between p-10 border-b border-primary/5 bg-white/40 backdrop-blur-md">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.8rem] bg-teal flex items-center justify-center text-white font-black text-2xl italic">{(selectedMember.full_name || '?')[0]}</div>
                    <h2 className="text-3xl font-black text-primary uppercase italic tracking-tighter">{selectedMember.full_name}</h2>
                  </div>
                  <button onClick={() => setSelectedMember(null)} className="text-muted hover:text-primary p-3 rounded-full hover:bg-white/50 transition-all"><X className="w-8 h-8" /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-10 space-y-12">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     <MetricCard icon={Scale} label="WEIGHT" value={`${selectedMember.weight_kg || '—'} kg`} />
                     <MetricCard icon={Ruler} label="HEIGHT" value={`${selectedMember.height_cm || '—'} cm`} />
                     <MetricCard icon={Target} label="GOAL" value={selectedMember.fitness_goal?.toUpperCase() || '—'} color="teal" />
                     <MetricCard icon={Activity} label="ACTIVITY" value={selectedMember.activity_level?.toUpperCase() || 'MODERATE'} color="gold" />
                  </div>
                  <section>
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary/30 mb-8 ml-1">Menu Selections</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {memberMenu.map((m, i) => (
                          <div key={i} className="p-6 bg-white/60 border border-primary/5 rounded-[2.5rem] flex items-start gap-4">
                             <div className="w-10 h-10 rounded-2xl bg-teal/5 flex items-center justify-center flex-shrink-0"><Star className="w-4 h-4 text-gold" /></div>
                             <div>
                                <p className="text-gold text-[9px] font-black uppercase mb-1">{m.day_of_week}</p>
                                <p className="text-sm font-black text-primary italic leading-tight">{m.dish_name}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                  </section>
               </div>
               <div className="p-8 border-t border-primary/10 bg-white/60 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="relative group/select w-full sm:w-auto">
                    <select onChange={(e) => assignRider(selectedMember.id, e.target.value)} className="appearance-none bg-white border-2 border-primary/5 rounded-[1.2rem] px-8 py-5 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer hover:border-gold/30 transition-all w-full sm:min-w-[240px] pr-12 text-primary">
                      <option value="">Override Rider</option>
                      {riders.map(r => (
                        <option key={r.id} value={r.id}>{r.full_name || r.user_id.slice(0,8)}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold rotate-90 pointer-events-none" />
                  </div>
                  <button onClick={() => setSelectedMember(null)} className="btn-primary w-full sm:w-auto px-12 py-5 uppercase tracking-[0.3em] text-[10px] whitespace-nowrap min-w-fit">Close Audit</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <button onClick={signOut} className="fixed bottom-6 right-6 sm:bottom-12 sm:right-12 btn-secondary bg-white shadow-4xl py-4 px-8 text-[10px] tracking-[0.3em] font-black z-[100] hover:text-red-600 transition-all">
        <LogOut className="w-4 h-4 mr-3 inline-block" /> TERMINATE SESSION
      </button>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, theme }: any) {
  return (
    <div className={`glass-card p-12 relative overflow-hidden transition-all duration-1000 hover:translate-y-[-10px] ${theme === 'teal' ? 'bg-primary text-[#F5F3EB] border-none shadow-4xl' : 'bg-white border-primary/5 shadow-3xl'}`}>
      {theme === 'teal' && <div className="absolute inset-0 bg-food-atmosphere opacity-5 grayscale pointer-events-none" />}
      <div className="flex justify-between items-start mb-10 relative z-10">
         <p className={`${theme === 'teal' ? 'text-gold' : 'text-primary/40'} text-[10px] font-black uppercase tracking-[0.5em]`}>{label}</p>
         <div className={`w-14 h-14 rounded-2xl ${theme === 'teal' ? 'bg-white/10 text-white' : 'bg-primary/5 text-primary'} flex items-center justify-center shadow-inner`}>
            <Icon className="w-6 h-6" />
         </div>
      </div>
      <h4 className="text-6xl font-black tracking-tighter relative z-10 italic uppercase leading-none">{value}</h4>
      <div className={`mt-10 pt-10 border-t ${theme === 'teal' ? 'border-white/10' : 'border-primary/10'} relative z-10`}>
         <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${theme === 'teal' ? 'bg-gold animate-pulse' : 'bg-emerald-500'}`} />
            <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${theme === 'teal' ? 'text-white/40' : 'text-primary/30'}`}>System Verified</span>
         </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="p-8 bg-white/40 border border-primary/5 rounded-[2.5rem] shadow-xl flex flex-col items-center text-center group hover:border-gold transition-all duration-700">
       <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center ${color === 'teal' ? 'bg-primary text-gold' : color === 'gold' ? 'bg-gold text-primary' : 'bg-primary/5 text-primary'}`}>
          <Icon className="w-6 h-6" />
       </div>
       <p className="text-[9px] font-black text-primary/30 uppercase tracking-[0.4em] mb-2">{label}</p>
       <p className="text-lg font-black text-primary italic uppercase tracking-tight">{value}</p>
    </div>
  );
}
