import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Loader2, X,
  Calendar, User, Phone, Mail, Target, Sparkles, AlertCircle,
  Clock, Navigation, CheckCircle, Star
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TIME_SLOTS, FITNESS_GOALS, type BookingData } from '@/types/booking';
import { useLanguage } from '@/lib/LanguageContext';
import { usePackages } from '@/lib/packages';
import EditorialPanel from './EditorialPanel';

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
  const { packages } = usePackages();

  const STEPS = [
    t('booking_package'),
    t('booking_profile'),
    t('booking_date'),
    t('booking_details'),
    t('booking_review')
  ];

  const [step, setStep] = useState(0);
  const [data, setData] = useState<BookingData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const detectLocation = async () => {
    setLocating(true);
    setLocationError(null);
    await Haptics.impact({ style: ImpactStyle.Light });
    if (!navigator.geolocation) {
      setLocationError("Location signal blocked.");
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
            update({ health_notes: (data.health_notes ? data.health_notes + "\n" : "") + "Verified Location: " + fullAddr });
          } else {
            setLocationError("Signal weak.");
          }
        } catch (e) {
           setLocationError("Lookup failed.");
        } finally { setLocating(false); }
      },
      (err) => {
         setLocationError('Access denied.');
         setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchBookedSlots = useCallback(async () => {
    const { data } = await supabase
      .from('bookings')
      .select('appointment_date, appointment_time')
      .neq('status', 'cancelled');
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
    if (open) fetchBookedSlots();
  }, [open, fetchBookedSlots]);

  useEffect(() => {
    if (open && preselectedPackage) {
      const pkg = packages.find((p) => p.id === preselectedPackage);
      if (pkg) {
        setData((d) => d.package_id ? d : { ...d, package_id: pkg.id, package_name: pkg.name });
        setStep(1);
      }
    }
    if (open && !preselectedPackage) {
      setStep(0);
    }
  }, [open, preselectedPackage, packages]);

  if (!open) return null;

  const pkg = packages.find((p) => p.id === data.package_id);
  const update = (patch: Partial<BookingData>) => setData((d) => ({ ...d, ...patch }));

  const today = new Date();
  const allowedDates: string[] = [];
  for (let i = 1; i <= 21; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 5) {
      allowedDates.push(d.toISOString().slice(0, 10));
    }
  }

  const validateStep = (): string | null => {
    if (step === 0) return null;
    if (step === 1) {
      if (!data.weight_kg || !data.height_cm) return t('error_metrics');
      if (!data.fitness_goal) return t('error_goal');
    }
    if (step === 2 && (!data.appointment_date || !data.appointment_time))
      return t('error_slot');
    if (step === 3) {
      if (!data.client_name.trim()) return t('error_name');
      if (!data.client_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.client_email))
        return t('error_email');
      if (!data.client_phone.trim()) return t('error_phone');
      if (!data.terms_accepted) return t('legal_error');
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => { setError(null); setStep((s) => Math.max(s - 1, 0)); };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        ...data,
        package_name: pkg?.name ?? data.package_name,
      };

      const { data: result, error: invokeErr } = await supabase.functions.invoke('send-booking-notification', {
        body: body,
      });

      if (invokeErr) {
        let message = t('error_generic');
        try {
          const errBody = await invokeErr.context.json();
          message = errBody.error || message;
        } catch (e) {
          message = invokeErr.message || message;
        }
        throw new Error(message);
      }

      if (result?.success) {
        setSubmitted(true);
      } else {
        throw new Error(result?.error || 'Booking protocol failed.');
      }
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
    <EditorialPanel
      isOpen={open}
      onClose={submitted ? reset : onClose}
      title={submitted ? t('booking_confirmed') : t('booking_title')}
      badge={t('Triangle')}
      maxWidth="max-w-2xl"
    >
      {submitted ? (
        <div className="px-10 py-16 text-center animate-in">
          <div className="w-24 h-24 rounded-[2.5rem] bg-[#0a3030] flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-6">
            <CheckCircle className="w-12 h-12 text-[#C5A059]" />
          </div>
          <h2 className="text-[#0a3030] font-black text-4xl leading-none tracking-tighter mb-4 uppercase italic">{t('booking_success')}</h2>
          <p className="text-gray-400 font-medium mb-12 max-w-sm mx-auto leading-relaxed">
            {t('booking_locked')} <span className="text-[#0a3030] font-black underline">{data.client_email}</span>
          </p>
          <button onClick={reset} className="btn-primary px-16 py-6 uppercase tracking-[0.4em] text-xs">{t('return_home')}</button>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="px-10 py-6 border-b border-primary/5 flex-shrink-0 bg-gray-50/30 overflow-x-auto no-scrollbar">
            <div className="flex items-center min-w-max gap-4">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all duration-700 ${
                      i < step ? 'bg-emerald-500 text-white'
                      : i === step ? 'bg-[#0a3030] text-white shadow-xl scale-110'
                      : 'bg-white text-gray-300 border border-gray-100'
                    }`}>
                      {i < step ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest hidden sm:block ${i <= step ? 'text-[#0a3030]' : 'text-gray-300'}`}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-12 h-0.5 rounded-full ${i < step ? 'bg-emerald-500' : 'bg-gray-100'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-10 py-10">
            {error && (
              <div className="mb-8 flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-6 py-5 animate-in">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {step === 0 && (
              <div className="space-y-6">
                <h3 className="text-[#0a3030] font-black text-2xl uppercase italic leading-none">{t('select_collection')}</h3>
                <div className="space-y-4">
                  <button
                    onClick={() => setData(d => ({ ...d, package_id: 'undecided', package_name: 'Expert Recommendation' }))}
                    className={`w-full text-left rounded-[2rem] p-6 border-2 transition-all duration-500 ${
                      data.package_id === 'undecided' ? 'border-[#0a3030] bg-[#0a3030] text-white shadow-2xl translate-x-2' : 'border-gray-50 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center border border-white/10 flex-shrink-0">
                         <User className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-base font-black uppercase tracking-widest ${data.package_id === 'undecided' ? 'text-white' : 'text-[#0a3030]'}`}>{t('undecided')}</h4>
                        <p className={`text-[10px] font-medium leading-relaxed mt-1 ${data.package_id === 'undecided' ? 'text-white/60' : 'text-gray-400'}`}>Discuss your needs with Sabic (Specialist Dietitian) to find your ideal protocol.</p>
                      </div>
                    </div>
                  </button>

                  {packages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setData(d => ({ ...d, package_id: p.id, package_name: p.name }));
                      }}
                      className={`w-full text-left rounded-[2rem] p-6 border-2 transition-all duration-500 ${
                        data.package_id === p.id ? 'border-[#0a3030] bg-[#0a3030] text-white shadow-2xl translate-x-2' : 'border-gray-50 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0">
                           <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-base font-black uppercase tracking-widest ${data.package_id === p.id ? 'text-white' : 'text-[#0a3030]'}`}>{t(p.name)}</h4>
                          <p className={`text-[11px] font-medium leading-relaxed mt-1 ${data.package_id === p.id ? 'text-white/60' : 'text-gray-400'}`}>{p.kcals} {t('kcal')} · {t(p.meals)}</p>
                          <p className={`text-sm font-black mt-3 ${data.package_id === p.id ? 'text-white' : 'text-[#0a3030]'}`}>{p.price.toLocaleString()} {t('qar')}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8 animate-in">
                <h3 className="text-[#0a3030] font-black text-2xl uppercase italic leading-none">{t('biological_profile')}</h3>
                <div className="grid grid-cols-2 gap-6">
                  <FormEntry label={t('current_weight')} sub="kg">
                    <input type="number" inputMode="decimal" value={data.weight_kg} onChange={(e) => update({ weight_kg: e.target.value })} placeholder="72" className="input-field py-5 font-black text-lg" />
                  </FormEntry>
                  <FormEntry label={t('standing_height')} sub="cm">
                    <input type="number" inputMode="decimal" value={data.height_cm} onChange={(e) => update({ height_cm: e.target.value })} placeholder="175" className="input-field py-5 font-black text-lg" />
                  </FormEntry>
                </div>
                <div>
                  <label className="text-[#0a3030] text-[10px] font-black uppercase tracking-[0.3em] opacity-40 ml-1 mb-4 block">{t('target_ambition')}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {FITNESS_GOALS.map((g) => (
                      <button key={g} onClick={() => update({ fitness_goal: g })} className={`py-4 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${data.fitness_goal === g ? 'border-[#0a3030] bg-[#0a3030] text-white shadow-lg' : 'border-gray-50 bg-white text-gray-300 hover:border-gray-200'}`}>{t(g) || g}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-8 pt-6 border-t border-gray-50">
                  <h3 className="text-[#0a3030] font-black text-xl uppercase italic leading-none flex items-center gap-3">
                    <Target className="w-5 h-5 text-[#C5A059]" /> {t('critical_intel')}
                  </h3>
                  <FormEntry label={t('dietary_restrictions')} sub={t('optional')}>
                    <textarea value={data.dietary_restrictions} onChange={(e) => update({ dietary_restrictions: e.target.value })} placeholder="Allergies, intolerances..." className="input-field py-4 min-h-[100px] resize-none" />
                  </FormEntry>
                  <FormEntry label={t('exercise_routine')} sub={t('optional')}>
                    <textarea value={data.exercise_routine} onChange={(e) => update({ exercise_routine: e.target.value })} placeholder="Current training frequency..." className="input-field py-4 min-h-[100px] resize-none" />
                  </FormEntry>
                  <FormEntry label={t('health_notes')} sub={t('clinical_context')}>
                    <input type="text" value={data.health_notes} onChange={(e) => update({ health_notes: e.target.value })} placeholder="Any relevant medical history..." className="input-field py-5" />
                  </FormEntry>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in">
                <h3 className="text-[#0a3030] font-black text-2xl uppercase italic leading-none">{t('consultation_slot')}</h3>
                <div className="grid grid-cols-4 gap-3">
                  {allowedDates.slice(0, 8).map((d: string) => {
                    const date = new Date(d + 'T00:00:00');
                    const isSelected = data.appointment_date === d;
                    const dayLabel = date.toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US', { weekday: 'short' });

                    const dayBookedSlots = bookedSlots[d] || [];
                    const isFullyBooked = TIME_SLOTS.every(slot => dayBookedSlots.includes(slot));

                    return (
                      <button
                        key={d}
                        disabled={isFullyBooked}
                        onClick={() => update({ appointment_date: d, appointment_time: '' })}
                        className={`flex flex-col items-center py-4 rounded-3xl border-2 transition-all relative ${
                          isSelected ? 'border-[#0a3030] bg-[#0a3030] text-white shadow-xl'
                          : isFullyBooked ? 'border-gray-50 bg-gray-50 text-gray-200 opacity-40 cursor-not-allowed'
                          : 'border-gray-50 text-gray-300 bg-white'
                        }`}
                      >
                        <span className="text-[8px] font-black uppercase">{dayLabel}</span>
                        <span className="text-xl font-black mt-1">{date.getDate()}</span>
                        {isFullyBooked && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap">{t('status_full')}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {data.appointment_date && (
                  <div className="grid grid-cols-3 gap-3">
                    {TIME_SLOTS.map((slot) => {
                      const isSlotTaken = bookedSlots[data.appointment_date]?.includes(slot);
                      return (
                        <button
                          key={slot}
                          disabled={isSlotTaken}
                          onClick={() => update({ appointment_time: slot })}
                          className={`py-4 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${
                            data.appointment_time === slot ? 'border-[#C5A059] bg-[#C5A059] text-white shadow-md'
                            : isSlotTaken ? 'bg-gray-50 text-gray-200 border-gray-50 opacity-40 cursor-not-allowed'
                            : 'border-gray-50 text-gray-400 bg-white'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in">
                <h3 className="text-[#0a3030] font-black text-2xl uppercase italic leading-none">{t('identity_verification')}</h3>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={detectLocation}
                    disabled={locating}
                    className={`w-full flex items-center justify-center gap-4 bg-white border border-primary/10 py-6 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-sm active:scale-95 disabled:opacity-50 ${locating ? 'animate-pulse' : ''}`}
                  >
                    {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 text-[#C5A059]" />}
                    {locating ? 'Syncing...' : 'Verify Location (Optional)'}
                  </button>
                  {locationError && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-4">{locationError}</p>}
                </div>
                <FormEntry label={t('full_name')} sub={t('passport_id')}>
                  <input type="text" autoCapitalize="words" value={data.client_name} onChange={(e) => update({ client_name: e.target.value })} placeholder="Enter Full Name" className="input-field py-5 font-black" />
                </FormEntry>
                <FormEntry label={t('email_address')} sub={t('official')}>
                  <input type="email" value={data.client_email} onChange={(e) => update({ client_email: e.target.value })} placeholder="Enter Email" className="input-field py-5 font-black" />
                </FormEntry>
                <FormEntry label={t('mobile_number')} sub={t('whatsapp_linked')}>
                  <input type="tel" value={data.client_phone} onChange={(e) => update({ client_phone: e.target.value })} placeholder="+974" className="input-field py-5 font-black" />
                </FormEntry>
                <label className="flex items-start gap-4 mt-10 cursor-pointer group">
                  <button type="button" onClick={() => update({ terms_accepted: !data.terms_accepted })} className={`mt-0.5 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${data.terms_accepted ? 'border-[#0a3030] bg-[#0a3030] shadow-lg' : 'border-gray-200'}`}>
                    {data.terms_accepted && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <span className="text-gray-500 text-xs font-medium leading-relaxed italic">{t('agree_terms')}</span>
                </label>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-in">
                <h3 className="text-[#0a3030] font-black text-2xl uppercase italic leading-none">{t('summary_analysis')}</h3>
                <div className="premium-card p-0 overflow-hidden border-gray-100 bg-white">
                  <ReviewRow label={t('booking_package')} value={t(data.package_id) || data.package_name} />
                  <ReviewRow label={t('target_launch')} value={`${data.appointment_date} @ ${data.appointment_time}`} />
                  <ReviewRow label={t('account_holder')} value={data.client_name} />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-10 py-10 border-t border-primary/5 flex-shrink-0 bg-white/60 backdrop-blur-md">
            <button onClick={back} disabled={step === 0} className="flex items-center gap-2 text-gray-400 font-black uppercase tracking-widest text-[10px] disabled:opacity-20 transition-all hover:text-[#0a3030]">
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} /> {t('back')}
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={next} className="btn-primary py-4 px-10 text-sm uppercase tracking-widest flex items-center gap-3">
                {t('next')} <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button onClick={submit} disabled={submitting} className="bg-[#C5A059] text-white font-black px-12 py-4 rounded-2xl text-sm uppercase tracking-widest transition-all flex items-center gap-3 shadow-[0_20px_40px_rgba(197,160,89,0.3)] hover:-translate-y-1 active:scale-95 disabled:opacity-50">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('register_consult')}
              </button>
            )}
          </div>
        </div>
      )}
    </EditorialPanel>
  );
}

function FormEntry({ label, sub, children }: any) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-3 px-2">
        <span className="text-[#0a3030] font-black text-[10px] uppercase tracking-[0.3em] opacity-40">{label}</span>
        <span className="text-gray-300 text-[9px] font-black uppercase tracking-widest">{sub}</span>
      </div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: any) {
  return (
    <div className="flex justify-between gap-6 px-8 py-5 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">{label}</span>
      <span className="text-[#0a3030] text-xs font-black uppercase">{value}</span>
    </div>
  );
}
