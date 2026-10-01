import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Phone, Mail, Target, Dumbbell, Sparkles,
  CheckCircle2, XCircle, Loader2, LogOut, ChevronRight, X,
  Search, Filter, ChefHat, Bell, TrendingUp, Users, Utensils,
  Truck, Activity, Heart, Weight, Footprints, Flame, Droplet,
  MapPin, Clock, ChevronLeft, ShieldAlert, MessageSquare,
  Moon, Sun, Coffee, Star, Download, UserCircle, Home as HomeIcon,
  Check, Plus, Pause, Play, Shield, AlertTriangle, FileText, Settings, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeHaptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import {
  type Subscriber, type GlobalSettings, type THKRegistration, type KitchenJob, type DeliveryJob, type AuditLog,
  MEAL_CATEGORIES, MEAL_SELECTION_PACKAGES
} from '@/types/subscription';
import { type Booking, type RiderApplication, type RiderDelivery } from '@/types/shared';
import { useLanguage } from '@/lib/LanguageContext';
import { getQatarDate, addDays } from '@/lib/date-utils';

interface ProviderDashboardProps {
  onExit: () => void;
}

type Tab = 'performance' | 'reviews' | 'members' | 'kitchen' | 'logistics' | 'audit';

export default function ProviderDashboard({ onExit }: ProviderDashboardProps) {
  const { signOut, userRole } = useAuth();
  const { t, isRtl, language } = useLanguage();

  // Role-based default tab & visible tabs
  const isKitchenStaff = userRole === 'kitchen';
  const isTransportStaff = userRole === 'transport';
  const isCeoOrAdmin = userRole === 'ceo' || userRole === 'admin' || userRole === 'owner' || !userRole;

  const [tab, setTab] = useState<Tab>(
    isKitchenStaff ? 'kitchen' : isTransportStaff ? 'logistics' : 'performance'
  );

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [registrations, setRegistrations] = useState<THKRegistration[]>([]);
  const [kitchenJobs, setKitchenJobs] = useState<KitchenJob[]>([]);
  const [deliveryJobs, setDeliveryJobs] = useState<DeliveryJob[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [riders, setRiders] = useState<RiderApplication[]>([]);
  const [riderDeliveries, setRiderDeliveries] = useState<RiderDelivery[]>([]);

  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(false);

  // Review & Edit Modal State
  const [selectedReg, setSelectedReg] = useState<THKRegistration | null>(null);
  const [reviewCategory, setReviewCategory] = useState<string>('A');
  const [reviewPackage, setReviewPackage] = useState<string>('3m1s');
  const [reviewPaymentStatus, setReviewPaymentStatus] = useState<string>('Paid');
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);

  const [prepDate, setPrepDate] = useState<'today' | 'tomorrow'>('today');

  const targetPrepDateStr = prepDate === 'tomorrow'
    ? getQatarDate(addDays(new Date(), 1))
    : getQatarDate(new Date());

  const fmtDate = (iso: string): string => {
    try {
      return new Date(iso + 'T00:00:00').toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US', {
        weekday: 'short', day: 'numeric', month: 'short',
      });
    } catch { return iso; }
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: books }, { data: subs }, { data: setts }, { data: regs }, { data: rdrs }, { data: kj }, { data: dj }, { data: logs }] = await Promise.all([
        supabase.from('provider_bookings_view').select('*').order('appointment_date', { ascending: true }),
        supabase.from('subscribers').select('*').order('created_at', { ascending: false }),
        supabase.from('global_settings').select('*').single(),
        supabase.from('registrations').select('*').order('created_at', { ascending: false }),
        supabase.from('rider_applications').select('*').order('approved', { ascending: true }),
        supabase.from('kitchen_jobs').select('*').eq('service_date', targetPrepDateStr),
        supabase.from('delivery_jobs').select('*').eq('service_date', targetPrepDateStr),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
      ]);

      setBookings(books || []);
      setSubscribers((subs as Subscriber[]) || []);
      setSettings(setts as GlobalSettings);
      setRegistrations((regs as THKRegistration[]) || []);
      setRiders((rdrs as RiderApplication[]) || []);
      setKitchenJobs((kj as KitchenJob[]) || []);
      setDeliveryJobs((dj as DeliveryJob[]) || []);
      setAuditLogs((logs as AuditLog[]) || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [targetPrepDateStr]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Quick Action: Approve Pending Registration with Category & Package Assignment
  const approveRegistration = async (reg: THKRegistration) => {
    setUpdating(true);
    try {
      // 1. Update Registration Status
      await supabase
        .from('registrations')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          reviewed_by: userRole || 'admin',
        })
        .eq('id', reg.id);

      // Registration approval is operational only. Subscription access is granted
      // after Tap confirms payment through the server-side webhook.

      // 4. Log Audit Event
      await supabase.from('audit_logs').insert({
        action: 'REGISTRATION_APPROVED',
        entity_type: 'registration',
        entity_id: reg.id,
        details_json: { name: reg.name, category: reviewCategory, package: reviewPackage, paymentStatus: 'pending Tap payment' },
      });

      setBulkNotice(`Approved ${reg.name}'s registration. Tap payment is still required to activate a plan.`);
      setTimeout(() => setBulkNotice(null), 4000);
      setSelectedReg(null);
      await fetchDashboardData();
    } catch (e: any) {
      setError(`Approval Error: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Bulk Approve All Registrations
  const bulkApprovePending = async () => {
    setUpdating(true);
    try {
      const pending = registrations.filter(r => r.status === 'pending');
      if (pending.length === 0) {
        setBulkNotice('No pending registrations to approve.');
        setTimeout(() => setBulkNotice(null), 3000);
        return;
      }

      for (const reg of pending) {
        await approveRegistration(reg);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  };

  // Bulk Assign Drivers by Area
  const bulkAssignDrivers = async () => {
    setUpdating(true);
    try {
      const approvedRiders = riders.filter(r => r.approved);
      if (approvedRiders.length === 0) {
        setBulkNotice('Please approve at least 1 driver before bulk assigning.');
        setTimeout(() => setBulkNotice(null), 3000);
        return;
      }

      const activeSubs = subscribers.filter(s => s.status === 'active');
      let count = 0;

      for (let i = 0; i < activeSubs.length; i++) {
        const sub = activeSubs[i];
        const assignedRider = approvedRiders[i % approvedRiders.length];

        await supabase.from('rider_deliveries').upsert({
          rider_application_id: assignedRider.id,
          rider_user_id: assignedRider.user_id,
          subscriber_id: sub.id,
          delivery_date: targetPrepDateStr,
          meal_type: 'all',
          time_window: 'One daily delivery',
          notes: sub.delivery_notes || null,
          status: 'pending',
        }, { onConflict: 'subscriber_id,delivery_date' });

        count++;
      }

      setBulkNotice(`Assigned ${count} delivery stops across ${approvedRiders.length} drivers for ${targetPrepDateStr}!`);
      setTimeout(() => setBulkNotice(null), 4000);
      await fetchDashboardData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await safeHaptics.impact();
    await signOut();
    onExit();
  };

  const exportKitchenPrepCSV = () => {
    const activeSubs = subscribers.filter(s => s.status === 'active' || s.status === 'trialing');
    const headers = ['Name', 'Email', 'Phone', 'Category', 'Package', 'Area', 'Building', 'Street', 'Breakfast Window', 'Lunch Window', 'Dinner Window', 'Allergies', 'Dislikes'];
    const rows = activeSubs.map(s => [
      `"${s.full_name || ''}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.category || 'A'}"`,
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
    link.download = `KITCHEN_PREP_${targetPrepDateStr}.csv`;
    link.click();
  };

  const pendingRegs = registrations.filter(r => r.status === 'pending');
  const activeSubs = subscribers.filter(s => s.status === 'active');
  const estRevenue = activeSubs.length * 2000;

  // Role Badge Label
  const roleLabel = userRole === 'ceo'
    ? 'CEO Command Console'
    : userRole === 'admin'
    ? 'Admin Control Panel'
    : userRole === 'kitchen'
    ? 'Kitchen Operations Console'
    : userRole === 'transport'
    ? 'Transportation Manager'
    : 'Operations Portal';

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
              <p className="text-[#0a3030] font-black text-sm uppercase tracking-wider italic leading-none">{roleLabel}</p>
              <p className="text-[#C5A059] text-[8px] font-black mt-1.5 uppercase tracking-[0.2em]">Triangle Healthy Kitchen</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {isCeoOrAdmin && (
              <button
                onClick={() => setTab('reviews')}
                className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0a3030] text-white font-black text-[10px] uppercase tracking-wider hover:bg-[#C5A059] transition-all shadow-sm"
              >
                <Users className="w-4 h-4 text-[#C5A059]" />
                <span className="hidden sm:inline">Reviews ({pendingRegs.length})</span>
                {pendingRegs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
                )}
              </button>
            )}

            <button
              onClick={exportKitchenPrepCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#0a3030] font-black text-[10px] uppercase tracking-wider hover:bg-[#0a3030] hover:text-white transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-[#C5A059]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button onClick={handleSignOut} className="p-2 text-primary/30 hover:text-red-500 transition-all" title="Sign Out">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Operational Banner */}
      {bulkNotice && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="bg-[#0a3030] text-[#C5A059] border border-[#C5A059]/20 rounded-2xl p-4 text-xs font-black uppercase tracking-wider flex items-center gap-3 animate-in shadow-xl">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <span>{bulkNotice}</span>
          </div>
        </div>
      )}

      {/* Dynamic Role Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-8 overflow-hidden">
        <div className="flex bg-white/60 backdrop-blur-3xl rounded-[2.2rem] p-1.5 border border-primary/5 shadow-xl overflow-x-auto no-scrollbar">
          {([
            ...(isCeoOrAdmin ? [{ id: 'performance', label: 'Performance', icon: <TrendingUp className="w-4 h-4" /> }] : []),
            ...(isCeoOrAdmin ? [{ id: 'reviews', label: `Reviews (${pendingRegs.length})`, icon: <FileText className="w-4 h-4" /> }] : []),
            ...(isCeoOrAdmin || isKitchenStaff ? [{ id: 'kitchen', label: 'Kitchen Prep', icon: <ChefHat className="w-4 h-4" /> }] : []),
            { id: 'members', label: 'Subscribers', icon: <Users className="w-4 h-4" /> },
            ...(isCeoOrAdmin || isTransportStaff ? [{ id: 'logistics', label: 'Deliveries & Drivers', icon: <Truck className="w-4 h-4" /> }] : []),
            ...(isCeoOrAdmin ? [{ id: 'audit', label: 'Audit Logs', icon: <Shield className="w-4 h-4" /> }] : []),
          ] as const).map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as Tab)}
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
                  layoutId="activeRoleTab"
                  className="absolute inset-0 bg-[#0a3030] rounded-[1.7rem] shadow-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Action Control Bar for CEO / Admin */}
        {isCeoOrAdmin && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-[#0a3030] font-black text-sm uppercase italic">Quick Operational Controls</h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-1">Bulk customer review approvals & fleet dispatching</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={bulkApprovePending}
                disabled={updating}
                className="px-5 py-3 rounded-2xl bg-[#0a3030] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#C5A059] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />}
                Approve All Pending ({pendingRegs.length})
              </button>
              <button
                onClick={bulkAssignDrivers}
                disabled={updating}
                className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-[#0a3030] text-[10px] font-black uppercase tracking-widest hover:bg-[#0a3030] hover:text-white transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Truck className="w-4 h-4 text-[#C5A059]" />
                Bulk Assign Drivers
              </button>
            </div>
          </div>
        )}

        {/* 1. PERFORMANCE TAB */}
        {tab === 'performance' && isCeoOrAdmin && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-gray-400 text-[9px] font-black tracking-widest uppercase">ACTIVE SUBSCRIBERS</p>
                <p className="text-3xl font-black text-[#0a3030] mt-2">{activeSubs.length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-gray-400 text-[9px] font-black tracking-widest uppercase">EST. MONTHLY REVENUE</p>
                <p className="text-3xl font-black text-emerald-600 mt-2">{estRevenue.toLocaleString()} QAR</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-gray-400 text-[9px] font-black tracking-widest uppercase">PENDING REVIEWS</p>
                <p className="text-3xl font-black text-[#C5A059] mt-2">{pendingRegs.length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-gray-400 text-[9px] font-black tracking-widest uppercase">APPROVED DRIVERS</p>
                <p className="text-3xl font-black text-sky-600 mt-2">{riders.filter(r => r.approved).length}</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. CUSTOMER APPLICATION REVIEWS TAB */}
        {tab === 'reviews' && isCeoOrAdmin && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[#0a3030] text-lg font-black uppercase italic">Customer Application Reviews</h3>
                <p className="text-gray-400 text-xs font-medium">Review health info, assign Category (A-F), verify payments, and activate plans.</p>
              </div>
              <span className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-xs font-black uppercase">
                {pendingRegs.length} Applications Waiting
              </span>
            </div>

            {pendingRegs.length === 0 ? (
              <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-40" />
                <p className="text-gray-400 text-sm font-bold">All pending customer applications have been reviewed!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingRegs.map((reg) => (
                  <div key={reg.id} className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex flex-wrap items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-black text-[#0a3030] text-lg">{reg.name}</span>
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800">Pending Review</span>
                      </div>
                      <p className="text-gray-400 text-xs">{reg.phone || reg.email || 'No contact specified'}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setSelectedReg(reg); setReviewCategory('A'); setReviewPackage('3m1s'); setReviewPaymentStatus('Paid'); }}
                        className="px-5 py-3 rounded-2xl bg-[#0a3030] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#C5A059] transition-all shadow-md"
                      >
                        Review & Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. KITCHEN PREP QUEUE & PACKING LIST TAB */}
        {tab === 'kitchen' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-6">
              <div>
                <h3 className="text-[#0a3030] text-xl font-black uppercase italic">Daily Kitchen Prep Queue</h3>
                <p className="text-gray-400 text-xs font-bold mt-1">Service Date: <span className="text-[#C5A059] font-black">{targetPrepDateStr}</span></p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                  <button
                    onClick={() => setPrepDate('today')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${prepDate === 'today' ? 'bg-[#0a3030] text-white' : 'text-gray-400'}`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setPrepDate('tomorrow')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${prepDate === 'tomorrow' ? 'bg-[#0a3030] text-white' : 'text-gray-400'}`}
                  >
                    Tomorrow
                  </button>
                </div>

                <button
                  onClick={exportKitchenPrepCSV}
                  className="px-5 py-3 rounded-2xl bg-[#0a3030] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#C5A059] transition-all flex items-center gap-2 shadow-md"
                >
                  <Download className="w-4 h-4 text-[#C5A059]" />
                  Download Prep CSV
                </button>
              </div>
            </div>

            {/* Kitchen Packing Table */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm overflow-x-auto">
              <h4 className="text-[#0a3030] text-base font-black uppercase italic mb-6">Packing & Portions Sheet ({activeSubs.length} Active Clients)</h4>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    <th className="py-4 px-4">Customer Name</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">Package</th>
                    <th className="py-4 px-4">Area & Building</th>
                    <th className="py-4 px-4">Allergies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-bold text-[#0a3030]">
                  {activeSubs.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="py-4 px-4 font-black">{s.full_name}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-[9px] font-black bg-[#C5A059]/10 text-[#0a3030]">Category {s.category || 'A'}</span>
                      </td>
                      <td className="py-4 px-4">{s.package_name}</td>
                      <td className="py-4 px-4">{s.area || 'Doha'} (Bldg {s.building_number || '-'})</td>
                      <td className="py-4 px-4 text-red-600 font-black">
                        {(s.allergies && s.allergies.length > 0) ? s.allergies.join(', ') : 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. SUBSCRIBERS TAB */}
        {tab === 'members' && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-[#0a3030] text-lg font-black uppercase italic mb-6">Subscribers Ledger ({subscribers.length})</h3>
            <div className="space-y-4">
              {subscribers.map((sub) => (
                <div key={sub.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-[#0a3030] font-black text-sm">{sub.full_name || 'Subscriber'}</h4>
                    <p className="text-gray-400 text-xs">{sub.phone || sub.email} — {sub.package_name || 'Standard Plan'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#C5A059]/10 text-[#0a3030]">
                      Category {sub.category || 'A'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                      {sub.remaining_days || 26} Days Left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. LOGISTICS TAB */}
        {tab === 'logistics' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-[#0a3030] text-xl font-black uppercase italic">Fleet Dispatch & Driver Routing</h3>
                <p className="text-gray-400 text-xs font-bold mt-1">Assign drivers to active client stops by Qatar Zone</p>
              </div>

              <button
                onClick={bulkAssignDrivers}
                disabled={updating}
                className="px-5 py-3 rounded-2xl bg-[#0a3030] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#C5A059] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                <Truck className="w-4 h-4 text-[#C5A059]" />
                Auto-Assign Drivers
              </button>
            </div>
          </div>
        )}

        {/* 6. AUDIT LOGS TAB */}
        {tab === 'audit' && isCeoOrAdmin && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-[#0a3030] text-lg font-black uppercase italic mb-6">Security Audit Logs</h3>
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <p className="text-gray-400 text-xs italic">No security events logged yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-[#0a3030]">{log.action}</span>
                      <span className="text-gray-400 ml-2">({log.entity_type})</span>
                    </div>
                    <span className="text-gray-400 font-mono text-[10px]">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Customer Review & Category Approval Modal */}
      {selectedReg && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">Customer Application Review</span>
                <h3 className="text-[#0a3030] font-black text-2xl uppercase italic">{selectedReg.name}</h3>
              </div>
              <button onClick={() => setSelectedReg(null)} className="p-2 text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-5 rounded-2xl space-y-2 text-xs font-bold text-[#0a3030]">
                <p>Phone: {selectedReg.phone || 'Not provided'}</p>
                <p>Email: {selectedReg.email || 'Not provided'}</p>
                <p>Submitted: {new Date(selectedReg.created_at).toLocaleDateString()}</p>
              </div>

              {/* Kitchen Category Selection */}
              <div className="space-y-2">
                <label className="text-[#0a3030] text-[10px] font-black uppercase tracking-widest">
                  Assign Kitchen Category (Cooked Portions)
                </label>
                <select
                  value={reviewCategory}
                  onChange={(e) => setReviewCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs font-black text-[#0a3030] outline-none"
                >
                  {MEAL_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>
                      Category {c.id} ({c.proteinGrams}g Protein / {c.carbsGrams}g Carbs)
                    </option>
                  ))}
                </select>
              </div>

              {/* Meal Package Selection */}
              <div className="space-y-2">
                <label className="text-[#0a3030] text-[10px] font-black uppercase tracking-widest">
                  Assign Meal Package Protocol
                </label>
                <select
                  value={reviewPackage}
                  onChange={(e) => setReviewPackage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs font-black text-[#0a3030] outline-none"
                >
                  {MEAL_SELECTION_PACKAGES.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.label} {p.price ? `(${p.price} QAR)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Verification Status */}
              <div className="space-y-2">
                <label className="text-[#0a3030] text-[10px] font-black uppercase tracking-widest">
                  Payment Status Verification
                </label>
                <select
                  value={reviewPaymentStatus}
                  onChange={(e) => setReviewPaymentStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs font-black text-[#0a3030] outline-none"
                >
                  <option value="Paid">Paid (Verified)</option>
                  <option value="Awaiting Payment">Awaiting Payment</option>
                  <option value="Cash Pending">Cash Pending</option>
                  <option value="Waiting Admin Approval">Waiting Admin Approval</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => approveRegistration(selectedReg)}
                  disabled={updating}
                  className="flex-1 bg-[#0a3030] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#C5A059] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />}
                  Approve Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
