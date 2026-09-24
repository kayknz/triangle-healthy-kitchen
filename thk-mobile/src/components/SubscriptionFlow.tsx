import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Loader2, Navigation, CreditCard, X, Banknote,
  Shield, Star, RefreshCcw, Activity, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeHaptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { invokeFunction } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PACKAGES } from '@/types/booking';
import { useLanguage } from '@/lib/LanguageContext';
import EditorialPanel, { SecuringProtocol } from './EditorialPanel';

interface SubscriptionFlowProps {
  open: boolean;
  onClose: () => void;
  preselectedPackage?: string | null;
}

export default function SubscriptionFlow({ open, onClose, preselectedPackage }: SubscriptionFlowProps) {
  const { user, signUp } = useAuth();
  const { t, isRtl } = useLanguage();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [assessment, setAssessment] = useState({
    weight: 75,
    height: 180,
    fitness_goal: 'maintain',
    activity_level: 'moderate',
  });

  const [pkgId, setPkgId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [address, setAddress] = useState({
    building_number: '',
    street: '',
    area: '',
    zone: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [locating, setLocating] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const PAYMENT_METHODS = [
    { id: 'card', label: 'Credit Card', icon: CreditCard, sub: 'Tap Verified' },
    { id: 'applepay', label: 'Apple Pay', icon: Shield, sub: 'Instant Sync' },
    { id: 'cod', label: 'Cash on Delivery', icon: Banknote, sub: 'Doha Logistics' }
  ];

  const getSteps = () => {
    const base = [
      { label: 'Your Info', id: 'assessment' },
      { label: 'Pick Plan', id: 'plan' },
      { label: 'Duration', id: 'duration' },
      { label: 'Delivery Address', id: 'address' },
    ];
    if (!user) {
      base.push({ label: 'Create Account', id: 'identity' });
    }
    base.push(
      { label: 'Payment', id: 'payment' },
      { label: 'Review', id: 'audit' }
    );
    return base;
  };

  const STEPS = getSteps();

  const calculateMacros = () => {
    const w = assessment.weight;
    const h = assessment.height;
    if (!w || !h) return null;
    const bmr = 10 * w + 6.25 * h - 5 * 30;
    const tdee = bmr * 1.5;
    const target = assessment.fitness_goal === 'lose' ? tdee * 0.8 : assessment.fitness_goal === 'gain' ? tdee * 1.2 : tdee;
    return { target: Math.round(target) };
  };

  const macroResults = calculateMacros();

  useEffect(() => {
    if (open) {
      setStep(0);
      setSuccess(false);
      if (preselectedPackage) setPkgId(preselectedPackage);
    }
  }, [open, preselectedPackage]);

  if (!open) return null;

  const pkg = PACKAGES.find((p) => p.id === pkgId);
  const currentStep = STEPS[step];

  const handleNext = async () => {
    await safeHaptics.impact();
    if (currentStep.id === 'assessment' && (!assessment.weight || !assessment.height)) return setError(t('error_metrics') || 'Please enter weight and height.');
    if (currentStep.id === 'plan' && !pkgId) return setError(t('error_select_package') || 'Please select a package.');
    if (currentStep.id === 'address' && (!address.building_number || !address.street)) return setError('Building number and street are required.');
    if (currentStep.id === 'identity' && (!email || !password)) return setError(t('error_email') || 'Please enter email and password.');
    if (currentStep.id === 'payment' && !termsAccepted) return setError(t('legal_error') || 'Please accept terms to proceed.');
    setError(null);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const detectLocation = () => {
    setLocating(true);
    setError(null);
    if (!navigator.geolocation) {
       setError("Location access denied on your device.");
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
              building_number: addr.house_number || addr.building || addr.amenity || '',
              street: addr.road || '',
              area: addr.suburb || addr.neighbourhood || addr.city_district || '',
              zone: addr.postcode || '',
            }));
          } else {
            setError("Could not automatically locate address, please enter manually.");
          }
        } catch (e) {
           console.warn('Coordinates locked.');
           setError("Could not automatically locate address, please enter manually.");
        } finally { setLocating(false); }
      },
      (err) => {
         setError('Location access denied. Please enter details manually.');
         setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubscribe = async () => {
    await safeHaptics.impact();

    let activeUser = user;
    setSubmitting(true);
    setError(null);

    try {
      if (!activeUser) {
        const { error: signUpErr } = await signUp(email, password, 'Triangle Member', 'subscriber');
        if (signUpErr) throw new Error(signUpErr);

        const { data: { user: newUser } } = await supabase.auth.getUser();
        activeUser = newUser;
      }

      if (!activeUser) throw new Error("Identity verification failed.");

      const { data: subData, error: subError } = await supabase
        .from('subscribers')
        .upsert({
          user_id: activeUser.id,
          full_name: activeUser.user_metadata?.full_name || 'Triangle Member',
          email: activeUser.email,
          package_id: pkg?.id,
          package_name: pkg?.name,
          weight_kg: assessment.weight,
          height_cm: assessment.height,
          fitness_goal: assessment.fitness_goal,
          building_number: address.building_number,
          street: address.street,
          area: address.area,
          latitude: address.latitude,
          longitude: address.longitude,
          status: 'trialing',
          duration: pkg?.duration || '4_weeks',
          onboarding_completed: true
        }, { onConflict: 'user_id' })
        .select('id').single();

      if (subError) throw subError;

      const { data: result, error: fetchErr } = await invokeFunction<{ checkout_url?: string }>('tap-checkout', {
        packageId: pkg?.id,
        subscriberId: subData.id,
      });

      if (fetchErr) throw fetchErr;
      if (!result?.checkout_url) throw new Error('Payment gateway did not return a checkout link.');
      window.location.assign(result.checkout_url);

    } catch (e: any) {
      setError(e.message || "Gateway Offline");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EditorialPanel
      isOpen={open}
      onClose={onClose}
      title="Start your Plan"
      badge="Verified Member"
    >
      <div className="flex flex-col h-full overflow-hidden">
        <AnimatePresence>
          {(submitting || error || success) && (
            <div className="absolute inset-0 z-50 bg-[#F5F3EB]">
              {success ? (
                <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-[#0a3030] flex items-center justify-center mb-8 shadow-2xl">
                    <Check className="w-12 h-12 text-[#C5A059]" />
                  </div>
                  <h3 className="text-3xl font-black uppercase italic text-[#0a3030] tracking-tighter mb-4">Subscription Confirmed!</h3>
                  <p className="text-gray-500 font-medium mb-12 max-w-sm leading-relaxed">
                    You can now select your menu from your Dashboard.
                  </p>
                  <button
                    onClick={() => { onClose(); window.location.hash = 'account'; }}
                    className="btn-primary w-full max-w-xs uppercase tracking-[0.3em] py-6 shadow-4xl"
                  >
                    Go to Menu Selection
                  </button>
                </div>
              ) : (
                <SecuringProtocol
                  message={submitting ? "Starting Plan" : "Error"}
                  subtitle={submitting ? "Connecting..." : null}
                  error={error ?? undefined}
                  onRetry={() => { setError(null); setSubmitting(false); }}
                />
              )}
            </div>
          )}
        </AnimatePresence>

        {/* Progress HUD */}
        <div className="px-6 py-5 bg-gray-50/50 border-b border-primary/5 flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x">
           {STEPS.map((s, i) => (
             <div key={i} className="flex items-center gap-3 flex-shrink-0 snap-start">
                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all duration-500 ${step >= i ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-300 border border-gray-100'}`}>
                  {step > i ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap ${step >= i ? 'text-primary' : 'text-gray-300'}`}>{s.label}</span>
                {i < STEPS.length - 1 && <div className={`w-6 h-0.5 rounded-full ${step > i ? 'bg-primary' : 'bg-gray-100'}`} />}
             </div>
           ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-10 relative">
          {currentStep.id === 'assessment' && (
            <div className="space-y-12">
              <h3 className="text-xl font-black uppercase italic text-primary tracking-tight">Your Health Info</h3>
              <div className="space-y-16">
                 <MetricPicker label="Weight" value={assessment.weight} unit="KG" min={40} max={150} onChange={(v:any) => setAssessment({...assessment, weight: v})} />
                 <MetricPicker label="Height" value={assessment.height} unit="CM" min={140} max={220} onChange={(v:any) => setAssessment({...assessment, height: v})} />
              </div>
            </div>
          )}

          {currentStep.id === 'plan' && (
            <div className="grid grid-cols-1 gap-6">
               {PACKAGES.map((p) => (
                 <button key={p.id} onClick={() => setPkgId(p.id)} className={`text-left p-12 rounded-[3.5rem] border-2 transition-all duration-500 relative overflow-hidden group ${pkgId === p.id ? 'border-primary bg-primary text-white shadow-4xl scale-[1.02]' : 'border-primary/5 bg-white/40 hover:border-gold/30 shadow-xl'}`}>
                   <h4 className="text-2xl font-black uppercase tracking-tight mb-2 italic">{t(p.id)}</h4>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-10">{p.kcals} KCAL / Day</p>
                   <p className="text-3xl font-black italic tracking-tighter leading-none">{p.price} <span className="opacity-40 text-xs font-bold uppercase not-italic ml-1">QAR</span></p>
                 </button>
               ))}
            </div>
          )}

          {currentStep.id === 'duration' && (
            <div className="space-y-12">
               <h3 className="text-xl font-black uppercase italic text-primary">Plan Duration</h3>
               <div className="grid grid-cols-1 gap-6">
                  <div className="p-10 rounded-[3rem] border-2 border-primary bg-primary/5 text-primary shadow-xl">
                     <p className="text-2xl font-black uppercase italic tracking-tighter mb-2">28 Days</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-gold">4-Week Healthy Plan</p>
                  </div>
               </div>
            </div>
          )}

          {currentStep.id === 'address' && (
            <div className="space-y-12 animate-reveal">
               <div className="flex flex-col gap-6">
                  <h3 className="text-xl font-black uppercase italic text-primary">Delivery Address</h3>
                  <button
                    onClick={detectLocation}
                    disabled={locating}
                    className={`w-full flex items-center justify-center gap-4 bg-white border border-primary/10 py-8 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-xl active:scale-95 group disabled:opacity-50 ${locating ? 'animate-pulse' : ''}`}
                  >
                    {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5 text-[#C5A059] group-hover:animate-pulse" />}
                    {locating ? 'Checking...' : 'Find my location'}
                  </button>
               </div>

               <div className="grid grid-cols-1 gap-6 pt-8 border-t border-primary/5">
                  <div className="space-y-3">
                     <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Building / Unit</p>
                     <input type="text" placeholder="BUILDING NUMBER" value={address.building_number} onChange={(e) => setAddress({...address, building_number: e.target.value})} className="input-field py-7 font-black bg-white/60" />
                  </div>
                  <div className="space-y-3">
                     <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Street Name</p>
                     <input type="text" placeholder="STREET NAME" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} className="input-field py-7 font-black bg-white/60" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Zone</p>
                       <input type="text" placeholder="ZONE" value={address.zone} onChange={(e) => setAddress({...address, zone: e.target.value})} className="input-field py-7 font-black bg-white/60" />
                    </div>
                    <div className="space-y-3">
                       <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Area</p>
                       <input type="text" placeholder="AREA" value={address.area} onChange={(e) => setAddress({...address, area: e.target.value})} className="input-field py-7 font-black bg-white/60" />
                    </div>
                  </div>
                  {(!address.building_number || !address.street) && !locating && (
                    <p className="text-[9px] font-bold text-gold uppercase tracking-widest animate-pulse ml-2">
                      Please enter your address to proceed.
                    </p>
                  )}
               </div>
            </div>
          )}

          {currentStep.id === 'identity' && (
            <div className="space-y-12">
               <h3 className="text-xl font-black uppercase italic text-primary">Create Account</h3>
               <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-3">
                     <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Email</p>
                     <input type="email" placeholder="EMAIL ADDRESS" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field py-7 font-black bg-white/60" />
                  </div>
                  <div className="space-y-3">
                     <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Password</p>
                     <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field py-7 font-black bg-white/60" />
                  </div>
               </div>
            </div>
          )}

          {currentStep.id === 'payment' && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 gap-4">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`flex items-center gap-6 p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${
                        selectedPayment === method.id ? 'border-primary bg-primary text-white shadow-4xl scale-[1.02]' : 'border-primary/5 bg-white/40'
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
                  <button type="button" onClick={() => setTermsAccepted(!termsAccepted)} className={`mt-0.5 w-10 h-10 rounded-[1.2rem] border-2 flex items-center justify-center transition-all ${termsAccepted ? 'border-primary bg-primary shadow-xl scale-110' : 'border-primary/10 bg-white'}`}>
                    {termsAccepted && <Check className="w-6 h-6 text-white" />}
                  </button>
                  <span className="text-primary/40 text-[12px] italic font-medium leading-relaxed pt-1">I agree to the terms and the auto-renewal billing cycles.</span>
                </label>
            </div>
          )}

          {currentStep.id === 'audit' && (
            <div className="space-y-10">
               <div className="glass-card p-0 overflow-hidden border-primary/10 bg-white/40 shadow-4xl rounded-[4rem]">
                  <ReviewRow label="Selected Plan" value={t(pkg?.id || '')} />
                  <ReviewRow label="Meal Cycle" value="28 Days" />
               </div>
               <div className="bg-primary rounded-[4rem] p-12 text-white flex items-center justify-between shadow-4xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full blur-[80px]" />
                  <div className="relative z-10"><p className="text-gold text-[10px] font-black uppercase tracking-[0.5em] mb-3">Total Cost</p><p className="text-6xl font-black italic tracking-tighter leading-none">{pkg?.price || 0} <span className="text-sm opacity-40 uppercase not-italic ml-2 tracking-widest font-sans">QAR</span></p></div>
                  <Banknote className="w-20 h-20 text-gold animate-glow relative z-10" />
               </div>
            </div>
          )}
        </div>

        <div className={`px-12 py-10 border-t border-primary/5 flex items-center justify-between bg-white/80 backdrop-blur-md flex-shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <button onClick={() => { safeHaptics.impact(); setStep(s => s - 1); }} disabled={step === 0} className="text-[11px] font-black uppercase tracking-[0.5em] text-primary/30 hover:text-primary transition-colors disabled:opacity-0">Back</button>
          <button onClick={step === STEPS.length - 1 ? handleSubscribe : handleNext} disabled={submitting} className="btn-primary !px-16 !py-7 text-[11px] tracking-[0.5em] shadow-4xl active:scale-95 flex items-center gap-6 transition-all group">
            {step === STEPS.length - 1 ? 'AUTHORIZE' : 'PROCEED'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </EditorialPanel>
  );
}

function MetricPicker({ label, value, min, max, onChange, unit }: any) {
  return (
    <div className="space-y-8 px-2">
      <div className="flex justify-between items-end">
         <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/40">{label}</p>
         <p className="text-5xl font-serif italic text-primary leading-none tracking-tighter">{value || 0}<span className="text-[10px] not-italic font-black ml-3 uppercase opacity-20 tracking-widest">{unit}</span></p>
      </div>
      <input type="range" min={min} max={max} value={value || 0} onChange={e => onChange(parseInt(e.target.value))} className="w-full accent-gold bg-primary/5 h-3 rounded-full appearance-none cursor-pointer" />
    </div>
  );
}

function ReviewRow({ label, value }: any) {
  return (
    <div className="flex justify-between gap-8 px-12 py-8 border-b border-primary/5 last:border-0 hover:bg-primary/[0.02] transition-colors">
      <span className="text-primary/40 text-[11px] font-black uppercase tracking-[0.4em]">{label}</span>
      <span className="text-primary text-lg font-black uppercase italic tracking-tighter">{value}</span>
    </div>
  );
}
