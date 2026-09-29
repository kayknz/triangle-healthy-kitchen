import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertCircle, Bell, CalendarDays, Check, ChefHat, ClipboardList,
  CreditCard, Download, FileText, LayoutDashboard, Loader2, MapPin, Package,
  Search, Settings, ShieldCheck, Truck, Users, Utensils, X, Upload, Trash2
} from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../lib/auth';
import { getQatarDate } from '../lib/date-utils';
import { useLanguage } from '../lib/LanguageContext';
import type { ParsedMenuEntry } from '../lib/monthly-menu-pdf';

type Module = 'overview' | 'customers' | 'subscriptions' | 'menu' | 'kitchen' | 'packing' | 'delivery' | 'drivers' | 'payments' | 'reminders' | 'reports' | 'bookings' | 'team' | 'settings';
type Row = Record<string, any>;
const MENU_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'] as const;
const MENU_MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;

const MODULES: { id: Module; label: string; icon: React.ElementType; roles: string[] }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, roles: ['ceo', 'admin', 'kitchen', 'transport'] },
  { id: 'customers', label: 'Customers', icon: Users, roles: ['ceo', 'admin'] },
  { id: 'subscriptions', label: 'Subscriptions', icon: Package, roles: ['ceo', 'admin'] },
  { id: 'menu', label: 'Meal Plans', icon: Utensils, roles: ['ceo', 'admin', 'kitchen'] },
  { id: 'kitchen', label: 'Kitchen', icon: ChefHat, roles: ['ceo', 'admin', 'kitchen'] },
  { id: 'packing', label: 'Packing', icon: ClipboardList, roles: ['ceo', 'admin', 'kitchen'] },
  { id: 'delivery', label: 'Delivery', icon: MapPin, roles: ['ceo', 'admin', 'transport'] },
  { id: 'drivers', label: 'Drivers', icon: Truck, roles: ['ceo', 'admin', 'transport'] },
  { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['ceo', 'admin'] },
  { id: 'reminders', label: 'Reminders', icon: Bell, roles: ['ceo', 'admin'] },
  { id: 'reports', label: 'Reports', icon: FileText, roles: ['ceo', 'admin'] },
  { id: 'bookings', label: 'Consultations', icon: CalendarDays, roles: ['ceo', 'admin'] },
  { id: 'team', label: 'Team', icon: ShieldCheck, roles: ['ceo', 'admin'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['ceo', 'admin'] },
];

const money = (value: number, currency = 'QAR') => `${Number(value || 0).toLocaleString()} ${currency}`;
const addressOf = (s: Row) => [s.building_number, s.street, s.area].filter(Boolean).join(', ') || 'Address missing';
const normalizedMeal = (meal: string) => meal === 'snack' ? 'snacks' : meal;
const statusTone = (status: string) => /active|paid|captured|delivered|approved|completed/i.test(status) ? 'bg-emerald-50 text-emerald-700' : /failed|cancel|expired|reject/i.test(status) ? 'bg-red-50 text-red-700' : /pending|initiated|trial|paused/i.test(status) ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600';

export default function OperationsWorkspace() {
  const { staffRole, isOwner, signOut } = useAuth();
  const { isRtl } = useLanguage();
  const assignedRole = staffRole || (isOwner ? 'ceo' : null);
  const requestedSector = assignedRole === 'ceo' ? localStorage.getItem('thk_ops_sector') : null;
  const role = requestedSector && ['ceo', 'admin', 'kitchen', 'transport'].includes(requestedSector) ? requestedSector : assignedRole;
  const leader = role === 'ceo' || role === 'admin';
  const visibleModules = useMemo(() => MODULES.filter((item) => role && item.roles.includes(role)), [role]);
  const [module, setModule] = useState<Module>(leader ? 'overview' : role === 'transport' ? 'delivery' : 'kitchen');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [subscribers, setSubscribers] = useState<Row[]>([]);
  const [selections, setSelections] = useState<Row[]>([]);
  const [riders, setRiders] = useState<Row[]>([]);
  const [deliveries, setDeliveries] = useState<Row[]>([]);
  const [packages, setPackages] = useState<Row[]>([]);
  const [dishes, setDishes] = useState<Row[]>([]);
  const [availability, setAvailability] = useState<Row[]>([]);
  const [payments, setPayments] = useState<Row[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<Row[]>([]);
  const [bookings, setBookings] = useState<Row[]>([]);
  const [notifications, setNotifications] = useState<Row[]>([]);
  const [pauseRequests, setPauseRequests] = useState<Row[]>([]);
  const [settings, setSettings] = useState<Row | null>(null);
  const [search, setSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState('All');
  const [customerCategoryFilter, setCustomerCategoryFilter] = useState('All');
  const [customerZoneFilter, setCustomerZoneFilter] = useState('All');
  const [date, setDate] = useState(getQatarDate());
  const [selected, setSelected] = useState<Row | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Row | null>(null);
  const [selectedDish, setSelectedDish] = useState<Row | null>(null);
  const [selectedRecipeDish, setSelectedRecipeDish] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const fetchRows = useCallback(async (table: string, query: (q: any) => any) => {
    const result = await query(supabase.from(table).select('*'));
    if (result.error) throw result.error;
    return result.data || [];
  }, []);

  const refresh = useCallback(async (silent = false) => {
    if (!role) return;
    silent ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const subTable = leader ? 'subscribers' : role === 'transport' ? 'transport_subscribers_view' : 'kitchen_subscribers_view';
      const requests: Promise<any>[] = [
        fetchRows(subTable, (q) => leader ? q.order('created_at', { ascending: false }) : q),
        leader || role === 'kitchen'
          ? fetchRows(role === 'kitchen' ? 'kitchen_production_view' : 'weekly_menu_selections', (q) => q.order('week_start_date', { ascending: false }).limit(5000))
          : Promise.resolve([]),
        role === 'kitchen' ? Promise.resolve([]) : fetchRows('rider_applications', (q) => q.eq('approved', true).order('full_name')),
        role === 'kitchen' ? Promise.resolve([]) : fetchRows('rider_deliveries', (q) => q.eq('delivery_date', date).order('assigned_at')),
        fetchRows('packages', (q) => q.order('sort_order')),
        fetchRows('dishes', (q) => q.order('name')),
        fetchRows('menu_availability', (q) => q.order('week_number').order('day_of_week')),
      ];
      if (leader) requests.push(
        fetchRows('payment_transactions', (q) => q.order('created_at', { ascending: false }).limit(500)),
        fetchRows('payment_logs', (q) => q.order('created_at', { ascending: false }).limit(500)),
        fetchRows('provider_bookings_view', (q) => q.order('appointment_date')),
        fetchRows('notifications', (q) => q.order('created_at', { ascending: false }).limit(200)),
        fetchRows('subscription_pause_requests', (q) => q.eq('status', 'pending').order('created_at')),
        fetchRows('global_settings', (q) => q.limit(1).maybeSingle()).then((rows) => Array.isArray(rows) ? rows[0] : rows),
      );
      else if (role === 'kitchen') requests.push(
        fetchRows('global_settings', (q) => q.limit(1).maybeSingle()).then((rows) => Array.isArray(rows) ? rows[0] : rows),
      );
      const values = await Promise.all(requests);
      setSubscribers(values[0] as Row[]);
      setSelections(values[1] as Row[]);
      setRiders(values[2] as Row[]);
      setDeliveries(values[3] as Row[]);
      setPackages(values[4] as Row[]);
      setDishes(values[5] as Row[]);
      setAvailability(values[6] as Row[]);
      if (leader) {
        setPayments(values[7] as Row[]); setPaymentLogs(values[8] as Row[]); setBookings(values[9] as Row[]);
        setNotifications(values[10] as Row[]); setPauseRequests(values[11] as Row[]); setSettings((values[12] as Row) || null);
      } else if (role === 'kitchen') { setBookings([]); setSettings((values[7] as Row) || null); }
    } catch (e: any) {
      setError(e?.message || 'Unable to load operations data.');
    } finally { setLoading(false); setRefreshing(false); }
  }, [role, leader, date, fetchRows]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(true), 60_000);
    return () => window.clearInterval(interval);
  }, [refresh]);
  useEffect(() => { if (!visibleModules.some((item) => item.id === module)) setModule(visibleModules[0]?.id || 'overview'); }, [visibleModules, module]);

  const activeSubscribers = subscribers.filter((s) => String(s.status || '').toLowerCase() === 'active');
  const serviceWeekStart = (value: string) => { const d = new Date(`${value}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7 || 7)); return d.toISOString().slice(0, 10); };
  const weekStart = serviceWeekStart(date);
  const zoneCounts = useMemo(() => {
    const counts = new Map<string, number>();
    activeSubscribers.forEach((s) => { const zone = String(s.zone_number || 'Needs zone'); counts.set(zone, (counts.get(zone) || 0) + 1); });
    return [...counts.entries()].sort(([a], [b]) => a === 'Needs zone' ? 1 : b === 'Needs zone' ? -1 : Number(a) - Number(b));
  }, [activeSubscribers]);
  const visibleSubscribers = subscribers.filter((s) =>
    [s.full_name, s.phone, s.email, s.area, s.zone_number, s.package_name].join(' ').toLowerCase().includes(search.toLowerCase()) &&
    (customerStatusFilter === 'All' || s.status === customerStatusFilter) &&
    (customerCategoryFilter === 'All' || (s.nutrition_category || 'Needs review') === customerCategoryFilter) &&
    (customerZoneFilter === 'All' || (s.zone_number || 'Needs zone') === customerZoneFilter)
  );
  const currentSelections = selections.filter((s) => !s.week_start_date || s.week_start_date === weekStart);
  const pendingPayments = payments.filter((p) => ['initiated', 'pending', 'failed'].includes(String(p.status).toLowerCase()));
  const activeMenuAvailability = availability.filter((row) => !settings?.active_season || row.collection === settings.active_season);
  const managerAlerts = useMemo(() => [
    { label: 'Consultations waiting for review', count: bookings.filter((booking) => booking.status === 'pending').length, module: 'bookings' as Module },
    { label: 'Payments needing attention', count: pendingPayments.length, module: 'payments' as Module },
    { label: 'Pause or resume requests', count: pauseRequests.length, module: 'customers' as Module },
    { label: 'Active customers missing a zone', count: activeSubscribers.filter((subscriber) => !subscriber.zone_number).length, module: 'customers' as Module },
    { label: 'Failed email deliveries', count: notifications.filter((notification) => /failed|error/i.test(String(notification.status))).length, module: 'reminders' as Module },
  ].filter((alert) => alert.count > 0), [bookings, pendingPayments.length, pauseRequests.length, activeSubscribers, notifications]);
  const managerAlertCount = managerAlerts.reduce((total, alert) => total + alert.count, 0);

  const assignRider = async (subscriberId: string, riderApplicationId: string, mealType: string) => {
    if (!riderApplicationId) return;
    setSaving(true); setError('');
    try {
      const { error: rpcError } = await supabase.rpc('assign_rider_delivery', {
        p_subscriber_id: subscriberId, p_rider_application_id: riderApplicationId,
        p_delivery_date: date, p_meal_type: normalizedMeal(mealType),
      });
      if (rpcError) throw rpcError;
      setSuccess('Rider assigned to this delivery.'); await refresh(true);
    } catch (e: any) { setError(e.message || 'Could not assign rider.'); }
    finally { setSaving(false); }
  };

  const updateDeliveryStatus = async (id: string, status: string) => {
    setSaving(true); setError('');
    try {
      const { error: updateError } = await supabase.from('rider_deliveries').update({ status }).eq('id', id);
      if (updateError) throw updateError;
      await refresh(true);
    } catch (e: any) { setError(e.message || 'Could not update delivery.'); }
    finally { setSaving(false); }
  };

  const saveCustomer = async (customer: Row) => {
    setSaving(true); setError('');
    try {
      const editable = ['full_name','phone','area','zone_number','nutrition_category','building_number','street','delivery_notes','latitude','longitude','breakfast_window','lunch_window','dinner_window','allergies','dislikes'];
      const patch = Object.fromEntries(editable.filter((key) => customer[key] !== undefined).map((key) => [key, customer[key]]));
      const { error: updateError } = await supabase.from('subscribers').update(patch).eq('id', customer.id);
      if (updateError) throw updateError;
      setSelected(null); setSuccess('Customer details saved.'); await refresh(true);
    } catch (e: any) { setError(e.message || 'Could not save customer details.'); }
    finally { setSaving(false); }
  };

  const updateBooking = async (booking: Row, status: string) => {
    setSaving(true); setError('');
    try {
      const { error: updateError } = await supabase.from('bookings').update({ status }).eq('id', booking.id);
      if (updateError) throw updateError;
      if (status === 'cancelled') {
        const { error: emailError } = await supabase.functions.invoke('send-booking-notification', { body: { type: 'cancellation', client_name: booking.client_name, client_email: booking.client_email, appointment_date: booking.appointment_date, appointment_time: booking.appointment_time, package_name: booking.package_name } });
        if (emailError) setError(`Booking updated; cancellation email failed: ${emailError.message}`);
      }
      await refresh(true);
    } catch (e: any) { setError(e.message || 'Could not update booking.'); }
    finally { setSaving(false); }
  };

  const reviewPauseRequest = async (requestId: string, decision: 'approved' | 'declined') => {
    setSaving(true); setError('');
    try {
      const { error: rpcError } = await supabase.rpc('review_subscription_pause_request', { p_request_id: requestId, p_decision: decision });
      if (rpcError) throw rpcError;
      setSuccess(`Pause request ${decision}.`); await refresh(true);
    } catch (e: any) { setError(e.message || 'Could not review pause request.'); }
    finally { setSaving(false); }
  };

  const saveGlobalSettings = async (patch: Row) => {
    if (!settings?.id) return;
    setSaving(true); setError('');
    try { const { error: updateError } = await supabase.from('global_settings').update(patch).eq('id', settings.id); if (updateError) throw updateError; setSettings({ ...settings, ...patch }); setSuccess('Settings saved.'); }
    catch (e: any) { setError(e.message || 'Could not save settings.'); }
    finally { setSaving(false); }
  };

  const savePackage = async (item: Row) => {
    setSaving(true); setError('');
    try {
      const patch = { name: item.name, kcals: Number(item.kcals), price: Number(item.price), currency: item.currency, meals: item.meals, duration: item.duration, description: item.description, highlight: item.highlight, active: !!item.active, sort_order: Number(item.sort_order || 0) };
      const { error: updateError } = await supabase.from('packages').update(patch).eq('id', item.id);
      if (updateError) throw updateError;
      setSelectedPackage(null); setSuccess('Subscription package updated.'); await refresh(true);
    } catch (e: any) { setError(e.message || 'Could not save package.'); }
    finally { setSaving(false); }
  };

  const saveDish = async (item: Row) => {
    setSaving(true); setError('');
    try {
      const patch = { name: item.name, kcals: Number(item.kcals), macros: { protein: Number(item.protein || 0), carbs: Number(item.carbs || 0), fats: Number(item.fats || 0) }, allergens: item.allergens };
      const { error: updateError } = await supabase.from('dishes').update(patch).eq('id', item.id);
      if (updateError) throw updateError;
      setSelectedDish(null); setSuccess('Dish and nutrition details saved.'); await refresh(true);
    } catch (e: any) { setError(e.message || 'Could not save dish.'); }
    finally { setSaving(false); }
  };

  const downloadCsv = (name: string, headers: string[], rows: any[][]) => {
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${name}-${date}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  const setMenuAvailability = async (row: Row, active: boolean) => {
    setSaving(true); setError('');
    try { const { error: updateError } = await supabase.from('menu_availability').update({ is_active: active }).eq('id', row.id); if (updateError) throw updateError; await refresh(true); }
    catch (e: any) { setError(e.message || 'Could not update menu availability.'); }
    finally { setSaving(false); }
  };

  if (!role) return <div className="min-h-screen flex items-center justify-center p-6"><section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><h1 className="text-xl font-bold">Operations access required</h1><p className="mt-2 text-sm text-slate-600">Your account does not have a web operations role.</p></section></div>;

  const sectionTitle = MODULES.find((item) => item.id === module)?.label || 'Operations';
  const qatarDay = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Qatar' }).format(new Date(`${date}T12:00:00`));
  const productionRows = qatarDay === 'Friday' ? currentSelections : currentSelections.filter((s) => s.day_of_week === qatarDay);

  return (
    <div className="ops-dashboard min-h-screen bg-slate-50 pt-24 text-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-[1600px] px-4 pb-12 sm:px-6 lg:px-8">
        <header className="relative mb-6 flex flex-col gap-4 rounded-2xl bg-[#0F5D4E] p-5 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Triangle Healthy Kitchen · Operations</p><h1 className="ops-page-title mt-1 text-2xl font-bold">{sectionTitle}</h1><p className="mt-1 text-sm text-white/75">{role === 'ceo' ? 'CEO' : role[0].toUpperCase() + role.slice(1)} workspace</p></div>
          <div className="flex items-center gap-2">
            {leader && <div className="relative">
              <button type="button" onClick={() => setNotificationsOpen((open) => !open)} aria-label={`Notifications${managerAlertCount ? `, ${managerAlertCount} items need attention` : ''}`} aria-expanded={notificationsOpen} className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/10 hover:bg-white/20">
                <Bell size={18}/>{managerAlertCount > 0 && <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">{managerAlertCount > 99 ? '99+' : managerAlertCount}</span>}
              </button>
              {notificationsOpen && <section role="dialog" aria-label="Actionable notifications" className="absolute end-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-bold">Action needed</h2><span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">{managerAlertCount}</span></div>
                {managerAlerts.length ? <ul className="space-y-1">{managerAlerts.map((alert) => <li key={alert.label}><button type="button" onClick={() => { setModule(alert.module); setNotificationsOpen(false); }} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-start text-sm hover:bg-slate-50"><span>{alert.label}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{alert.count}</span></button></li>)}</ul> : <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">No outstanding items.</p>}
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">Counts update when dashboard data refreshes.</p>
              </section>}
            </div>}
            <button onClick={() => refresh(true)} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20" disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh data'}</button><button onClick={signOut} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0F5D4E] hover:bg-white/90">Sign out</button>
          </div>
        </header>

        {role === 'driver' ? <section className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm"><Truck size={36} className="mx-auto text-[#0F5D4E]"/><h2 className="mt-4 text-xl font-bold">Rider workspace</h2><p className="mt-2 text-sm text-slate-600">Riders accept routes and update delivery status in the THK mobile app. Sign in there with the rider’s assigned account.</p></section> : <>

        <nav aria-label="Operations sections" className="sticky top-20 z-30 mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {visibleModules.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setModule(id); setSearch(''); }} aria-current={module === id ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${module === id ? 'bg-[#0F5D4E] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#0F5D4E]'}`}><Icon size={16} />{label}</button>)}
        </nav>

        {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={18} className="mt-0.5 shrink-0" /><p>{error}</p><button className="ms-auto" onClick={() => setError('')} aria-label="Dismiss error"><X size={16} /></button></div>}
        {success && <div role="status" className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><Check size={18} />{success}<button className="ms-auto" onClick={() => setSuccess('')} aria-label="Dismiss message"><X size={16} /></button></div>}
        {loading ? <div className="flex justify-center py-24"><Loader2 className="h-9 w-9 animate-spin text-[#0F5D4E]" /></div> : (
          <>
            {module === 'overview' && <Overview role={role} leader={leader} subscribers={subscribers} selections={currentSelections} bookings={bookings} payments={payments} zones={zoneCounts} setModule={setModule} notifications={notifications} packages={packages} />}
            {module === 'customers' && <section className="space-y-4"><PageTools search={search} setSearch={setSearch} placeholder="Search name, phone, email, area or zone" action={<button className="ops-button flex items-center gap-2" onClick={() => downloadCsv('customers',['Name','Phone','Email','Status','Package','Category','Zone','Area','Delivery address'],visibleSubscribers.map((s) => [s.full_name,s.phone,s.email,s.status,s.package_name,s.nutrition_category,s.zone_number,s.area,addressOf(s)]))}><Download size={16}/>Export customers</button>} /><div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4"><select className="ops-control" value={customerStatusFilter} onChange={(e) => setCustomerStatusFilter(e.target.value)}><option>All</option>{['active','paused','trialing','cancelled'].map((s) => <option key={s}>{s}</option>)}</select><select className="ops-control" value={customerCategoryFilter} onChange={(e) => setCustomerCategoryFilter(e.target.value)}><option>All</option>{['A','B','C','D','E','F','Needs review'].map((s) => <option key={s}>{s}</option>)}</select><select className="ops-control" value={customerZoneFilter} onChange={(e) => setCustomerZoneFilter(e.target.value)}><option>All</option>{[...new Set(subscribers.map((s) => s.zone_number || 'Needs zone'))].sort().map((s) => <option key={s}>{s}</option>)}</select></div><PauseRequestsSection requests={pauseRequests} subscribers={subscribers} saving={saving} review={reviewPauseRequest}/><DataTable headers={['Customer','Contact','Plan','Status','Category','Zone','Area','Action']} rows={visibleSubscribers.map((s) => [<strong>{s.full_name || 'Customer'}</strong>,<span>{s.phone || s.email || '—'}</span>,s.package_name || s.package_id || '—',<Status value={s.status}/>,s.nutrition_category || 'Needs review',s.zone_number ? `Zone ${s.zone_number}` : 'Needs zone',s.area || '—',<button onClick={() => setSelected({ ...s })} className="ops-button-secondary">View details</button>])} empty="No customer records found." /></section>}
            {module === 'subscriptions' && <section className="space-y-4"><div className="grid gap-4 sm:grid-cols-3"><Metric label="Active customers" value={activeSubscribers.length}/><Metric label="Available packages" value={packages.filter((p) => p.active).length}/><Metric label="Payment-confirmed plans" value={subscribers.filter((s) => /paid/i.test(s.payment_status || '')).length}/></div><DataTable headers={['Package','Calories','Meals','Duration','Price','Availability','Action']} rows={packages.map((p) => [p.name,p.kcals, p.meals, p.duration,money(p.price,p.currency),<Status value={p.active ? 'Active' : 'Inactive'}/>,<button className="ops-button-secondary" onClick={() => setSelectedPackage({ ...p })}>Edit package</button>])} empty="No package records are available." /><p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Plan activation and billing state are controlled by verified Tap payments. Package edits update future selections and do not rewrite active Tap transactions.</p></section>}
            {module === 'menu' && <section className="space-y-4">{leader && <MonthlyMenuPublisher collection={settings?.active_season || 'autumn'} onPublished={() => refresh(true)} />}<div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600">Menu schedule and dish nutrition from the shared menu catalogue. The next monthly menu appears to customers on Saturday.</p><span className="text-xs font-semibold text-slate-500">{leader ? 'Leadership can publish a monthly PDF and edit menu availability.' : 'Kitchen view · read only'} · {settings?.active_season || 'Active'} collection</span></div><DataTable headers={['Week','Day','Meal','Dish','Calories','Schedule','Action']} rows={activeMenuAvailability.map((a) => { const dish = dishes.find((d) => d.id === a.dish_id); return [a.week_number,a.day_of_week,a.meal_period,dish?.name || 'Dish unavailable',dish?.kcals ?? '—',<Status value={a.is_active ? 'Active' : 'Unavailable'}/>,leader ? <div className="flex flex-wrap gap-2"><button className="ops-button-secondary" disabled={saving} onClick={() => setMenuAvailability(a,!a.is_active)}>{a.is_active ? 'Disable' : 'Enable'}</button>{dish && <button className="ops-button-secondary" onClick={() => setSelectedDish({ ...dish, protein: dish.macros?.protein, carbs: dish.macros?.carbs, fats: dish.macros?.fats })}>Edit dish</button>}{dish && <button className="ops-button-secondary" onClick={() => setSelectedRecipeDish(dish)}>Recipe ingredients</button>}</div> : '—']; })} empty="No scheduled meals found." /></section>}
            {(module === 'kitchen' || module === 'packing') && <ProductionSection module={module} date={date} setDate={setDate} rows={productionRows} subscribers={subscribers} downloadCsv={downloadCsv} />}
            {module === 'delivery' && <DeliverySection date={date} setDate={setDate} subscribers={activeSubscribers} riders={riders} deliveries={deliveries} saving={saving} assignRider={assignRider} updateDeliveryStatus={updateDeliveryStatus} />}
            {module === 'drivers' && <DriversSection riders={riders} deliveries={deliveries} subscribers={subscribers} date={date} setDate={setDate} />}
            {module === 'payments' && <PaymentsSection payments={payments} logs={paymentLogs} pending={pendingPayments} />}
            {module === 'reminders' && <section className="space-y-4"><div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Email delivery history from the notification log. Transactional email is sent by the configured Brevo-backed functions; this dashboard shows delivery outcomes and does not fabricate scheduled reminders.</div><DataTable headers={['When','Recipient','Subject','Provider','Status','Error']} rows={notifications.map((n) => [new Date(n.created_at).toLocaleString(),n.recipient || '—',n.subject,n.provider || '—',<Status value={n.status}/>,n.error || '—'])} empty="No email events recorded." /></section>}
            {module === 'reports' && <ReportsSection subscribers={subscribers} selections={currentSelections} payments={payments} bookings={bookings} date={date} setDate={setDate} downloadCsv={downloadCsv} />}
            {module === 'bookings' && <BookingsSection bookings={bookings} updateBooking={updateBooking} saving={saving} />}
            {module === 'team' && <DataTable headers={['Team role','Primary responsibility','Workspace access']} rows={[["CEO",'Company operations and decisions','All operations sections'],['Admin','Customer and company administration','All operations sections'],['Kitchen','Menu planning, bulk purchasing, production and packing','Meal plans, kitchen purchase list, customer packing list'],['Transport manager','Zone planning and rider assignment','Delivery and drivers'],['Driver','Delivery execution','Mobile app']]} empty="" />}
            {module === 'settings' && <SettingsSection settings={settings} save={saveGlobalSettings} saving={saving} />}
          </>
        )}
        </>}
      </div>
      {selected && <CustomerModal customer={selected} setCustomer={setSelected} save={saveCustomer} saving={saving} />}
      {selectedPackage && <PackageModal item={selectedPackage} setItem={setSelectedPackage} save={savePackage} saving={saving} />}
      {selectedDish && <DishModal item={selectedDish} setItem={setSelectedDish} save={saveDish} saving={saving} />}
      {selectedRecipeDish && <RecipeIngredientsModal dish={selectedRecipeDish} onClose={() => setSelectedRecipeDish(null)} />}
    </div>
  );
}

function Overview({ role, leader, subscribers, selections, bookings, payments, zones, setModule, notifications, packages }: any) {
  const kitchen = role === 'kitchen';
  const transport = role === 'transport';
  const activeSubscribers = subscribers.filter((subscriber: Row) => subscriber.status === 'active');
  const active = activeSubscribers.length;
  const missingZones = activeSubscribers.filter((subscriber: Row) => !subscriber.zone_number).length;
  const pendingPayments = payments.filter((payment: Row) => ['initiated','pending','failed'].includes(String(payment.status).toLowerCase())).length;
  const statusCounts = ['active','trialing','paused','cancelled'].map((status) => [status, subscribers.filter((subscriber: Row) => subscriber.status === status).length] as const);
  const paymentCounts = ['captured','pending','failed','initiated'].map((status) => [status, payments.filter((payment: Row) => payment.status === status).length] as const);
  const revenue = activeSubscribers.reduce((sum: number, subscriber: Row) => sum + (Number(packages.find((item: Row) => item.id === subscriber.package_id)?.price) || 0), 0);
  const recentEvents = [
    ...bookings.map((booking: Row) => ({ at: booking.created_at, label: `Consultation · ${booking.client_name}`, status: booking.status })),
    ...notifications.map((notification: Row) => ({ at: notification.created_at, label: `Email · ${notification.subject}`, status: notification.status })),
  ].filter((event) => event.at).sort((a,b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0,8);
  const kitchenDishCounts = Object.values((selections as Row[]).reduce((totals: Record<string, { dish: string; portions: number; day: string; meal: string }>, selection) => {
    const key = [selection.day_of_week, selection.meal_type, selection.dish_name].join('|');
    if (!totals[key]) totals[key] = { dish: selection.dish_name || 'Unassigned dish', portions: 0, day: selection.day_of_week || '—', meal: selection.meal_type || '—' };
    totals[key].portions += 1;
    return totals;
  }, {})).sort((a: any, b: any) => a.day.localeCompare(b.day) || a.meal.localeCompare(b.meal) || a.dish.localeCompare(b.dish));
  const kitchenCustomersWithNotes = new Set((selections as Row[]).filter((selection) => (selection.allergies || []).length || (selection.dislikes || []).length || selection.delivery_notes).map((selection) => selection.subscriber_id)).size;
  const actions: [Module, string][] = leader
    ? [['customers','Review customers'],['payments','Reconcile Tap payments'],['kitchen','Open kitchen purchase list'],['delivery','Plan delivery routes']]
    : kitchen
      ? [['menu','Review weekly menu'],['kitchen','Open bulk purchase list'],['packing','Open customer packing list']]
      : [['delivery','Plan zones and rider routes'],['drivers','Review rider fleet']];

  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kitchen ? <>
        <Metric label="Meal portions for this service week" value={selections.length}/>
        <Metric label="Dish and meal combinations" value={kitchenDishCounts.length}/>
        <Metric label="Customers with food or delivery notes" value={kitchenCustomersWithNotes}/>
        <Metric label="Active customers missing a zone" value={missingZones}/>
      </> : <>
        <Metric label="Active customers" value={active}/>
        {leader && <Metric label="Active-plan monthly list value" value={money(revenue)}/>}
        {leader && <Metric label="Consultations awaiting review" value={bookings.filter((booking: Row) => booking.status === 'pending').length}/>}
        {leader && <Metric label="Tap items to reconcile" value={pendingPayments}/>}
        <Metric label="Active customers missing zone" value={missingZones}/>
      </>}
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      {(leader || transport) && <section className="ops-surface"><SectionHeading title="Active customers by Qatar zone" helper="Use these totals to group stops and plan rider coverage."/><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{zones.map(([zone,count]: [string,number]) => <div key={zone} className={`rounded-xl border p-4 ${zone === 'Needs zone' ? 'border-amber-200 bg-amber-50' : 'border-primary/10 bg-background'}`}><p className="text-xs font-semibold uppercase text-muted">{zone === 'Needs zone' ? zone : `Zone ${zone}`}</p><p className="mt-1 text-2xl font-bold text-primary">{count}</p></div>)}</div></section>}
      <section className="ops-surface"><SectionHeading title={kitchen ? 'Quick kitchen actions' : 'Quick actions'} helper={kitchen ? 'Move from menu choices to bulk prep and then customer portions.' : 'Jump to the work that needs attention.'}/><div className="grid gap-2 sm:grid-cols-2">{actions.map(([key,label]) => <button key={key} onClick={() => setModule(key)} className="rounded-xl border border-primary/10 bg-white p-4 text-start font-semibold text-primary hover:bg-emerald-50">{label}</button>)}</div></section>
    </div>

    {kitchen && <section className="ops-surface"><SectionHeading title="Weekly dish forecast" helper="Bulk portions by selected dish. Open Packing for the client-by-client split after stock arrives."/><DataTable headers={['Service day','Meal','Dish','Portions']} rows={kitchenDishCounts.map((row: any) => [row.day,row.meal,row.dish,row.portions])} empty="No customer meal selections are available for this service week." /></section>}

    {leader && <div className="grid gap-6 xl:grid-cols-2">
      <section className="ops-surface"><SectionHeading title="Subscription status" helper="Live counts from the subscriber records."/><div className="space-y-3">{statusCounts.map(([status,count]) => <div key={status} className="flex items-center gap-3"><span className="w-24 text-sm capitalize">{status}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-primary" style={{ width: `${subscribers.length ? Math.max(0, count / subscribers.length * 100) : 0}%` }}/></div><strong className="w-10 text-end">{count}</strong></div>)}</div></section>
      <section className="ops-surface"><SectionHeading title="Recent work" helper="Recent consultation and email events."/><div className="grid grid-cols-2 gap-3">{paymentCounts.map(([status,count]) => <div key={status} className="rounded-xl border border-primary/10 bg-background p-4"><p className="text-xs font-semibold uppercase text-muted">Tap {status}</p><p className="mt-1 text-2xl font-bold text-primary">{count}</p></div>)}</div><div className="mt-4 divide-y divide-primary/10">{recentEvents.map((event,i) => <div key={`${event.at}-${i}`} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="truncate">{event.label}</span><Status value={event.status}/></div>)}{!recentEvents.length && <p className="text-sm text-muted">No recent work has been recorded.</p>}</div></section>
    </div>}
  </div>;
}

function DeliverySection({ date, setDate, subscribers, riders, deliveries, saving, assignRider, updateDeliveryStatus }: any) {
  const [zone, setZone] = useState('All zones');
  const [meal, setMeal] = useState('lunch');
  const zones = [...new Set(subscribers.map((s: Row) => s.zone_number || 'Needs zone'))].sort((a: any,b: any) => a === 'Needs zone' ? 1 : b === 'Needs zone' ? -1 : Number(a)-Number(b));
  const list = subscribers.filter((s: Row) => zone === 'All zones' || String(s.zone_number || 'Needs zone') === String(zone)).sort((a: Row,b: Row) => String(a.lunch_window || '').localeCompare(String(b.lunch_window || '')) || String(a.full_name).localeCompare(String(b.full_name)));
  const windowKey = `${meal}_window`;
  const deliveryFor = (id: string) => deliveries.find((d: Row) => d.subscriber_id === id && d.meal_type === meal);
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <label className="text-sm font-semibold">Delivery date <input className="ops-control ms-2" type="date" value={date} onChange={(e) => setDate(e.target.value)}/></label>
      <select aria-label="Delivery zone" className="ops-control" value={zone} onChange={(e) => setZone(e.target.value)}><option>All zones</option>{zones.map((z: any) => <option key={z} value={z}>{z === 'Needs zone' ? z : `Zone ${z}`}</option>)}</select>
      <select aria-label="Meal delivery route" className="ops-control capitalize" value={meal} onChange={(e) => setMeal(e.target.value)}>{['breakfast','lunch','dinner','snacks'].map((type) => <option key={type} value={type}>{type}</option>)}</select>
    </div>
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Customers in view" value={list.length}/><Metric label="Assigned stops" value={list.filter((s: Row) => deliveryFor(s.id)).length}/><Metric label="Needs rider" value={list.filter((s: Row) => !deliveryFor(s.id)).length}/></div>
    <DataTable headers={['Customer','Zone','Delivery address','Delivery window','Rider assignment','Status','Map']} rows={list.map((s: Row) => {
      const d = deliveryFor(s.id);
      const map = s.latitude && s.longitude ? `https://www.google.com/maps?q=${s.latitude},${s.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([s.building_number,s.street,s.area,'Doha Qatar'].filter(Boolean).join(' '))}`;
      return [<strong>{s.full_name || 'Customer'}</strong>,s.zone_number ? `Zone ${s.zone_number}` : <span className="text-amber-700">Needs zone</span>,[s.building_number,s.street,s.area].filter(Boolean).join(', ') || 'Address missing',s[windowKey] || 'Time not set',<select aria-label={`Assign ${meal} rider for ${s.full_name || 'customer'}`} className="ops-control min-w-40" value={d?.rider_application_id || ''} disabled={saving} onChange={(e) => assignRider(s.id,e.target.value,meal)}><option value="">Assign rider…</option>{riders.map((r: Row) => <option key={r.id} value={r.id}>{r.full_name || r.phone || 'Rider'}</option>)}</select>,d ? <select aria-label={`Update delivery status for ${s.full_name || 'customer'}`} className="ops-control" value={d.status} disabled={saving} onChange={(e) => updateDeliveryStatus(d.id,e.target.value)}><option value="pending">Pending</option><option value="delivered">Delivered</option><option value="failed">Failed</option></select> : <Status value="Unassigned"/>,<a className="text-sm font-semibold text-primary underline" target="_blank" rel="noreferrer" href={map}>Open map</a>];
    })} empty="No active customers in this zone." />
  </section>;
}

function DriversSection({ riders, deliveries, subscribers, date, setDate }: any) {
  return <section className="space-y-4"><div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"><div><h2 className="font-bold">Rider fleet</h2><p className="text-sm text-slate-600">Driver delivery execution stays in the mobile app.</p></div><label className="text-sm font-semibold">Date <input type="date" className="ops-control ms-2" value={date} onChange={(e) => setDate(e.target.value)}/></label></div><DataTable headers={['Rider','Phone','Availability','Assigned stops','Completed']} rows={riders.map((r: Row) => { const rows = deliveries.filter((d: Row) => d.rider_application_id === r.id); return [r.full_name || 'Rider',r.phone || '—',<Status value={r.is_online ? 'Online' : 'Offline'}/>,rows.length,rows.filter((d: Row) => d.status === 'delivered').length]; })} empty="No approved riders found."/><div className="ops-surface"><SectionHeading title="Route status" helper="Assignments for the selected date."/><DataTable headers={['Stop','Rider','Date','Meal','Status']} rows={deliveries.map((d: Row) => [subscribers.find((s: Row) => s.id === d.subscriber_id)?.full_name || 'Customer',riders.find((r: Row) => r.id === d.rider_application_id)?.full_name || 'Unassigned',d.delivery_date,d.meal_type,<Status value={d.status}/>])} empty="No route assignments for this date."/></div></section>;
}

function ProductionSection({ module, date, setDate, rows, subscribers, downloadCsv }: any) {
  const [ingredientRows, setIngredientRows] = useState<Row[]>([]);
  const [ingredientError, setIngredientError] = useState('');
  const weekStart = (() => { const day = new Date(`${date}T12:00:00Z`).getUTCDay(); const saturday = new Date(`${date}T12:00:00Z`); saturday.setUTCDate(saturday.getUTCDate() + ((6 - day + 7) % 7 || 7)); return saturday.toISOString().slice(0, 10); })();
  useEffect(() => {
    if (module !== 'kitchen') return;
    void supabase.from('kitchen_ingredient_order_view').select('*').eq('week_start_date', weekStart).order('ingredient_name')
      .then(({ data, error }) => { if (error) setIngredientError(error.message); else { setIngredientError(''); setIngredientRows(data || []); } });
  }, [module, weekStart]);
  const list = rows as Row[];
  const portions = list.reduce((counts: Record<string,number>, row) => { const category = row.nutrition_category || 'Needs category'; counts[category] = (counts[category] || 0) + 1; return counts; }, {});
  const dishCounts = Object.values(list.reduce((totals: Record<string, { day: string; meal: string; dish: string; portions: number }>, row) => {
    const key = [row.day_of_week, row.meal_type, row.dish_name].join('|');
    if (!totals[key]) totals[key] = { day: row.day_of_week || '—', meal: normalizedMeal(row.meal_type || '—'), dish: row.dish_name || 'Unassigned dish', portions: 0 };
    totals[key].portions += 1;
    return totals;
  }, {})).sort((a, b) => a.day.localeCompare(b.day) || a.meal.localeCompare(b.meal) || a.dish.localeCompare(b.dish));
  const mealsWithNotes = list.filter((row) => (row.allergies || []).length || (row.dislikes || []).length || row.delivery_notes).length;
  const mealPrepNotes = (row: Row) => {
    const customizations = row.customizations && typeof row.customizations === 'object' ? row.customizations : {};
    const notes: string[] = [];
    const removed = Array.isArray(customizations.removed_ingredients) ? customizations.removed_ingredients.filter(Boolean) : [];
    const substitutions = customizations.substitutions && typeof customizations.substitutions === 'object'
      ? Object.entries(customizations.substitutions).filter(([from, to]) => from && to).map(([from, to]) => `${from} → ${to}`)
      : [];
    const extra = [customizations.notes, customizations.note, customizations.special_instructions, customizations.kitchen_notes, customizations.instructions]
      .filter((value) => typeof value === 'string' && value.trim());
    if (removed.length) notes.push(`Remove: ${removed.join(', ')}`);
    if (substitutions.length) notes.push(`Substitute: ${substitutions.join(', ')}`);
    if (extra.length) notes.push(...extra);
    return notes;
  };
  const kitchenSafetyRows = list.filter((row) => (Array.isArray(row.allergies) ? row.allergies.length : !!row.allergies) || (Array.isArray(row.dislikes) ? row.dislikes.length : !!row.dislikes) || mealPrepNotes(row).length);
  const isKitchen = module === 'kitchen';
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"><div><h2 className="text-lg font-bold">{isKitchen ? 'Weekly bulk purchasing' : 'Customer packing sheet'}</h2><p className="text-sm text-slate-600">{isKitchen ? 'Order ingredients from the total recipe quantities for every selected meal. Packing keeps each customer’s exact choices.' : 'Use individual customer selections after bulk ingredients arrive to split meals into the right portions.'}</p></div><label className="text-sm font-semibold">Service week <input type="date" className="ops-control ms-2" value={date} onChange={(event) => setDate(event.target.value)}/></label></div>
    <div className="grid gap-3 sm:grid-cols-3"><Metric label={isKitchen ? 'Meal portions to prepare' : 'Customer meal portions'} value={list.length}/><Metric label={isKitchen ? 'Meals with dietary or delivery notes' : 'Customers with special notes'} value={isKitchen ? mealsWithNotes : new Set(list.filter((row) => (row.allergies || []).length || (row.dislikes || []).length || row.delivery_notes).map((row) => row.subscriber_id)).size}/><Metric label="Distinct dishes" value={new Set(list.map((row) => row.dish_name)).size}/></div>
    {isKitchen ? <>
      <div className="ops-surface"><SectionHeading title="Bulk ingredient totals" helper="Totals combine all active customers’ meal choices. Example: 2 chicken portions × 100 g per recipe = 200 g to purchase."/>{ingredientError ? <p role="alert" className="text-sm text-amber-800">Ingredient totals unavailable: {ingredientError}</p> : <DataTable headers={['Ingredient to purchase','Total quantity','Unit','Meals using ingredient']} rows={ingredientRows.map((item) => [item.ingredient_name,item.quantity_to_order,item.unit,item.meal_servings])} empty="No ingredient totals yet. Add recipe quantities to the dishes in Meal Plans, then the weekly selections will calculate the bulk order."/>}</div>
      <div className="ops-surface"><SectionHeading title="Selected portions by dish" helper="Counts stay aggregated for purchasing and production planning."/><DataTable headers={['Service day','Meal','Dish','Portions']} rows={dishCounts.map((row) => [row.day,row.meal,row.dish,row.portions])} empty="No meal selections are saved for this service week."/></div>
      <div className="ops-surface"><SectionHeading title="Allergies and preparation notes" helper="Check these customer-specific safety and meal-preparation instructions before cooking. Delivery instructions remain on the transport workflow."/><DataTable headers={['Customer','Service day','Meal','Selected dish','Allergies','Avoid','Preparation notes']} rows={kitchenSafetyRows.map((row) => [row.full_name || 'Customer',row.day_of_week || '—',normalizedMeal(row.meal_type || '—'),row.dish_name || 'Unassigned dish',(Array.isArray(row.allergies) ? row.allergies : row.allergies ? [row.allergies] : []).join(', ') || '—',(Array.isArray(row.dislikes) ? row.dislikes : row.dislikes ? [row.dislikes] : []).join(', ') || '—',mealPrepNotes(row).join(' · ') || '—'])} empty="No allergy or meal-preparation notes were recorded for these selections."/></div>
    </> : <>
      <div className="ops-surface"><SectionHeading title="A–F portion counts" helper="Counts by assigned nutrition category for the customer packing run."/><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{['A','B','C','D','E','F','Needs category'].map((key) => <div key={key} className="rounded-xl border border-primary/10 bg-background p-3"><p className="text-xs font-semibold text-muted">{key}</p><p className="text-xl font-bold text-primary">{portions[key] || 0}</p></div>)}</div></div>
      <div className="flex flex-wrap gap-2"><button className="ops-button flex items-center gap-2" onClick={() => downloadCsv('THK-packing-sheet',['Customer','Package','Week start','Day','Meal','Dish','Calories','Category','Area','Address','Allergies','Dislikes','Delivery notes'],list.map((row) => [row.full_name,row.package_name,row.week_start_date,row.day_of_week,row.meal_type,row.dish_name,row.dish_kcals,row.nutrition_category || 'Needs category',row.area,[row.building_number,row.street].filter(Boolean).join(', '),(row.allergies || []).join('; '),(row.dislikes || []).join('; '),row.delivery_notes]))}><Download size={16}/>Download customer packing CSV</button><button className="ops-button-secondary" onClick={() => window.print()}>Print sheet</button></div>
      <DataTable headers={['Customer','Meal','Dish','Calories','A–F category','Area / zone','Food notes','Delivery note']} rows={list.map((row) => [row.full_name || 'Customer',normalizedMeal(row.meal_type),row.dish_name,row.dish_kcals ?? '—',row.nutrition_category || 'Needs category',`${row.area || '—'}${row.zone_number ? ` · Zone ${row.zone_number}` : ''}`,[...(row.allergies || []).map((item: string) => `Allergy: ${item}`),...(row.dislikes || []).map((item: string) => `Avoid: ${item}`)].join(' · ') || '—',row.delivery_notes || '—'])} empty="No meal selections are saved for this service week."/>
    </>}
  </section>;
}

function PaymentsSection({ payments, logs, pending }: any) {
  return <section className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><Metric label="Transactions" value={payments.length}/><Metric label="Need reconciliation" value={pending.length}/><Metric label="Captured" value={payments.filter((p: Row) => p.status === 'captured').length}/></div><p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Tap is the payment source of truth. Confirmations and subscription activation are webhook-driven; use the transaction history to investigate failed or pending charges.</p><DataTable headers={['Created','Customer','Amount','Charge ID','Status']} rows={payments.map((p: Row) => [new Date(p.created_at).toLocaleString(),p.subscriber_id,p.amount ? money(p.amount,p.currency) : '—',p.tap_charge_id || '—',<Status value={p.status}/>])} empty="No Tap transactions recorded."/><div className="ops-surface"><SectionHeading title="Payment event log" helper="Gateway callback and reconciliation events."/><DataTable headers={['When','Charge ID','Event','Severity']} rows={logs.map((l: Row) => [new Date(l.created_at).toLocaleString(),l.tap_charge_id || '—',l.event_type,<Status value={l.severity || 'info'}/>])} empty="No payment log records."/></div></section>;
}

function ReportsSection({ subscribers, selections, payments, bookings, date, setDate, downloadCsv }: any) {
  const active = subscribers.filter((s: Row) => s.status === 'active');
  return <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"><div><h2 className="font-bold">Operations reports</h2><p className="text-sm text-slate-600">Exports are generated from current Supabase records.</p></div><label className="text-sm font-semibold">Report date <input type="date" className="ops-control ms-2" value={date} onChange={(e) => setDate(e.target.value)}/></label></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[["Customer A–Z",active.length,() => downloadCsv('THK-customer-directory',['Name','Phone','Email','Package','Status','Area','Zone','Address'],active.map((s: Row) => [s.full_name,s.phone,s.email,s.package_name,s.status,s.area,s.zone_number,[s.building_number,s.street].filter(Boolean).join(', ')]))],["Kitchen selections",selections.length,() => downloadCsv('THK-kitchen-report',['Customer','Week','Day','Meal','Dish','Calories','Notes'],selections.map((s: Row) => [s.full_name,s.week_start_date,s.day_of_week,s.meal_type,s.dish_name,s.dish_kcals,[...(s.allergies || []),...(s.dislikes || []),s.delivery_notes].filter(Boolean).join('; ')]))],["Tap transactions",payments.length,() => downloadCsv('THK-payment-report',['Transaction','Subscriber','Amount','Currency','Status','Created'],payments.map((p: Row) => [p.id,p.subscriber_id,p.amount,p.currency,p.status,p.created_at]))],["Consultations",bookings.length,() => downloadCsv('THK-consultation-report',['Customer','Package','Date','Time','Status'],bookings.map((b: Row) => [b.client_name,b.package_name,b.appointment_date,b.appointment_time,b.status]))]].map(([title,count,download]: any) => <article key={title} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm font-semibold text-slate-500">{title}</p><p className="my-3 text-3xl font-bold">{count}</p><button className="ops-button-secondary flex items-center gap-2" onClick={download}><Download size={16}/>Download CSV</button></article>)}</div><button className="ops-button-secondary" onClick={() => window.print()}>Print current view</button></section>;
}

function BookingsSection({ bookings, updateBooking, saving }: any) {
  return <DataTable headers={['Customer','Contact','Package','Appointment','Status','Update']} rows={bookings.map((b: Row) => [b.client_name,<div>{b.client_email}<br/>{b.client_phone}</div>,b.package_name,`${b.appointment_date} · ${b.appointment_time}`,<Status value={b.status}/>,<select className="ops-control" value={b.status} disabled={saving} onChange={(e) => updateBooking(b,e.target.value)}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>])} empty="No consultations found."/>;
}

function SettingsSection({ settings, save, saving }: any) {
  if (!settings) return <div className="ops-surface"><p>Settings have not been configured in Supabase.</p></div>;
  return <div className="ops-surface max-w-3xl space-y-5"><SectionHeading title="Menu and season settings" helper="Changes affect the shared menu and customer selection window."/><label className="block text-sm font-semibold">Active collection<select className="ops-control mt-2 w-full" value={settings.active_season} onChange={(e) => save({ active_season: e.target.value, ramadan_mode: e.target.value === 'ramadan' })}><option value="summer">Summer</option><option value="autumn">Autumn</option><option value="ramadan">Ramadan</option></select></label><label className="block text-sm font-semibold">Menu selection deadline<input type="datetime-local" className="ops-control mt-2 w-full" value={settings.selection_deadline ? new Date(settings.selection_deadline).toISOString().slice(0,16) : ''} onChange={(e) => e.target.value && save({ selection_deadline: new Date(e.target.value).toISOString() })}/></label><p className="text-xs text-slate-500">Payments and subscription state remain controlled by Tap’s verified webhook.</p>{saving && <p className="text-sm text-slate-500">Saving…</p>}</div>;
}

function CustomerModal({ customer, setCustomer, save, saving }: any) {
  const set = (key: string, value: any) => setCustomer((current: Row) => ({ ...current, [key]: value }));
  return <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/50 p-3" role="dialog" aria-modal="true" aria-label="Customer details"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-bold">{customer.full_name || 'Customer'}</h2><p className="text-sm text-slate-500">{customer.package_name} · {customer.status}</p></div><button className="rounded-lg p-2 hover:bg-slate-100" onClick={() => setCustomer(null)} aria-label="Close"><X/></button></div><div className="grid gap-4 sm:grid-cols-2">{[['full_name','Full name'],['phone','Phone'],['email','Email'],['package_name','Package'],['area','Area'],['zone_number','Qatar zone'],['building_number','Building'],['street','Street'],['latitude','Latitude'],['longitude','Longitude'],['breakfast_window','Breakfast delivery window'],['lunch_window','Lunch delivery window'],['dinner_window','Dinner delivery window']].map(([key,label]) => <label key={key} className="text-sm font-semibold">{label}<input className="ops-control mt-1 w-full" value={customer[key] ?? ''} disabled={key === 'email' || key === 'package_name'} onChange={(e) => set(key,e.target.value)}/></label>)}<label className="text-sm font-semibold">Nutrition category<select className="ops-control mt-1 w-full" value={customer.nutrition_category || ''} onChange={(e) => set('nutrition_category',e.target.value || null)}><option value="">Needs review</option>{['A','B','C','D','E','F'].map((category) => <option key={category}>{category}</option>)}</select></label><label className="text-sm font-semibold sm:col-span-2">Delivery notes<textarea className="ops-control mt-1 min-h-20 w-full" value={customer.delivery_notes || ''} onChange={(e) => set('delivery_notes',e.target.value)}/></label><label className="text-sm font-semibold sm:col-span-2">Allergies<input className="ops-control mt-1 w-full" value={(customer.allergies || []).join(', ')} onChange={(e) => set('allergies',e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean))}/></label><label className="text-sm font-semibold sm:col-span-2">Dislikes<input className="ops-control mt-1 w-full" value={(customer.dislikes || []).join(', ')} onChange={(e) => set('dislikes',e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean))}/></label></div><div className="mt-6 flex justify-end gap-3"><button className="ops-button-secondary" onClick={() => setCustomer(null)}>Close</button><button className="ops-button" onClick={() => save(customer)} disabled={saving}>{saving ? 'Saving…' : 'Save customer details'}</button></div></div></div>;
}

function PackageModal({ item, setItem, save, saving }: any) {
  const set = (key: string, value: any) => setItem((current: Row) => ({ ...current, [key]: value }));
  const fields: [string,string][] = [['name','Package name'],['kcals','Calories'],['price','Price'],['meals','Included meals'],['duration','Duration'],['highlight','Highlight'],['description','Description']];
  return <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/50 p-3" role="dialog" aria-modal="true" aria-label="Edit subscription package"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-bold">Edit package</h2><p className="text-sm text-slate-500">Updates the shared package catalogue.</p></div><button className="rounded-lg p-2 hover:bg-slate-100" onClick={() => setItem(null)} aria-label="Close"><X/></button></div><div className="grid gap-4 sm:grid-cols-2">{fields.map(([key,label]) => <label key={key} className={`text-sm font-semibold ${key === 'description' ? 'sm:col-span-2' : ''}`}>{label}{key === 'description' ? <textarea className="ops-control mt-1 min-h-24 w-full" value={item[key] ?? ''} onChange={(e) => set(key,e.target.value)}/> : <input className="ops-control mt-1 w-full" type={['kcals','price'].includes(key) ? 'number' : 'text'} min={['kcals','price'].includes(key) ? 0 : undefined} value={item[key] ?? ''} onChange={(e) => set(key,['kcals','price'].includes(key) ? Number(e.target.value) : e.target.value)}/>}</label>)}<label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={!!item.active} onChange={(e) => set('active',e.target.checked)}/>Available for new subscriptions</label></div><div className="mt-6 flex justify-end gap-3"><button className="ops-button-secondary" onClick={() => setItem(null)}>Close</button><button className="ops-button" disabled={saving} onClick={() => save(item)}>{saving ? 'Saving…' : 'Save package'}</button></div></div></div>;
}

function DishModal({ item, setItem, save, saving }: any) {
  const set = (key: string, value: any) => setItem((current: Row) => ({ ...current, [key]: value }));
  return <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/50 p-3" role="dialog" aria-modal="true" aria-label="Edit dish nutrition"><div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-bold">Edit dish and nutrition</h2><p className="text-sm text-slate-500">Changes appear in the shared menu and customer selection view.</p></div><button className="rounded-lg p-2 hover:bg-slate-100" onClick={() => setItem(null)} aria-label="Close"><X/></button></div><div className="grid gap-4 sm:grid-cols-2">{[['name','Dish name','text'],['kcals','Calories','number'],['protein','Protein (g)','number'],['carbs','Carbohydrates (g)','number'],['fats','Fat (g)','number']].map(([key,label,type]) => <label key={key} className="text-sm font-semibold">{label}<input className="ops-control mt-1 w-full" type={type} min={type === 'number' ? 0 : undefined} value={item[key] ?? ''} onChange={(e) => set(key,type === 'number' ? Number(e.target.value) : e.target.value)}/></label>)}<label className="text-sm font-semibold sm:col-span-2">Allergens, comma separated<input className="ops-control mt-1 w-full" value={(item.allergens || []).join(', ')} onChange={(e) => set('allergens',e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean))}/></label></div><div className="mt-6 flex justify-end gap-3"><button className="ops-button-secondary" onClick={() => setItem(null)}>Close</button><button className="ops-button" disabled={saving} onClick={() => save(item)}>{saving ? 'Saving…' : 'Save dish'}</button></div></div></div>;
}

function RecipeIngredientsModal({ dish, onClose }: { dish: Row; onClose: () => void }) {
  const { isRtl, t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [initialSlugs, setInitialSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    void supabase.from('meal_ingredient_config').select('ingredient_slug,quantity_per_serving,unit,ingredients(name)')
      .eq('dish_slug', dish.slug).order('ingredient_slug').then(({ data, error: loadError }) => {
        if (loadError) setError(loadError.message);
        else {
          const loaded = (data || []).map((row: Row) => ({ slug: row.ingredient_slug, name: row.ingredients?.name || row.ingredient_slug, quantity: row.quantity_per_serving, unit: row.unit || 'g' }));
          setRows(loaded); setInitialSlugs(loaded.map((row) => row.slug));
        }
        setLoading(false);
      });
  }, [dish.slug]);
  const update = (index: number, patch: Row) => setRows((current) => current.map((row, i) => i === index ? { ...row, ...patch } : row));
  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const active: string[] = [];
      for (const row of rows.filter((item) => item.name.trim())) {
        const slug = row.slug || row.name.trim().toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (!slug || !Number.isFinite(Number(row.quantity)) || Number(row.quantity) <= 0 || !row.unit.trim()) throw new Error(t('recipe_input_error'));
        const { error: ingredientError } = await supabase.from('ingredients').upsert({ slug, name: row.name.trim() }, { onConflict: 'slug' });
        if (ingredientError) throw ingredientError;
        const { error: configError } = await supabase.from('meal_ingredient_config').upsert({ dish_slug: dish.slug, ingredient_slug: slug, quantity_per_serving: Number(row.quantity), unit: row.unit.trim() }, { onConflict: 'dish_slug,ingredient_slug' });
        if (configError) throw configError;
        active.push(slug);
      }
      for (const slug of initialSlugs.filter((value) => !active.includes(value))) {
        const { error: deleteError } = await supabase.from('meal_ingredient_config').delete().eq('dish_slug', dish.slug).eq('ingredient_slug', slug);
        if (deleteError) throw deleteError;
      }
      setInitialSlugs(active); setRows((current) => current.filter((row) => active.includes(row.slug) || row.name.trim())); setSaved(true);
    } catch (e: any) { setError(e?.message || t('recipe_save_failed')); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/50 p-3" role="dialog" aria-modal="true" aria-label={t('recipe_ingredients')} dir={isRtl ? 'rtl' : 'ltr'}><section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-bold">{t('recipe_ingredients')}</h2><p className="text-sm text-slate-500">{dish.name} · {t('recipe_quantity_help')}</p></div><button className="rounded-lg p-2 hover:bg-slate-100" onClick={onClose} aria-label={t('close')}><X/></button></div>{loading ? <p className="text-sm text-slate-500">{t('loading_recipe')}</p> : <><div className="space-y-2">{rows.map((row,index) => <div key={`${row.slug || 'new'}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_130px_120px_auto]"><input className="ops-control" aria-label={t('ingredient_name')} placeholder={t('ingredient_name')} value={row.name} onChange={(event) => update(index,{ name:event.target.value,slug:'' })}/><input className="ops-control" aria-label={t('quantity_per_serving')} type="number" min="0.001" step="0.001" value={row.quantity} onChange={(event) => update(index,{ quantity:Number(event.target.value) })}/><input className="ops-control" aria-label={t('unit')} placeholder="g, ml, pieces" value={row.unit} onChange={(event) => update(index,{ unit:event.target.value })}/><button type="button" className="ops-button-secondary" aria-label={t('remove_entry')} onClick={() => setRows((current) => current.filter((_,i) => i !== index))}><Trash2 size={16}/></button></div>)}</div><button className="ops-button-secondary mt-3" onClick={() => setRows((current) => [...current,{ name:'',quantity:1,unit:'g',slug:'' }])}>{t('add_ingredient')}</button></>}{error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{saved && <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{t('recipe_saved')}</p>}<div className="mt-6 flex justify-end gap-3"><button className="ops-button-secondary" onClick={onClose}>{t('close')}</button><button className="ops-button" disabled={saving || loading} onClick={() => void save()}>{saving ? t('saving') : t('save_recipe')}</button></div></section></div>;
}

function MonthlyMenuPublisher({ collection, onPublished }: { collection: string; onPublished: () => void }) {
  const { t, isRtl } = useLanguage();
  const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
  const [month, setMonth] = useState(nextMonth.toISOString().slice(0, 7));
  const [file, setFile] = useState<File | null>(null);
  const [entries, setEntries] = useState<ParsedMenuEntry[]>([]);
  const [repeatWeek, setRepeatWeek] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState<Row[]>([]);
  const canRepeat = entries.length > 0 && entries.every((entry) => entry.week_number === 1);
  const choiceSlots = Object.values(entries.reduce<Record<string, number>>((counts, entry) => {
    const key = `${entry.week_number}|${entry.day_of_week}|${entry.meal_period}`;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {}));
  const threeChoiceSlots = choiceSlots.filter((count) => count === 3).length;

  const refreshDocuments = async () => {
    const { data, error: loadError } = await supabase.from('monthly_menu_documents').select('id,title,month_start,source_filename,storage_path,available_from,created_at').order('created_at', { ascending: false }).limit(12);
    if (!loadError) setDocuments(data || []);
  };
  useEffect(() => { void refreshDocuments(); }, []);

  const handleFile = async (picked: File | null) => {
    setFile(picked); setEntries([]); setMessage(''); setError('');
    if (!picked) return;
    if (picked.type !== 'application/pdf' || picked.size > 20 * 1024 * 1024) {
      setError(t('menu_pdf_invalid')); setFile(null); return;
    }
    setBusy(true);
    try {
      const { parseMonthlyMenuPdf } = await import('../lib/monthly-menu-pdf');
      const result = await parseMonthlyMenuPdf(picked);
      setEntries(result);
      setRepeatWeek(result.every((entry) => entry.week_number === 1));
    } catch (e: any) { setError(e?.message || t('menu_pdf_parse_error')); }
    finally { setBusy(false); }
  };

  const editEntry = (index: number, patch: Partial<ParsedMenuEntry>) => {
    setEntries((current) => current.map((entry, i) => i === index ? { ...entry, ...patch } : entry));
  };

  const addEntry = () => setEntries((current) => [...current, {
    week_number: 1, day_of_week: MENU_DAYS[0], meal_period: MENU_MEALS[0], name: '', kcals: 100,
    kitchen_choice: false,
  }]);

  const publish = async () => {
    if (!file || entries.length < 24) return;
    setBusy(true); setError(''); setMessage('');
    const safeName = file.name.replace(/[^\w.-]+/g, '_').slice(-120);
    const storagePath = `${month}/${crypto.randomUUID()}-${safeName}`;
    try {
      const { error: uploadError } = await supabase.storage.from('monthly-menu-pdfs').upload(storagePath, file, { contentType: 'application/pdf', upsert: false });
      if (uploadError) throw uploadError;
      const { data, error: publishError } = await supabase.rpc('publish_monthly_menu', {
        p_title: new Date(`${month}-01T12:00:00`).toLocaleDateString(isRtl ? 'ar-QA' : 'en-QA', { month: 'long', year: 'numeric' }),
        p_month_start: `${month}-01`, p_source_filename: file.name, p_storage_path: storagePath,
        p_collection: collection, p_items: entries, p_repeat_single_week: repeatWeek,
      });
      if (publishError) {
        await supabase.storage.from('monthly-menu-pdfs').remove([storagePath]);
        throw publishError;
      }
      setMessage(`${t('monthly_menu_published')} ${new Date(`${data.available_from}T12:00:00`).toLocaleDateString(isRtl ? 'ar-QA' : 'en-QA')}.`);
      setFile(null); setEntries([]); await refreshDocuments(); onPublished();
    } catch (e: any) { setError(e?.message || t('monthly_menu_publish_failed')); }
    finally { setBusy(false); }
  };

  const openPdf = async (path: string) => {
    const { data, error: linkError } = await supabase.storage.from('monthly-menu-pdfs').createSignedUrl(path, 3600);
    if (linkError) setError(linkError.message); else if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  return <section className="ops-surface space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
    <div><h2 className="text-lg font-bold">{t('monthly_menu_title')}</h2><p className="mt-1 text-sm text-slate-600">{t('monthly_menu_help')}</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">{t('menu_month')}<input type="month" className="ops-control mt-1 w-full" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
      <label className="text-sm font-semibold">{t('menu_pdf_file')}<input type="file" accept="application/pdf,.pdf" className="ops-control mt-1 w-full" onChange={(event) => void handleFile(event.target.files?.[0] || null)} /></label>
    </div>
    {busy && <p role="status" className="text-sm text-slate-600">{entries.length ? t('publishing_menu') : t('reading_menu_pdf')}</p>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    {entries.length > 0 && <>
      {canRepeat && <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><input type="checkbox" checked={repeatWeek} onChange={(event) => setRepeatWeek(event.target.checked)} />{t('repeat_monthly_menu_week')}</label>}
      <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-start text-sm"><thead className="sticky top-0 bg-slate-50"><tr><th className="p-2">{t('week')}</th><th className="p-2">{t('day')}</th><th className="p-2">{t('meal')}</th><th className="p-2">{t('dish')}</th><th className="p-2">{t('calories')}</th><th className="p-2">{t('kitchen_choice')}</th><th className="p-2">{t('remove_entry')}</th></tr></thead><tbody>
          {entries.map((entry, index) => <tr key={`${entry.week_number}-${entry.day_of_week}-${entry.meal_period}-${index}`} className="border-t border-slate-100"><td className="p-2"><select className="ops-control" aria-label={t('week')} value={entry.week_number} onChange={(event) => editEntry(index, { week_number: Number(event.target.value) })}>{[1,2,3,4].map((value) => <option key={value} value={value}>{value}</option>)}</select></td><td className="p-2"><select className="ops-control" aria-label={t('day')} value={entry.day_of_week} onChange={(event) => editEntry(index, { day_of_week: event.target.value as ParsedMenuEntry['day_of_week'] })}>{MENU_DAYS.map((value) => <option key={value} value={value}>{t(value)}</option>)}</select></td><td className="p-2"><select className="ops-control" aria-label={t('meal')} value={entry.meal_period} onChange={(event) => editEntry(index, { meal_period: event.target.value as ParsedMenuEntry['meal_period'] })}>{MENU_MEALS.map((value) => <option key={value} value={value}>{t(value)}</option>)}</select></td><td className="p-2"><input className="ops-control min-w-48" aria-label={t('dish_name')} value={entry.name} onChange={(event) => editEntry(index, { name: event.target.value })} /></td><td className="p-2"><input className="ops-control w-24" aria-label={t('calories')} type="number" min={20} max={2500} value={entry.kcals} onChange={(event) => editEntry(index, { kcals: Number(event.target.value) })} /></td><td className="p-2 text-center"><input type="checkbox" aria-label={t('kitchen_choice')} checked={entry.kitchen_choice} onChange={(event) => editEntry(index, { kitchen_choice: event.target.checked })} /></td><td className="p-2"><button type="button" className="ops-button-secondary" aria-label={t('remove_entry')} onClick={() => setEntries((current) => current.filter((_, i) => i !== index))}><Trash2 size={16}/></button></td></tr>)}
        </tbody></table>
      </div>
      <button type="button" className="ops-button-secondary" onClick={addEntry}>{t('add_menu_entry')}</button>
      <p className="text-xs text-slate-500">{entries.length} {t('menu_entries_detected')} · {threeChoiceSlots}/{choiceSlots.length} meal slots have three choices · {t('menu_publishes_saturday')}</p>
      {choiceSlots.length > 0 && threeChoiceSlots !== choiceSlots.length && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">The usual menu has three options for each day and meal. Add or remove choices in the editable preview before scheduling if this menu should follow that format.</p>}
      <button className="ops-button flex items-center gap-2" disabled={busy || entries.length < 24 || entries.some((entry) => !entry.name.trim() || entry.kcals < 20)} onClick={() => void publish()}><Upload size={16}/>{t('publish_monthly_menu')}</button>
    </>}
    {documents.length > 0 && <div className="border-t border-slate-100 pt-3"><h3 className="mb-2 text-sm font-bold">{t('published_menu_pdfs')}</h3><div className="space-y-2">{documents.map((document) => <div key={document.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{document.title} · {new Date(document.available_from).toLocaleString(isRtl ? 'ar-QA' : 'en-QA', { timeZone: 'Asia/Qatar', dateStyle: 'medium' })}</span><button className="ops-button-secondary" onClick={() => void openPdf(document.storage_path)}>{t('view_pdf')}</button></div>)}</div></div>}
  </section>;
}

function PageTools({ search, setSearch, placeholder, action }: any) { return <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><label className="relative w-full max-w-lg"><Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="ops-control w-full ps-9" placeholder={placeholder} value={search} onChange={(e) => setSearch(e.target.value)}/></label>{action}</div>; }
function DataTable({ headers, rows, empty }: any) { return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-start text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{headers.map((h: string) => <th key={h} className="px-4 py-3 text-start font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.length ? rows.map((row: any[],i: number) => <tr key={i} className="hover:bg-emerald-50/40">{row.map((cell:any,j:number) => <td key={j} className="px-4 py-3 align-middle">{cell}</td>)}</tr>) : <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-slate-500">{empty}</td></tr>}</tbody></table></div></div>; }
function PauseRequestsSection({ requests, subscribers, saving, review }: any) {
  const rows = requests.map((request: Row) => {
    const customer = subscribers.find((subscriber: Row) => subscriber.id === request.subscriber_id);
    return [<strong>{customer?.full_name || 'Customer'}</strong>, customer?.phone || '—', request.request_type, request.requested_date, request.reason || '—', <div className="flex gap-2"><button disabled={saving} className="ops-button-secondary" onClick={() => review(request.id, 'approved')}>Approve</button><button disabled={saving} className="ops-button-secondary" onClick={() => review(request.id, 'declined')}>Decline</button></div>];
  });
  return <section className="space-y-3"><div><h2 className="text-lg font-bold text-primary">Pause / resume requests</h2><p className="text-sm text-muted">Customer requests requiring CEO/Admin review.</p></div><DataTable headers={['Customer','Phone','Request','From date','Reason','Action']} rows={rows} empty="No pause or resume requests are waiting." /></section>;
}

function Metric({ label, value }: any) { return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-[#0F5D4E]">{value}</p></article>; }
function Status({ value }: { value: string }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(String(value || 'Unknown'))}`}>{value || 'Unknown'}</span>; }
function SectionHeading({ title, helper }: { title: string; helper?: string }) { return <div className="mb-4"><h2 className="font-bold">{title}</h2>{helper && <p className="mt-1 text-sm text-slate-500">{helper}</p>}</div>; }
