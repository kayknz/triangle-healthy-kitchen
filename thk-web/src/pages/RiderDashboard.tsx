import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck, MapPin, CheckCircle, Navigation, MessageSquare,
  LogOut, ShieldAlert, Camera, Clock, Star,
  Bell, Activity, ChevronRight, History, Package, Zap, Loader2,
  Shield, Check, X, Phone, MessageCircle, Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/LanguageContext';

type RiderTab = 'route' | 'history' | 'stats';

export default function RiderDashboard() {
  const { user, signOut, isApprovedRider } = useAuth();
  const { t, isRtl } = useLanguage();
  const [tab, setTab] = useState<RiderTab>('route');
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [presenceSaving, setPresenceSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delivery Confirmation State
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [podPhoto, setPodPhoto] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchOnlineStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('rider_applications')
        .select('is_online')
        .eq('user_id', user.id)
        .maybeSingle();
      setIsOnline(data?.is_online === true);
    } catch (e) {
      console.warn('Status Sync Latency');
    }
  }, [user?.id]);

  const toggleOnline = async () => {
    if (presenceSaving || !user?.id) return;
    const next = !isOnline;
    setPresenceSaving(true);
    try {
      const { error } = await supabase
        .from('rider_applications')
        .update({ is_online: next })
        .eq('user_id', user.id);
      if (!error) setIsOnline(next);
    } catch (e) {
      console.error('Presence Update Failure');
    } finally {
      setPresenceSaving(false);
    }
  };

  const fetchDeliveries = useCallback(async (isSilent = false) => {
    if (!user?.id) return;
    if (!isSilent) setLoading(true);
    try {
      const { data: app } = await supabase
        .from('rider_applications')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!app) return;

      const { data: rows } = await supabase
        .from('rider_deliveries')
        .select('*, subscriber:subscribers(*)')
        .eq('rider_application_id', app.id);

      setDeliveries(rows || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [user?.id]);

  const finalizeDelivery = async () => {
    if (!confirmingId) return;
    setFinalizing(true);
    try {
      let imageUrl = null;

      if (podPhoto) {
        const file = await (await fetch(podPhoto)).blob();
        const fileName = `${confirmingId}-${Date.now()}.jpg`;
        const filePath = `proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('delivery-proof')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('delivery-proof')
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
        }
      }

      const { error } = await supabase.from('rider_deliveries').update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        proof_image_url: imageUrl
      }).eq('id', confirmingId);

      if (error) throw error;

      setDeliveries(current => current.map(d => d.id === confirmingId ? {
        ...d,
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        proof_image_url: imageUrl
      } : d));

      setConfirmingId(null);
      setPodPhoto(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (e: any) {
      alert("Sync Error. Check connection.");
    } finally {
      setFinalizing(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPodPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const fetchData = useCallback((isSilent = false) => {
    fetchDeliveries(isSilent);
    fetchOnlineStatus();
  }, [fetchDeliveries, fetchOnlineStatus]);

  useEffect(() => {
    if (!isOnline || !user?.id) return;
    const reportLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await supabase
            .from('rider_applications')
            .update({
              current_lat: pos.coords.latitude,
              current_lng: pos.coords.longitude,
              last_active_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
        },
        null,
        { enableHighAccuracy: false }
      );
    };
    reportLocation();
    const heartbeat = setInterval(reportLocation, 60000);
    return () => clearInterval(heartbeat);
  }, [isOnline, user?.id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 45000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!isApprovedRider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
         <div className="glass-card p-12 max-w-md border-gold/20 shadow-4xl bg-white">
            <ShieldAlert className="w-16 h-16 text-gold mx-auto mb-8 animate-pulse" />
            <h2 className="text-3xl font-black text-primary uppercase italic mb-6">Credential Review</h2>
            <p className="text-muted italic">Your identity is being verified by Kitchen Ops.</p>
            <button onClick={() => signOut()} className="mt-10 btn-primary w-full py-5 uppercase tracking-widest">Sign Out</button>
         </div>
      </div>
    );
  }

  const activeDeliveries = deliveries.filter(d => d.status === 'pending');
  const historyDeliveries = deliveries.filter(d => d.status !== 'pending');

  return (
    <div className={`min-h-screen bg-background py-32 sm:py-40 px-4 sm:px-6 md:px-12 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20 sm:mb-32">
          <div>
            <div className="badge mb-8 bg-gold/10 border-gold/20 py-2 px-5 text-gold">
              <Activity className="w-3.5 h-3.5 fill-gold animate-glow" />
              <span className="font-black tracking-[0.4em] text-[10px] uppercase">LIVE LOGISTICS — FLEET ID: {user?.id?.slice(0,6).toUpperCase() || 'OFFLINE'}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-primary leading-[0.9] tracking-tighter uppercase italic drop-shadow-lg">
              Route<br />
              <span className="text-[#C5A059]">Intelligence.</span>
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-8">
             <button
                onClick={toggleOnline}
                disabled={presenceSaving}
                className={`w-full lg:w-auto px-12 py-7 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] transition-all shadow-4xl ${
                   isOnline ? 'bg-emerald-600 text-white border-2 border-white/20 scale-105' : 'bg-white text-muted border border-primary/5'
                }`}
             >
                <div className="flex items-center gap-4 justify-center whitespace-nowrap min-w-[200px]">
                   <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-muted'}`} />
                   <span>{presenceSaving ? 'SYNCING...' : isOnline ? 'SIGNAL ACTIVE' : 'SIGNAL OFFLINE'}</span>
                </div>
             </button>
             <div className="flex flex-row bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-2 border border-primary/10 shadow-4xl w-full lg:w-auto justify-center">
               {(['route', 'history', 'stats'] as const).map((tKey) => (
                 <button
                   key={tKey}
                   onClick={() => setTab(tKey)}
                   className={`px-8 sm:px-12 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap ${
                     tab === tKey ? 'bg-primary !text-white shadow-3xl' : 'text-primary/60 hover:text-primary'
                   }`}
                 >
                   {tKey.toUpperCase()}
                 </button>
               ))}
             </div>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-teal" /></div>
        ) : (
          <AnimatePresence mode="wait">
             <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-12">

                {tab === 'route' && (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 sm:gap-20">
                     <div className="space-y-8 sm:space-y-12">
                        <div className="glass-card p-0 bg-white border-primary/5 shadow-4xl relative overflow-hidden h-[500px] group mb-12">
                           {/* Operational Map Visualization */}
                           <div className="absolute inset-0 bg-[#F5F3EB] flex items-center justify-center">
                              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                   style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.832L0 55.458V54.63L54.627 0zm5.373 4.542l-.83-.832L4.54 60h.828L60 5.372v-.83z' fill='%23123F38' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
                              />
                              <div className="text-center relative z-10">
                                 <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-8 animate-pulse">
                                    <MapIcon className="w-10 h-10 text-primary/20 group-hover:scale-110 transition-transform duration-1000" />
                                 </div>
                                 <p className="text-[11px] font-black uppercase tracking-[0.6em] text-primary/40">Doha Projection: Online</p>
                              </div>
                           </div>

                           {/* Dynamic Stop Signal Protocol */}
                           {activeDeliveries.map((d, i) => (
                             <motion.div
                               key={d.id}
                               initial={{ scale: 0, opacity: 0 }}
                               animate={{ scale: 1, opacity: 1 }}
                               transition={{ delay: i * 0.2, type: 'spring' }}
                               className="absolute w-12 h-12 -ml-6 -mt-6 flex flex-col items-center justify-center group/stop cursor-pointer"
                               style={{ top: `${25 + (i * 18)}%`, left: `${20 + (i * 22)}%` }}
                             >
                                <div className="absolute inset-0 bg-gold/30 rounded-full animate-ping group-hover:animate-none group-hover:scale-150 transition-all" />
                                <div className="relative w-5 h-5 bg-gold rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                                   <div className="w-1 h-1 bg-primary rounded-full" />
                                </div>
                                <div className="mt-4 bg-primary text-white text-[8px] font-black px-4 py-2 rounded-xl whitespace-nowrap uppercase tracking-widest shadow-4xl group-hover:bg-gold group-hover:text-primary transition-colors">
                                  OBJ {i + 1} — {d.subscriber?.full_name?.split(' ')[0]}
                                </div>
                             </motion.div>
                           ))}

                           {/* GPS Status HUD */}
                           <div className="absolute bottom-10 left-10 right-10 z-10 flex items-center justify-between">
                              <div className="flex items-center gap-4 bg-primary px-8 py-4 rounded-2xl shadow-4xl border border-white/10">
                                 <Navigation className="w-4 h-4 text-gold animate-pulse" />
                                 <span className="font-black text-[10px] tracking-[0.4em] text-white uppercase">Signal Synchronized</span>
                              </div>
                              <div className="glass-panel px-8 py-4 !rounded-2xl border-primary/10 flex items-center gap-3">
                                 <Activity className="w-4 h-4 text-emerald-500" />
                                 <span className="text-primary text-[10px] font-black uppercase tracking-widest">{activeDeliveries.length} UNITS PENDING</span>
                              </div>
                           </div>
                        </div>

                        {activeDeliveries.length > 0 && (
                           <div className="glass-card p-12 bg-primary text-ivory border-none shadow-4xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-gold/10 transition-all duration-1000" />
                              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                 <div>
                                    <div className="flex items-center gap-3 mb-6">
                                       <div className="w-2 h-2 rounded-full bg-gold animate-glow" />
                                       <p className="text-gold text-[10px] font-black uppercase tracking-[0.4em]">Current Objective</p>
                                    </div>
                                    <h3 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter mb-4 leading-none">Next: {activeDeliveries[0].subscriber?.full_name || 'Customer'}</h3>
                                    <div className="flex items-center gap-4">
                                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ivory/30">{activeDeliveries[0].subscriber?.area || 'DOHA'}</p>
                                       <div className="w-1 h-1 rounded-full bg-ivory/20" />
                                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ivory/30">BUILDING {activeDeliveries[0].subscriber?.building_number || '—'}</p>
                                    </div>
                                 </div>
                                 <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeDeliveries[0].subscriber?.latitude},${activeDeliveries[0].subscriber?.longitude}`}
                                    target="_blank" rel="noreferrer"
                                    className="btn-primary bg-ivory text-primary hover:bg-gold border-none py-7 px-14 scale-105"
                                 >
                                    NAVIGATE
                                 </a>
                              </div>
                           </div>
                        )}

                        <div className="flex items-center justify-between px-2">
                           <h3 className="text-xs font-black uppercase tracking-[0.5em] text-primary/70">Assigned Manifest</h3>
                           <div className="h-px flex-1 mx-8 bg-primary/10" />
                        </div>

                        {activeDeliveries.length === 0 ? (
                           <div className="glass-card p-24 text-center opacity-30 border-dashed border-primary/10 bg-transparent">
                              <Package className="w-16 h-16 mx-auto mb-10 text-primary" />
                              <p className="font-black uppercase tracking-[0.5em] text-[10px] text-primary">Route Manifest Clear</p>
                           </div>
                        ) : (
                           activeDeliveries.map((d) => (
                             <div key={d.id} className="glass-card p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-10 group hover:border-gold/30 transition-all bg-white shadow-xl">
                                <div className="flex items-center gap-8">
                                   <div className="w-20 h-20 rounded-[2rem] bg-primary text-ivory flex items-center justify-center text-3xl font-black italic shadow-4xl group-hover:bg-gold group-hover:text-primary transition-all duration-700">
                                      {(d.subscriber?.full_name || 'C')[0]}
                                   </div>
                                   <div>
                                      <h4 className="text-2xl font-black text-primary uppercase italic tracking-tighter">{d.subscriber?.full_name || 'Customer'}</h4>
                                      <div className="flex gap-4 mt-3">
                                         <span className="pill text-[9px] bg-primary/5 text-primary/40 border-none px-5">{d.subscriber?.area || 'DOHA'}</span>
                                         <span className="pill text-[9px] bg-gold/10 text-gold border-none px-5">{d.time_window || 'ANYTIME'}</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto">
                                   <a
                                      href={`https://www.google.com/maps/dir/?api=1&destination=${d.subscriber?.latitude},${d.subscriber?.longitude}`}
                                      target="_blank" rel="noreferrer"
                                      className="flex-1 md:flex-none w-16 h-16 rounded-[1.5rem] bg-primary/5 text-primary flex items-center justify-center hover:bg-primary hover:text-ivory transition-all shadow-sm"
                                   >
                                      <Navigation className="w-7 h-7" />
                                   </a>
                                   <a
                                      href={`https://wa.me/974${d.subscriber?.phone?.replace(/\D/g,'')}`}
                                      target="_blank" rel="noreferrer"
                                      className="flex-1 md:flex-none w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                   >
                                      <MessageCircle className="w-7 h-7" />
                                   </a>
                                   <button
                                      onClick={() => setConfirmingId(d.id)}
                                      className="flex-1 md:flex-none w-16 h-16 rounded-[1.5rem] bg-gold text-primary flex items-center justify-center hover:scale-110 transition-all shadow-4xl active:scale-95"
                                   >
                                      <CheckCircle className="w-7 h-7" />
                                   </button>
                                </div>
                             </div>
                           ))
                        )}
                     </div>

                     <div className="space-y-10">
                        <div className="glass-card p-12 bg-primary text-ivory relative overflow-hidden border-none shadow-4xl">
                           <div className="absolute inset-0 bg-food-atmosphere opacity-5 grayscale pointer-events-none" />
                           <p className="text-gold text-[10px] font-black uppercase tracking-[0.5em] mb-10 relative z-10">Fleet Status Protocol</p>
                           <div className="space-y-10 relative z-10">
                              <div className="flex items-center gap-6">
                                 <div className={`w-3.5 h-3.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-glow shadow-[0_0_20px_emerald]' : 'bg-red-500'}`} />
                                 <p className="text-lg font-black uppercase italic tracking-widest">{isOnline ? 'Signal Locked' : 'Signal Lost'}</p>
                              </div>
                              <div className="pt-10 border-t border-white/20 grid grid-cols-2 gap-8">
                                 <div>
                                    <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mb-3">Pending</p>
                                    <p className="text-5xl font-black italic tracking-tighter text-white">{activeDeliveries.length}</p>
                                 </div>
                                 <div>
                                    <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mb-3">Efficiency</p>
                                    <p className="text-5xl font-black italic tracking-tighter text-gold">{(deliveries.length > 0 ? (historyDeliveries.length / deliveries.length) * 100 : 0).toFixed(0)}%</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {tab === 'history' && (
                  <div className="space-y-6">
                     {historyDeliveries.length === 0 ? (
                        <div className="glass-card p-20 text-center opacity-40 bg-white shadow-xl">
                           <History className="w-12 h-12 mx-auto mb-6" />
                           <p className="font-black uppercase tracking-widest text-[10px]">No historical data found</p>
                        </div>
                     ) : (
                        historyDeliveries.map(d => (
                           <div key={d.id} className="glass-card p-8 flex items-center justify-between bg-white shadow-lg">
                              <div className="flex items-center gap-6">
                                 <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-teal" /></div>
                                 <div>
                                    <h4 className="text-lg font-black text-primary uppercase italic">{d.subscriber?.full_name || 'Customer'}</h4>
                                    <p className="text-[9px] font-black text-muted mt-1 uppercase">{d.delivery_date} · COMPLETED</p>
                                 </div>
                              </div>
                              <Star className="w-5 h-5 text-gold/20" />
                           </div>
                        ))
                     )}
                  </div>
                )}

                {tab === 'stats' && (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <StatCardSmall icon={Zap} label="Efficiency" value="98.5%" />
                      <StatCardSmall icon={Star} label="Doha Trust" value="4.9/5" />
                      <StatCardSmall icon={Truck} label="Logistics" value={`${historyDeliveries.length} UNITS`} />
                   </div>
                )}

             </motion.div>
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {confirmingId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmingId(null)} className="absolute inset-0 bg-primary/60 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-lg rounded-[3rem] p-12 text-center shadow-4xl border border-primary/5">
              <div className="w-20 h-20 rounded-[2rem] bg-teal flex items-center justify-center mx-auto mb-8 shadow-2xl"><Camera className="w-10 h-10 text-gold" /></div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter text-primary mb-4">Confirm Delivery</h3>
              <p className="text-muted italic mb-10 text-xs">Capture evidence to synchronize with command.</p>
              <div className="grid grid-cols-2 gap-6 mb-10">
                <label className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-primary/10 hover:border-gold/50 cursor-pointer transition-all bg-primary/5 group">
                   <Camera className="w-8 h-8 text-primary/40 group-hover:text-gold mb-3" />
                   <span className="text-[10px] font-black uppercase text-primary/60">Photo POD</span>
                   <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="hidden" />
                </label>
                <button onClick={finalizeDelivery} disabled={finalizing} className="flex flex-col items-center justify-center p-8 rounded-3xl bg-primary text-white hover:bg-gold hover:text-primary transition-all shadow-xl active:scale-95">
                   {finalizing ? <Loader2 className="w-8 h-8 animate-spin" /> : <CheckCircle className="w-8 h-8 mb-3" />}
                   <span className="text-[10px] font-black uppercase">Confirm</span>
                </button>
              </div>
              {podPhoto && (
                <div className="mb-10 rounded-2xl overflow-hidden aspect-video border-2 border-gold/20 shadow-lg">
                  <img src={podPhoto} alt="POD" className="w-full h-full object-cover" />
                </div>
              )}
              <button onClick={() => setConfirmingId(null)} className="text-[10px] font-black uppercase tracking-widest text-primary/30 hover:text-red-500 transition-colors">Abort Protocol</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[300] bg-emerald-600 text-white px-10 py-6 rounded-[2.5rem] shadow-4xl flex items-center gap-4 border-2 border-white/20"
          >
             <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
             </div>
             <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">Signal Received</p>
                <p className="text-sm font-black italic tracking-tighter">MISSION ACCOMPLISHED</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => signOut()} className="fixed bottom-12 right-12 btn-secondary bg-white shadow-2xl py-4 px-8 text-[10px] tracking-[0.3em] font-black z-50 transition-all hover:text-red-500 border border-primary/5">
         <LogOut className="w-4 h-4 mr-3 inline-block" /> TERMINATE SESSION
      </button>
    </div>
  );
}

function StatCardSmall({ icon: Icon, label, value }: any) {
  return (
    <div className="glass-card p-10 bg-white shadow-xl flex flex-col items-center text-center">
       <Icon className="w-8 h-8 text-gold mb-6" />
       <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-2">{label}</p>
       <h4 className="text-4xl font-black text-primary tracking-tighter italic">{value}</h4>
    </div>
  );
}
