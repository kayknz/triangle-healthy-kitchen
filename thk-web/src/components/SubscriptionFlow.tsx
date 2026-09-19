import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Loader2, Navigation, Clock, Sparkles, AlertCircle, CreditCard, X, Banknote,
  Shield, Star, RefreshCcw, Activity, Trophy, ArrowUpRight, Lock, Mail, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { useAuth } from '../lib/auth';
import { PACKAGES } from '../types/booking';
import { useLanguage } from '../lib/LanguageContext';
import SecuringProtocol from './SecuringProtocol';

interface SubscriptionFlowProps {
  open: boolean;
  onClose: () => void;
  preselectedPackage?: string | null;
}

export default function SubscriptionFlow({ open, onClose, preselectedPackage }: SubscriptionFlowProps) {
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const { t, isRtl } = useLanguage();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Biological Metrics
  const [assessment, setAssessment] = useState({
    weight: 75,
    height: 180,
    weightUnit: 'kg' as 'kg' | 'lbs',
    heightUnit: 'cm' as 'cm' | 'ft',
    fitness_goal: 'maintain',
    activity_level: 'moderate',
  });

  // Identity (for unauthenticated users)
  const [identity, setIdentity] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const [pkgId, setPkgId] = useState('');
  const [address, setAddress] = useState({
    building_number: '',
    street: '',
    area: '',
    zone: '',
    latitude: null as number | null,
    longitude: null as number | null,
    delivery_notes: '',
  });

  const [locating, setLocating] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const PAYMENT_METHODS = [
    { id: 'card', label: 'Credit Card', icon: CreditCard, sub: 'Tap Verified' },
    { id: 'applepay', label: 'Apple Pay', icon: Shield, sub: 'Instant Sync' },
    { id: 'cod', label: 'Cash on Delivery', icon: Banknote, sub: 'Doha Logistics' }
  ];

  // Dynamic Steps: Insert Identity if user is not logged in
  const STEPS = [
    { label: t('your_info'), id: 'assessment' },
    { label: t('pick_plan'), id: 'plan' },
    { label: t('delivery_address'), id: 'address' },
    ...(user ? [] : [{ label: t('create_account'), id: 'identity' }]),
    { label: t('payment'), id: 'payment' },
    { label: t('review_start'), id: 'audit' }
  ];

  useEffect(() => {
    if (open) {
      setStep(0);
      setSuccess(false);
      if (preselectedPackage) setPkgId(preselectedPackage);
    }
  }, [open, preselectedPackage]);

  if (!open) return null;

  const pkg = PACKAGES.find((p) => p.id === pkgId);

  const handleNext = () => {
    const currentStepId = STEPS[step].id;
    if (currentStepId === 'assessment' && (!assessment.weight || !assessment.height)) return setError(t('error_metrics'));
    if (currentStepId === 'plan' && !pkgId) return setError(t('error_select_package'));
    if (currentStepId === 'address' && (!address.building_number || !address.street)) return setError('Address details required.');
    if (currentStepId === 'identity' && (!identity.fullName || !identity.email || identity.password.length < 6)) return setError('Account details required. Password must be 6+ characters.');
    if (currentStepId === 'payment' && !termsAccepted) return setError(t('legal_error'));

    setError(null);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const detectLocation = () => {
    setLocating(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Location signal restricted.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setAddress((a) => ({ ...a, latitude, longitude }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            setAddress(prev => ({
              ...prev,
              building_number: addr.house_number || addr.building || addr.office || addr.amenity || '',
              street: addr.road || '',
              area: addr.suburb || addr.neighbourhood || addr.city_district || '',
              zone: addr.postcode || '',
            }));
          }
        } catch (e) { console.warn('Sync latency.'); } finally { setLocating(false); }
      },
      (err) => { setError('Location signal weak. Enter details manually.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubscribe = async () => {
    setSubmitting(true);
    setError(null);

    try {
      let finalUser = user;

      // 1. Background Registration if needed
      if (!user) {
        // SECURITY: Check for existing account/email before attempting signup
        const { data: existingSub } = await supabase
          .from('subscribers')
          .select('id')
          .eq('email', identity.email)
          .maybeSingle();

        if (existingSub) {
          throw new Error("This email is already registered. Please login to manage your plan.");
        }

        const { error: signUpError } = await signUp(identity.email, identity.password, 'subscriber', identity.fullName);
        if (signUpError) throw new Error(signUpError);
        const { data: { user: newUser } } = await supabase.auth.getUser();
        finalUser = newUser;
      }

      if (!finalUser) throw new Error("Connection failed.");

      // 2. Create/Update Subscriber Record
      const { data: subData, error: subError } = await supabase
        .from('subscribers')
        .upsert({
          user_id: finalUser.id,
          full_name: identity.fullName || finalUser.user_metadata?.full_name || 'Member',
          email: finalUser.email,
          package_id: pkg?.id,
          package_name: pkg?.name,
          weight_kg: assessment.weight,
          height_cm: assessment.height,
          fitness_goal: assessment.fitness_goal,
          activity_level: assessment.activity_level,
          building_number: address.building_number,
          street: address.street,
          area: address.area,
          zone_number: address.zone,
          latitude: address.latitude,
          longitude: address.longitude,
          status: 'trialing',
          onboarding_completed: true,
          duration: '4_weeks'
        }, { onConflict: 'user_id' })
        .select('id').single();

      if (subError) throw subError;

      // 3. Initialize Gateway
      const { data: result, error: fetchErr } = await supabase.functions.invoke('tap-checkout', {
        body: {
          package_id: pkg?.id,
          package_name: pkg?.name,
          amount: pkg?.price || 175,
          user_email: finalUser.email,
          user_id: finalUser.id,
          subscriber_id: subData.id,
          success_url: `${window.location.origin}/account?success=true`,
          cancel_url: `${window.location.origin}/plans`
        }
      });

      if (fetchErr) throw fetchErr;
      if (result?.url) window.location.assign(result.url);
      else {
        setSuccess(true);
      }

    } catch (e: any) {
      setError(e.message || "Payment Gateway Offline");
      setSubmitting(false);
    }
  };

  const close = () => {
    setStep(0);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-xl" onClick={close} />

      <div className={`relative bg-[#F5F3EB] w-full max-w-4xl rounded-[3.5rem] shadow-4xl flex flex-col max-h-[92vh] border border-white/20 overflow-hidden animate-reveal ${isRtl ? 'text-right' : 'text-left'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-12 py-10 border-b border-primary/5 bg-white/40 backdrop-blur-md flex-shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div>
            <div className="badge mb-3 bg-gold/10 border-gold/20 text-gold py-1 px-4">
              <Star className="w-3 h-3 fill-gold" />
              <span className="font-black text-[9px] tracking-widest uppercase">Verified Plan</span>
            </div>
            <h2 className="text-primary font-black text-2xl uppercase tracking-tighter italic leading-none">Start your Plan</h2>
          </div>
          <button onClick={close} className="text-muted hover:text-primary p-3 rounded-full hover:bg-white/50 transition-all"><X className="w-8 h-8" /></button>
        </div>

        {/* Progress HUD */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-12 relative min-h-[400px]">
          <AnimatePresence>
            {submitting && <SecuringProtocol message="Preparing your Plan" subtitle="Securely connecting..." />}
          </AnimatePresence>

          {error && <div className="mb-10 bg-red-50 border border-red-100 rounded-[2rem] px-8 py-6 text-red-600 text-xs font-black uppercase tracking-widest flex items-start gap-4"><AlertCircle className="w-5 h-5 shrink-0" /><p>{error}</p></div>}

          {STEPS[step].id === 'assessment' && (
            <div className="space-y-12 animate-reveal">
              <h3 className="text-xl font-black uppercase italic text-primary tracking-tight">{t('your_info')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <MetricPicker label="Weight" value={assessment.weight} unit="KG" min={40} max={150} onChange={(v:any) => setAssessment({...assessment, weight: v})} />
                 <MetricPicker label="Height" value={assessment.height} unit="CM" min={140} max={220} onChange={(v:any) => setAssessment({...assessment, height: v})} />
              </div>
            </div>
          )}

          {STEPS[step].id === 'plan' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-reveal">
               {PACKAGES.map((p) => (
                 <button key={p.id} onClick={() => setPkgId(p.id)} className={`text-left p-6 sm:p-12 rounded-[2.5rem] border-2 transition-all duration-500 relative overflow-hidden group ${pkgId === p.id ? 'border-primary bg-primary text-white shadow-4xl scale-[1.02]' : 'border-primary/5 bg-white/40 hover:border-gold/30 shadow-xl'}`}>
                   <h4 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-1 sm:mb-2 italic">{t(p.id)}</h4>
                   <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-8 sm:mb-10">{p.kcals} KCAL Plan</p>
                   <p className="text-2xl sm:text-3xl font-black italic tracking-tighter">{p.price} <span className="opacity-40 text-xs font-bold uppercase not-italic ml-1">QAR</span></p>
                 </button>
               ))}
            </div>
          )}

          {STEPS[step].id === 'address' && (
            <div className="space-y-12 animate-reveal">
               <h3 className="text-xl font-black uppercase italic text-primary">Delivery Info</h3>
               <button onClick={detectLocation} disabled={locating} className={`w-full flex items-center justify-center gap-4 bg-white border border-primary/10 py-8 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-xl hover:border-gold transition-all active:scale-95 group ${locating ? 'animate-pulse' : ''}`}>
                  {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5 text-gold" />} Find my location
               </button>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3"><p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Building / Unit</p><input type="text" value={address.building_number} onChange={(e) => setAddress({...address, building_number: e.target.value})} placeholder="e.g. Building 12" className="input-field py-7 font-black bg-white/60" /></div>
                  <div className="space-y-3"><p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Street Name</p><input type="text" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} placeholder="e.g. Al-Duhail St" className="input-field py-7 font-black bg-white/60" /></div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3"><p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Zone Number</p><input type="text" value={address.zone} onChange={(e) => setAddress({...address, zone: e.target.value})} placeholder="e.g. 66" className="input-field py-7 font-black bg-white/60" /></div>
                  <div className="space-y-3"><p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Area</p><input type="text" value={address.area} onChange={(e) => setAddress({...address, area: e.target.value})} placeholder="e.g. West Bay" className="input-field py-7 font-black bg-white/60" /></div>
               </div>
            </div>
          )}

          {STEPS[step].id === 'identity' && (
            <div className="space-y-12 animate-reveal">
               <h3 className="text-xl font-black uppercase italic text-primary">Create your Account</h3>
               <div className="space-y-6">
                  <div className="space-y-3"><p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Your Name</p><div className="relative"><User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" /><input type="text" value={identity.fullName} onChange={(e) => setIdentity({...identity, fullName: e.target.value})} placeholder="Enter your full name" className="input-field py-7 pl-16 font-black bg-white/60" /></div></div>
                  <div className="space-y-3"><p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Your Email</p><div className="relative"><Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" /><input type="email" value={identity.email} onChange={(e) => setIdentity({...identity, email: e.target.value})} placeholder="Enter your email" className="input-field py-7 pl-16 font-black bg-white/60" /></div></div>
                  <div className="space-y-3"><p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Your Password (6+ Chars)</p><div className="relative"><Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" /><input type="password" value={identity.password} onChange={(e) => setIdentity({...identity, password: e.target.value})} placeholder="••••••••" className="input-field py-7 pl-16 font-black bg-white/60" /></div></div>
               </div>
            </div>
          )}

          {STEPS[step].id === 'payment' && (
            <div className="space-y-10 animate-reveal">
               <div className="grid grid-cols-1 gap-4">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`flex items-center gap-6 p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${
                        selectedPayment === method.id ? 'border-primary bg-primary text-white shadow-4xl scale-[1.02]' : 'border-primary/5 bg-white/40 hover:border-gold/30'
                      }`}
                    >
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedPayment === method.id ? 'bg-white/10' : 'bg-primary/5'}`}>
                          <method.icon className={`w-7 h-7 ${selectedPayment === method.id ? 'text-gold' : 'text-primary'}`} />
                       </div>
                       <div className="text-left">
                          <p className="text-lg font-black uppercase tracking-tight italic leading-none">{method.label}</p>
                          <p className={`text-[9px] uppercase tracking-[0.2em] mt-2 ${selectedPayment === method.id ? 'text-white/60' : 'text-primary/40'}`}>{method.sub}</p>
                       </div>
                       {selectedPayment === method.id && <div className="ml-auto w-6 h-6 rounded-full bg-gold flex items-center justify-center"><Check className="w-3.5 h-3.5 text-primary" /></div>}
                    </button>
                  ))}
               </div>

               <label className="flex items-start gap-8 mt-12 cursor-pointer group px-4">
                  <button type="button" onClick={() => setTermsAccepted(!termsAccepted)} className={`mt-0.5 w-10 h-10 rounded-[1.2rem] border-2 flex items-center justify-center transition-all ${termsAccepted ? 'border-primary bg-primary shadow-xl scale-110' : 'border-primary/10 group-hover:border-primary/30 bg-white'}`}>
                    {termsAccepted && <Check className="w-6 h-6 text-white" />}
                  </button>
                  <span className="text-primary/40 text-[12px] italic font-medium leading-relaxed pt-1">I agree to the terms and authorize the healthy meal plan.</span>
               </label>
            </div>
          )}

          {STEPS[step].id === 'audit' && (
            <div className="space-y-12 animate-reveal">
               <div className="glass-card p-0 overflow-hidden border-primary/10 bg-white/40 shadow-4xl rounded-[4rem]">
                  <ReviewRow label="Name" value={identity.fullName || user?.user_metadata?.full_name} />
                  <ReviewRow label="Plan Type" value={t(pkg?.id || '')} />
                  <ReviewRow label="Address" value={`${address.building_number}, ${address.area}`} />
               </div>
               <div className="bg-primary rounded-[4rem] p-12 text-white flex items-center justify-between shadow-4xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
                  <div className="relative z-10 flex items-center gap-6">
                    <Shield className="w-16 h-16 text-gold animate-glow" />
                    <div>
                       <p className="text-gold text-[10px] font-black uppercase tracking-[0.5em] mb-2">Ready to start</p>
                       <p className="text-4xl font-black italic tracking-tighter">FINISH & PAY</p>
                    </div>
                  </div>
                  <Banknote className="w-20 h-20 text-white/5 absolute right-[-2rem] top-1/2 -translate-y-1/2" />
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 sm:px-12 py-8 sm:py-12 border-t border-primary/5 flex items-center justify-between bg-white/80 backdrop-blur-md flex-shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-primary/30 hover:text-primary transition-colors disabled:opacity-0 group flex items-center gap-2 active:scale-90"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back</button>
          <button onClick={step === STEPS.length - 1 ? handleSubscribe : handleNext} disabled={submitting} className="btn-primary px-8 sm:px-24 py-5 sm:py-8 text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.5em] shadow-4xl active:scale-95 flex items-center gap-4 sm:gap-6 transition-all group">
            {step === STEPS.length - 1 ? 'START MEALS' : 'PROCEED'}
            <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricPicker({ label, value, min, max, onChange, unit }: any) {
  return (
    <div className="space-y-8 px-4">
      <div className="flex justify-between items-end">
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
