import { useState, useEffect, useCallback } from 'react';
import {
  Truck, MapPin, Phone, CheckCircle2, Loader2, LogOut,
  Navigation, Camera, Package, Clock, AlertCircle, ShieldAlert,
  MessageSquare, Power, EyeOff
} from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Camera as NativeCamera, CameraResultType } from '@capacitor/camera';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { getQatarDate, addDays } from '@/lib/date-utils';

interface Delivery {
  id: string;
  subscriber_id: string;
  client_name: string;
  client_phone: string;
  area: string;
  building: string;
  street: string;
  zone: string;
  notes: string | null;
  status: 'pending' | 'delivered';
  time_window: string;
  delivery_date: string;
  meal_type: string;
}

interface RiderDashboardProps {
  onExit: () => void;
}

export default function RiderDashboard({ onExit }: RiderDashboardProps) {
  const { signOut, user, isApprovedRider, refreshAuth } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');
  const [completing, setCompleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [syncingStatus, setSyncingStatus] = useState(false);

  // Fetch initial online status
  useEffect(() => {
    if (!user) return;
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('rider_applications')
        .select('is_online')
        .eq('user_id', user.id)
        .single();
      if (data) setIsOnline(!!data.is_online);
    };
    fetchStatus();
  }, [user]);

  const toggleOnlineStatus = async () => {
    if (!user || syncingStatus) return;
    setSyncingStatus(true);
    const newStatus = !isOnline;

    await Haptics.impact({ style: ImpactStyle.Medium });

    const { error: syncError } = await supabase
      .from('rider_applications')
      .update({
        is_online: newStatus,
        last_active_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (!syncError) {
      setIsOnline(newStatus);
    }
    setSyncingStatus(false);
  };

  const fetchRoutes = useCallback(async () => {
    if (!user || !isApprovedRider) return;
    setLoading(true);
    setError(null);

    const date = new Date();
    const targetDate = selectedDate === 'tomorrow'
      ? getQatarDate(addDays(date, 1))
      : getQatarDate(date);

    const { data, error: fetchError } = await supabase
      .from('rider_deliveries')
      .select(`
        id,
        subscriber_id,
        status,
        time_window,
        notes,
        delivery_date,
        meal_type,
        subscribers (
          full_name,
          phone,
          area,
          building_number,
          street,
          zone_number,
          delivery_notes
        )
      `)
      .eq('rider_user_id', user.id)
      .eq('delivery_date', targetDate)
      .order('assigned_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setDeliveries([]);
    } else {
      setDeliveries((data || []).map((route: any) => {
        const subscriber = route.subscribers || {};
        return {
          id: route.id,
          subscriber_id: route.subscriber_id,
          client_name: subscriber.full_name || 'Customer',
          client_phone: subscriber.phone || '+974 0000 0000',
          area: subscriber.area || 'Doha',
          building: subscriber.building_number || '-',
          street: subscriber.street || '-',
          zone: subscriber.zone_number || '-',
          notes: route.notes || subscriber.delivery_notes,
          status: route.status,
          time_window: route.time_window || '12-2 PM',
          delivery_date: route.delivery_date,
          meal_type: route.meal_type,
        };
      }));
    }

    setLoading(false);
  }, [user, isApprovedRider, selectedDate]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  // Diamond Tier: Real-time GPS Sync
  useEffect(() => {
    if (!user || !isApprovedRider) return;

    const syncLocation = () => {
      if (!navigator.geolocation || !isOnline) return;

      navigator.geolocation.getCurrentPosition(async (pos) => {
        await supabase
          .from('rider_applications')
          .update({
            current_lat: pos.coords.latitude,
            current_lng: pos.coords.longitude,
            last_active_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }, null, { enableHighAccuracy: true });
    };

    const interval = setInterval(syncLocation, 30000); // Every 30s
    syncLocation();

    return () => clearInterval(interval);
  }, [user, isApprovedRider]);

  const confirmDelivery = async (deliveryId: string) => {
    if (!isOnline) {
      setError("You must be online to confirm deliveries.");
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Light });

      // Task 3: Native Camera Integration
      const image = await NativeCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64
      });

      if (!image) return;

      const originalDeliveries = [...deliveries];
      // Optimistic Update: Remove from list immediately
      setDeliveries((prev) => prev.filter((d) => d.id !== deliveryId));
      setCompleting(deliveryId);
      setError(null);

      // 1. Upload to Supabase Storage
      const fileName = `${deliveryId}_${Date.now()}.jpg`;
      const filePath = `deliveries/${deliveryId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('delivery-proofs')
        .upload(filePath, decode(image.base64String!), {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`);

      // 2. Register Path in Database
      const { error: updateError } = await supabase
        .from('rider_deliveries')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          proof_storage_path: filePath,
        })
        .eq('id', deliveryId);

      if (updateError) {
        // Cleanup storage on DB failure
        await supabase.storage.from('delivery-proofs').remove([filePath]);
        setError(updateError.message);
        setDeliveries(originalDeliveries);
      }
    } catch (e: any) {
      // User cancelled camera or other error
      if (e.message !== 'User cancelled photos app') {
        setError("Camera error: " + e.message);
      }
    } finally {
      setCompleting(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onExit();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAuth();
    setRefreshing(false);
  };

  const whatsappCustomer = (d: Delivery) => {
    const message = `Hi ${d.client_name}! This is Triangle Healthy Kitchen. I'm on my way with your ${d.meal_type.toUpperCase()} delivery!`;

    // Ensure Qatar country code if missing
    let phone = d.client_phone.replace(/[^0-9]/g, '');
    if (phone.length === 8) phone = '974' + phone;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
  };

  if (!isApprovedRider) {
    return (
      <div className="min-h-screen bg-[#0a3030] flex items-center justify-center px-6 safe-top">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-amber-400/10 border-2 border-amber-400/30 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-white font-bold text-2xl mb-3">Account Pending</h1>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            Your rider account has been created successfully. For security, an admin must approve your access before you can view delivery routes.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full bg-[#D4A843] hover:bg-[#c09535] text-[#0a3030] font-bold py-3 rounded-full transition-all flex items-center justify-center gap-2"
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Check Approval Status
            </button>
            <button
              onClick={handleSignOut}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-full border border-white/10 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071f1f]">
      <header className="bg-[#0a2828] border-b border-white/10 sticky top-0 z-40 safe-top shadow-xl">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <Truck className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-black text-xs uppercase tracking-[0.2em] mb-1.5">Rider Portal</p>
              <div className="flex bg-[#071f1f] rounded-xl p-1 border border-white/5 shadow-lg">
                {['today', 'tomorrow'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d as any)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-widest ${
                      selectedDate === d ? 'bg-[#D4A843] text-[#0a3030] shadow-md scale-105' : 'text-white/30 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleOnlineStatus}
              disabled={syncingStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-[10px] uppercase tracking-wider transition-all border shadow-lg ${
                isOnline
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-red-500/20 border-red-500/40 text-red-400'
              }`}
            >
              {syncingStatus ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Power className={`w-3 h-3 ${isOnline ? 'animate-pulse' : ''}`} />
              )}
              {isOnline ? 'Online' : 'Offline'}
            </button>
            <button
              onClick={async () => {
                await Haptics.impact({ style: ImpactStyle.Light });
                fetchRoutes();
              }}
              className="p-2.5 text-white/30 hover:text-[#D4A843] transition-colors rounded-full hover:bg-white/5"
              title="Refresh Routes"
            >
              <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin text-[#D4A843]' : ''}`} />
            </button>
            <button
              onClick={async () => {
                await Haptics.impact({ style: ImpactStyle.Light });
                signOut();
                onExit();
              }}
              className="p-2.5 text-white/30 hover:text-red-400 transition-colors rounded-full hover:bg-white/5"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-xl flex items-center gap-2">
            <Navigation className="w-5 h-5 text-[#D4A843]" />
            Your Route {selectedDate === 'today' ? 'Today' : 'Tomorrow'}
          </h2>
          <span className="bg-white/5 text-white/40 text-xs px-3 py-1 rounded-full border border-white/10">
            {deliveries.filter(d => d.status === 'pending').length} stops remaining
          </span>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {!isOnline ? (
          <div className="text-center py-32 bg-[#0a2828] rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-500/5 opacity-50"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <EyeOff className="w-10 h-10 text-red-400 opacity-50" />
              </div>
              <h3 className="text-white font-black text-2xl mb-3">You are Offline</h3>
              <p className="text-white/40 text-sm max-w-[240px] mx-auto leading-relaxed mb-10">
                Go online to view your routes and start confirming deliveries.
              </p>
              <button
                onClick={toggleOnlineStatus}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-10 py-4 rounded-full text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-95"
              >
                Start Shift
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin" />
            <p className="text-white/40 text-sm">Loading your route...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-20 bg-[#0a2828] rounded-3xl border border-dashed border-white/10">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4 opacity-20" />
            <p className="text-white/40">No pending deliveries assigned for {selectedDate}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((d, i) => (
              <div key={d.id} className="bg-[#0a2828] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 font-bold text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{d.client_name}</h3>
                        <p className="text-white/40 text-xs flex items-center gap-1 capitalize">
                          <Clock className="w-3 h-3" /> {d.meal_type} - {d.time_window}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`tel:${d.client_phone}`}
                      className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <div className="w-12 h-12 rounded-xl bg-[#D4A843]/10 flex flex-col items-center justify-center text-[#D4A843] border border-[#D4A843]/20 flex-shrink-0">
                        <span className="text-[10px] uppercase font-bold leading-none mb-1">Zone</span>
                        <span className="text-xl font-black leading-none">{d.zone}</span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg leading-tight mb-1">{d.area}</p>
                        <p className="text-white/50 text-xs flex items-center gap-2">
                          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">Bldg {d.building}</span>
                          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">Street {d.street}</span>
                        </p>
                      </div>
                    </div>
                    {d.notes && (
                      <div className="flex items-start gap-3 bg-amber-400/5 border border-amber-400/10 p-3 rounded-2xl">
                        <AlertCircle className="w-4 h-4 text-amber-400/70 flex-shrink-0 mt-0.5" />
                        <p className="text-amber-400/60 text-xs italic leading-relaxed">
                          "{d.notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => whatsappCustomer(d)}
                      className="w-14 h-14 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-2xl transition-all border border-emerald-500/20 active:scale-90"
                      title="WhatsApp Customer"
                    >
                      <MessageSquare className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${d.building} ${d.street} ${d.zone} ${d.area}`)}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl text-sm transition-all border border-white/10 active:scale-[0.98]"
                    >
                      <Navigation className="w-5 h-5 text-[#D4A843]" />
                      Navigate
                    </button>
                    <button
                      onClick={() => confirmDelivery(d.id)}
                      disabled={!!completing || !isOnline}
                      className="flex-[1.5] flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl text-sm transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                    >
                      {completing === d.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-5 h-5" />
                          Confirm Delivery
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-10 text-center opacity-20">
        <Package className="w-6 h-6 mx-auto mb-2" />
        <p className="text-[10px] uppercase tracking-widest text-white">Triangle Logistics Qatar</p>
      </footer>
    </div>
  );
}
