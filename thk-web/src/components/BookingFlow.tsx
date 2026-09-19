import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, X,
  Calendar, User, Phone, Mail, Target, Sparkles, AlertCircle,
  ShieldCheck, Clock, Navigation, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { TIME_SLOTS, FITNESS_GOALS, type BookingData, type Package, PACKAGES } from '../types/booking';
import { useLanguage } from '../lib/LanguageContext';

interface BookingFlowProps {
  open: boolean;
  onClose: () => void;
  preselectedPackage?: string | null;
}

const EMPTY: BookingData = {
  package_id: '',
  package_name: '',
  weight_kg: '',
  height_cm: '',
  fitness_goal: '',
  exercise_routine: '',
  wants_exercise_plan: false,
  dietary_restrictions: '',
  health_notes: '',
  appointment_date: '',
  appointment_time: '',
  client_name: '',
  client_email: '',
  client_phone: '',
  terms_accepted: false,
};

export default function BookingFlow({ open, onClose, preselectedPackage }: BookingFlowProps) {
  const { t, isRtl, language } = useLanguage();

  const STEPS = [
    { label: t('booking_package'), id: 'pkg' },
    { label: t('booking_profile'), id: 'bio' },
    { label: t('booking_date'), id: 'date' },
    { label: t('booking_details'), id: 'id' },
    { label: t('booking_review'), id: 'audit' }
  ];

  const [step, setStep] = useState(0);
  const [data, setData] = useState<BookingData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const detectLocation = () => {
    setLocating(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Location signal not supported by this browser.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const fullAddr = `${addr.house_number || ''} ${addr.road || ''}, ${addr.suburb || addr.city_district || ''}`.trim();
            update({ health_notes: (data.health_notes ? data.health_notes + "\n" : "") + "Location: " + fullAddr });
          } else {
            setLocationError("Address signal weak, please refine manually.");
          }
        } catch (e) {
           setLocationError("Reverse lookup failed.");
        } finally { setLocating(false); }
      },
      (err) => {
         setLocationError('Location access denied.');
         setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchBookedSlots = useCallback(async () => {
    const { data } = await supabase.from('bookings').select('appointment_date, appointment_time').neq('status', 'cancelled');
    if (data) {
      const map: Record<string, string[]> = {};
      for (const b of data) {
        if (!map[b.appointment_date]) map[b.appointment_date] = [];
        map[b.appointment_date].push(b.appointment_time);
      }
      setBookedSlots(map);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchBookedSlots();
      if (preselectedPackage) {
        const pkg = PACKAGES.find((p) => p.id === preselectedPackage);
        if (pkg) setData(d => ({ ...d, package_id: pkg.id, package_name: pkg.name }));
      }
    }
  }, [open, preselectedPackage, fetchBookedSlots]);

  if (!open) return null;

  const pkg = PACKAGES.find((p) => p.id === data.package_id);
  const update = (patch: Partial<BookingData>) => setData((d) => ({ ...d, ...patch }));

  const today = new Date();
  const allowedDates: string[] = [];
  for (let i = 1; i <= 21; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 5) allowedDates.push(d.toISOString().slice(0, 10));
  }

  const handleNext = () => {
    if (step === 1 && (!data.weight_kg || !data.height_cm || !data.fitness_goal)) return setError(t('error_metrics'));
    if (step === 2 && (!data.appointment_date || !data.appointment_time)) return setError(t('error_slot'));
    if (step === 3 && (!data.client_name || !data.client_email || !data.client_phone || !data.terms_accepted)) return setError(t('legal_error'));
    setError(null);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // SECURITY: Check for existing pending bookings for this email
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_email', data.client_email)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingBooking) {
        throw new Error("You already have a pending booking. Please wait for our team to contact you.");
      }

      const { data: result, error: invokeErr } = await supabase.functions.invoke('send-booking-notification', {
        body: { ...data, package_name: pkg?.name ?? data.package_name }
      });
      if (invokeErr) throw invokeErr;
      if (result?.success) setSubmitted(true);
      else throw new Error(result?.error || 'Protocol Failure');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(0);
    setData(EMPTY);
    setSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-xl" onClick={submitted ? undefined : reset} />

      <div className={`relative bg-[#F5F3EB] w-full max-w-4xl rounded-[3.5rem] shadow-4xl flex flex-col max-h-[92vh] border border-white/20 overflow-hidden animate-reveal ${isRtl ? 'text-right' : 'text-left'}`}>

        <div className={`flex items-center justify-between px-12 py-10 border-b border-primary/5 bg-white/40 backdrop-blur-md flex-shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div>
            <div className="badge mb-3 bg-gold/10 border-gold/20 text-gold py-1 px-4">
              <Sparkles className="w-3 h-3 fill-gold" />
              <span className="font-black text-[9px] tracking-widest uppercase">Healthy Chat</span>
            </div>
            <h2 className="text-primary font-black text-2xl uppercase tracking-tighter italic leading-none">{submitted ? 'Done' : 'Book a Session'}</h2>
          </div>
          <button onClick={reset} className="text-muted hover:text-primary p-3 rounded-full hover:bg-white/50 transition-all"><X className="w-8 h-8" /></button>
        </div>

        {!submitted && (
          <div className="px-6 sm:px-12 py-5 bg-gray-50/50 border-b border-primary/5 flex items-center gap-4 overflow-x-auto no-scrollbar">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-3 flex-shrink-0">
                  <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all duration-500 ${step >= i ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-300 border border-gray-100'}`}>
                    {step > i ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${step >= i ? 'text-primary' : 'text-gray-300'}`}>{s.label}</span>
                  {i < STEPS.length - 1 && <div className={`w-6 h-0.5 rounded-full ${step > i ? 'bg-primary' : 'bg-gray-100'}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-12 relative">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
               <div className="w-24 h-24 rounded-[2.5rem] bg-teal flex items-center justify-center mb-10 shadow-4xl rotate-6 animate-reveal">
                  <CheckCircle2 className="w-12 h-12 text-white" />
               </div>
               <h3 className="text-4xl font-serif italic text-primary mb-4 uppercase">Session Booked</h3>
               <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.4em] max-w-sm leading-relaxed mb-12">Our specialist has received your info. Check your email for confirmation.</p>
               <button onClick={reset} className="btn-primary px-16 py-6">RETURN HOME</button>
            </div>
          ) : (
            <>
              {error && <div className="mb-10 bg-red-50 border border-red-100 rounded-3xl px-8 py-6 text-red-600 text-xs font-black uppercase tracking-widest leading-relaxed flex items-start gap-4"><AlertCircle className="w-5 h-5 shrink-0" /><p>{error}</p></div>}

          {step === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-reveal">
               <button onClick={() => update({ package_id: 'undecided', package_name: 'Expert Audit' })} className={`text-left p-6 sm:p-12 rounded-[2.5rem] border-2 transition-all duration-500 relative overflow-hidden group ${data.package_id === 'undecided' ? 'border-gold bg-gold text-white shadow-2xl' : 'border-primary/5 bg-white/40 hover:border-gold/40 shadow-xl'}`}>
                  <h4 className="text-xl sm:text-2xl font-black uppercase italic mb-1 sm:mb-2">Not Sure</h4>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] opacity-60">General Healthy Audit</p>
               </button>
               {PACKAGES.map(p => (
                 <button key={p.id} onClick={() => update({ package_id: p.id, package_name: p.name })} className={`text-left p-6 sm:p-12 rounded-[2.5rem] border-2 transition-all duration-500 relative overflow-hidden group ${data.package_id === p.id ? 'border-primary bg-primary text-white shadow-2xl' : 'border-primary/5 bg-white/40 hover:border-gold/40 shadow-xl'}`}>
                    <h4 className="text-xl sm:text-2xl font-black uppercase italic mb-1 sm:mb-2">{t(p.id)}</h4>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{p.kcals} KCAL Target</p>
                 </button>
               ))}
            </div>
          )}

              {step === 1 && (
                <div className="space-y-12">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <MetricPicker label="Weight" value={data.weight_kg} unit="KG" min={40} max={150} onChange={(v: number) => update({ weight_kg: String(v) })} />
                      <MetricPicker label="Height" value={data.height_cm} unit="CM" min={140} max={220} onChange={(v: number) => update({ height_cm: String(v) })} />
                   </div>
                   <div className="space-y-8 pt-8">
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 ml-2">Transformation Objective</p>
                      <div className="grid grid-cols-3 gap-4">
                        {FITNESS_GOALS.map(g => (
                          <button key={g} onClick={() => update({ fitness_goal: g })} className={`py-6 rounded-3xl text-[10px] font-black uppercase border-2 transition-all ${data.fitness_goal === g ? 'bg-primary border-primary text-white shadow-xl scale-105' : 'bg-white border-primary/5 text-primary/30 hover:border-primary/20'}`}>{t(g)}</button>
                        ))}
                      </div>
                   </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-12">
                   <h3 className="text-xl font-black uppercase italic text-primary tracking-tight">Audit Schedule</h3>
                   <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                      {allowedDates.slice(0, 16).map(d => (
                        <button key={d} onClick={() => update({ appointment_date: d, appointment_time: '' })} className={`flex flex-col items-center py-6 rounded-3xl border-2 transition-all ${data.appointment_date === d ? 'bg-primary border-primary text-white shadow-xl scale-110' : 'bg-white border-primary/5 text-primary/20 hover:border-primary/20'}`}>
                           <span className="text-[9px] font-black uppercase tracking-tighter">{new Date(d).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                           <span className="text-2xl font-black mt-2 leading-none">{new Date(d).getDate()}</span>
                        </button>
                      ))}
                   </div>
                   {data.appointment_date && (
                     <div className="grid grid-cols-3 gap-6 animate-in">
                        {TIME_SLOTS.filter(s => !bookedSlots[data.appointment_date]?.includes(s)).map(s => (
                          <button key={s} onClick={() => update({ appointment_time: s })} className={`py-6 rounded-[1.5rem] text-[11px] font-black border-2 transition-all ${data.appointment_time === s ? 'bg-gold border-gold text-white shadow-xl scale-105' : 'bg-white border-primary/5 text-primary/30 hover:border-gold/20'}`}>{s}</button>
                        ))}
                     </div>
                   )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                   <h3 className="text-xl font-black uppercase italic text-primary tracking-tight">Your Details</h3>
                   <div className="space-y-6">
                      <div className="flex flex-col gap-4">
                        <button
                          onClick={detectLocation}
                          disabled={locating}
                          className={`w-full flex items-center justify-center gap-4 bg-white border border-primary/10 py-6 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-sm hover:border-gold transition-all active:scale-95 disabled:opacity-50 ${locating ? 'animate-pulse' : ''}`}
                        >
                          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 text-gold" />}
                          {locating ? 'Checking...' : 'Find my location (Optional)'}
                        </button>
                        {locationError && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-4">{locationError}</p>}
                      </div>
                      <input type="text" placeholder="Enter Full Name" value={data.client_name} onChange={e => update({ client_name: e.target.value })} className="input-field py-8 text-xl font-black bg-white shadow-sm" />
                      <input type="email" placeholder="Enter Email Address" value={data.client_email} onChange={e => update({ client_email: e.target.value })} className="input-field py-8 text-xl font-black bg-white shadow-sm" />
                      <input type="tel" placeholder="Mobile Number (+974)" value={data.client_phone} onChange={e => update({ client_phone: e.target.value })} className="input-field py-8 text-xl font-black bg-white shadow-sm" />
                   </div>
                   <label className="flex items-start gap-8 mt-12 cursor-pointer group px-4">
                      <button type="button" onClick={() => update({ terms_accepted: !data.terms_accepted })} className={`mt-0.5 w-10 h-10 rounded-[1.2rem] border-2 flex items-center justify-center transition-all ${data.terms_accepted ? 'border-primary bg-primary shadow-xl scale-110' : 'border-primary/10 group-hover:border-primary/30 bg-white'}`}>
                        {data.terms_accepted && <Check className="w-6 h-6 text-white" />}
                      </button>
                      <span className="text-primary/40 text-[12px] italic font-medium leading-relaxed pt-1">I authorize the consultation and agree to the privacy terms.</span>
                   </label>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-12">
                   <div className="glass-card p-0 overflow-hidden border-primary/10 bg-white/40 shadow-4xl rounded-[4rem]">
                      <ReviewRow label="Plan" value={t(data.package_id) || data.package_name} />
                      <ReviewRow label="Time" value={`${data.appointment_date} @ ${data.appointment_time}`} />
                      <ReviewRow label="Name" value={data.client_name} />
                   </div>
                   <div className="bg-primary rounded-[3rem] p-12 text-white flex items-center justify-between shadow-4xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl" />
                      <div className="relative z-10 flex items-center gap-6">
                        <ShieldCheck className="w-12 h-12 text-gold animate-glow" />
                        <div>
                          <p className="text-gold text-[10px] font-black uppercase tracking-[0.4em] mb-1">Final Authorization</p>
                          <p className="text-2xl font-black italic tracking-tighter">BOOK NOW</p>
                        </div>
                      </div>
                      <Activity className="w-16 h-16 text-white/5 absolute right-[-2rem] top-1/2 -translate-y-1/2" />
                   </div>
                </div>
              )}
            </>
          )}
        </div>

        {!submitted && (
          <div className={`px-6 sm:px-12 py-8 sm:py-12 border-t border-primary/5 flex items-center justify-between bg-white/80 backdrop-blur-md flex-shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-primary/30 hover:text-primary transition-colors disabled:opacity-0 group flex items-center gap-2 active:scale-90"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back</button>
            <button onClick={step === STEPS.length - 1 ? submit : handleNext} disabled={submitting} className="btn-primary px-8 sm:px-24 py-5 sm:py-8 text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.5em] shadow-4xl active:scale-95 flex items-center gap-4 sm:gap-6 transition-all group">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : step === STEPS.length - 1 ? 'AUTHORIZE' : 'PROCEED'}
              <ArrowRight className={`w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-2 transition-transform`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricPicker({ label, value, min, max, onChange, unit }: any) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end px-4">
         <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/40">{label}</p>
         <p className="text-5xl font-serif italic text-primary leading-none tracking-tighter">{value || 0}<span className="text-[10px] not-italic font-black ml-3 uppercase opacity-20 tracking-widest">{unit}</span></p>
      </div>
      <input type="range" min={min} max={max} value={value || 0} onChange={e => onChange(parseInt(e.target.value))} className="w-full accent-gold bg-primary/5 h-2.5 rounded-full appearance-none cursor-pointer" />
    </div>
  );
}

function ReviewRow({ label, value }: any) {
  return (
    <div className="flex justify-between gap-8 px-12 py-10 border-b border-primary/5 last:border-0 hover:bg-primary/[0.02] transition-colors">
      <span className="text-primary/40 text-[11px] font-black uppercase tracking-[0.4em]">{label}</span>
      <span className="text-primary text-lg font-black uppercase italic tracking-tighter">{value}</span>
    </div>
  );
}
