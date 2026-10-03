import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, User, Target, AlertCircle, CheckCircle } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { TIME_SLOTS, FITNESS_GOALS, type BookingData } from '@/types/booking';
import { useLanguage } from '@/lib/LanguageContext';
import { usePackages } from '@/lib/packages';
import EditorialPanel from './EditorialPanel';

import { getQatarDate, addDays, getQatarDayOfWeek } from '@/lib/date-utils';

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
  const [invalidField, setInvalidField] = useState<string | null>(null);
  const flowBodyRef = useRef<HTMLDivElement>(null);

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
  const update = (patch: Partial<BookingData>) => {
    setData((d) => ({ ...d, ...patch }));
    if (invalidField && Object.keys(patch).some((key) => key === invalidField)) setInvalidField(null);
  };

  const focusField = (fieldId: string) => {
    setInvalidField(fieldId);
    window.requestAnimationFrame(() => {
      const field = flowBodyRef.current?.querySelector<HTMLElement>(`[data-field-id="${fieldId}"]`);
      field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field?.focus({ preventScroll: true });
    });
  };

  const focusNextField = (fieldId: string) => {
    const ids: Record<string, string> = {
      weight_kg: 'height_cm', height_cm: 'fitness_goal', client_name: 'client_email',
      client_email: 'client_phone', client_phone: 'terms_accepted',
    };
    const nextId = ids[fieldId];
    if (nextId) window.requestAnimationFrame(() => flowBodyRef.current?.querySelector<HTMLElement>(`[data-field-id="${nextId}"]`)?.focus({ preventScroll: false }));
  };

  const focusFirstInvalid = () => {
    if (step === 1) {
      const weight = Number(data.weight_kg);
      const height = Number(data.height_cm);
      if (!data.weight_kg || !Number.isFinite(weight) || weight < 40 || weight > 150) return focusField('weight_kg');
      if (!data.height_cm || !Number.isFinite(height) || height < 140 || height > 220) return focusField('height_cm');
      if (!data.fitness_goal) return focusField('fitness_goal');
    }
    if (step === 2) return focusField(data.appointment_date ? 'appointment_time' : 'appointment_date');
    if (step === 3) {
      if (!data.client_name.trim()) return focusField('client_name');
      if (!data.client_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.client_email)) return focusField('client_email');
      if (!data.client_phone.trim()) return focusField('client_phone');
      if (!data.terms_accepted) return focusField('terms_accepted');
    }
  };

  const allowedDates: string[] = [];
  for (let i = 1; i <= 21; i++) {
    const d = addDays(new Date(), i);
    if (getQatarDayOfWeek(d) !== 5) { // 5 is Friday
      allowedDates.push(getQatarDate(d));
    }
  }

  const validateStep = (): string | null => {
    if (step === 0) return null;
    if (step === 1) {
      if (!data.weight_kg || !data.height_cm) return t('error_metrics');
      const weight = Number(data.weight_kg);
      const height = Number(data.height_cm);
      if (!Number.isFinite(weight) || weight < 40 || weight > 150 || !Number.isFinite(height) || height < 140 || height > 220) {
        return t('error_metrics_range');
      }
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
    if (err) { setError(err); focusFirstInvalid(); return; }
    setError(null);
    setInvalidField(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => { setError(null); setInvalidField(null); setStep((s) => Math.max(s - 1, 0)); };

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
    setInvalidField(null);
    onClose();
  };

  return (
    <EditorialPanel
      isOpen={open}
      onClose={submitted ? reset : onClose}
      title={submitted ? t('booking_confirmed') : t('booking_title')}
      badge={t('Triangle')}
      maxWidth="max-w-2xl"
      contentClassName={submitted ? 'flex-1 overflow-y-auto' : 'flex min-h-0 flex-1 flex-col overflow-hidden'}
    >
      {submitted ? (
        <div className="animate-in px-5 py-10 text-center sm:px-10 sm:py-16">
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
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-shrink-0 overflow-x-auto border-b border-primary/5 bg-gray-50/30 px-5 py-5 no-scrollbar sm:px-10 sm:py-6">
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

          <div ref={flowBodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-10 sm:py-10">
            {error && (
              <div role="alert" aria-live="assertive" className="animate-in mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 sm:mb-8 sm:px-6 sm:py-5">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {step === 0 && (
              <div className="space-y-6">
                <h3 className="text-[#0a3030] font-black text-2xl uppercase italic leading-none">{t('select_collection')}</h3>
                <div className="space-y-4">
                  <button
                    onClick={() => { setData(d => ({ ...d, package_id: 'undecided', package_name: 'Expert Recommendation' })); setStep(1); setError(null); }}
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
                        <p className={`text-[10px] font-medium leading-relaxed mt-1 ${data.package_id === 'undecided' ? 'text-white/60' : 'text-gray-400'}`}>{isRtl ? 'ناقش احتياجاتك مع أخصائي التغذية سابيك لاختيار الخطة المناسبة لك.' : 'Discuss your needs with Sabic (Specialist Dietitian) to find your ideal protocol.'}</p>
                      </div>
                    </div>
                  </button>

                  {packages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setData(d => ({ ...d, package_id: p.id, package_name: p.name }));
                        setStep(1);
                        setError(null);
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
                <div className="grid grid-cols-2 items-start gap-3 sm:gap-6">
                  <FormEntry label={t('current_weight')} sub="kg" required headerClassName="min-h-10 items-start">
                    <input data-field-id="weight_kg" aria-invalid={invalidField === 'weight_kg'} onKeyDown={(event) => { if (event.key === 'Enter' && data.weight_kg && Number(data.weight_kg) >= 40 && Number(data.weight_kg) <= 150) { event.preventDefault(); focusNextField('weight_kg'); } }} type="number" inputMode="decimal" step="0.1" min={40} max={150} value={data.weight_kg} onChange={(e) => update({ weight_kg: e.target.value })} placeholder="72" aria-label={`${t('current_weight')} (kg)`} className={`input-field py-5 font-black text-lg ${invalidField === 'weight_kg' ? 'border-red-500 ring-2 ring-red-200' : ''}`} />
                  </FormEntry>
                  <FormEntry label={t('standing_height')} sub="cm" required headerClassName="min-h-10 items-start">
                    <input data-field-id="height_cm" aria-invalid={invalidField === 'height_cm'} onKeyDown={(event) => { if (event.key === 'Enter' && data.height_cm && Number(data.height_cm) >= 140 && Number(data.height_cm) <= 220) { event.preventDefault(); focusNextField('height_cm'); } }} type="number" inputMode="decimal" step="1" min={140} max={220} value={data.height_cm} onChange={(e) => update({ height_cm: e.target.value })} placeholder="175" aria-label={`${t('standing_height')} (cm)`} className={`input-field py-5 font-black text-lg ${invalidField === 'height_cm' ? 'border-red-500 ring-2 ring-red-200' : ''}`} />
                  </FormEntry>
                </div>
                <div>
                  <label className="mb-4 ml-1 flex items-center justify-between gap-2 text-[#0a3030] text-[10px] font-black uppercase tracking-[0.3em] opacity-60"><span>{t('target_ambition')}</span><RequirementTag required isRtl={isRtl} /></label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {FITNESS_GOALS.map((g) => (
                      <button key={g} type="button" data-field-id={g === FITNESS_GOALS[0] ? 'fitness_goal' : undefined} aria-pressed={data.fitness_goal === g} onClick={() => { update({ fitness_goal: g }); setError(null); setInvalidField(null); }} className={`py-4 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${invalidField === 'fitness_goal' ? 'border-red-400' : data.fitness_goal === g ? 'border-[#0a3030] bg-[#0a3030] text-white shadow-lg' : 'border-gray-50 bg-white text-gray-300 hover:border-gray-200'}`}>{t(g) || g}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-8 pt-6 border-t border-gray-50">
                  <h3 className="text-[#0a3030] font-black text-xl uppercase italic leading-none flex items-center gap-3">
                    <Target className="w-5 h-5 text-[#C5A059]" /> {t('critical_intel')}
                  </h3>
                  <FormEntry label={t('dietary_restrictions')} sub={t('optional')}>
                    <textarea value={data.dietary_restrictions} onChange={(e) => update({ dietary_restrictions: e.target.value })} placeholder={t('allergies_placeholder') || "Allergies, intolerances..."} className="input-field py-4 min-h-[100px] resize-none" />
                  </FormEntry>
                  <FormEntry label={t('exercise_routine')} sub={t('optional')}>
                    <textarea value={data.exercise_routine} onChange={(e) => update({ exercise_routine: e.target.value })} placeholder={t('exercise_placeholder') || "Current training frequency..."} className="input-field py-4 min-h-[100px] resize-none" />
                  </FormEntry>
                  <FormEntry label={t('health_notes')} sub={t('optional')}>
                    <input type="text" value={data.health_notes} onChange={(e) => update({ health_notes: e.target.value })} placeholder={t('history_placeholder') || "Any relevant medical history..."} className="input-field py-5" />
                  </FormEntry>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in">
                <h3 className="flex items-center justify-between gap-3 text-[#0a3030] font-black text-2xl uppercase italic leading-none"><span>{t('consultation_slot')}</span><RequirementTag required isRtl={isRtl} /></h3>
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
                        data-field-id={!data.appointment_date && d === allowedDates[0] ? 'appointment_date' : undefined}
                        onClick={() => { update({ appointment_date: d, appointment_time: '' }); setError(null); window.setTimeout(() => flowBodyRef.current?.querySelector<HTMLElement>('[data-field-id="appointment_time"]')?.focus({ preventScroll: false }), 50); }}
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
                          type="button"
                          data-field-id={!data.appointment_time && slot === TIME_SLOTS.find((candidate) => !bookedSlots[data.appointment_date]?.includes(candidate)) ? 'appointment_time' : undefined}
                          disabled={isSlotTaken}
                          onClick={() => { update({ appointment_time: slot }); setError(null); setStep(3); }}
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
                <FormEntry label={t('full_name')} sub={t('passport_id')} required>
                  <input data-field-id="client_name" aria-invalid={invalidField === 'client_name'} onKeyDown={(event) => { if (event.key === 'Enter' && data.client_name.trim()) { event.preventDefault(); focusNextField('client_name'); } }} type="text" autoCapitalize="words" autoComplete="name" value={data.client_name} onChange={(e) => update({ client_name: e.target.value })} placeholder={t('enter_full_name') || "Enter Full Name"} className={`input-field py-5 font-black ${invalidField === 'client_name' ? 'border-red-500 ring-2 ring-red-200' : ''}`} />
                </FormEntry>
                <FormEntry label={t('email_address')} sub={t('official')} required>
                  <input data-field-id="client_email" aria-invalid={invalidField === 'client_email'} onKeyDown={(event) => { if (event.key === 'Enter' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.client_email)) { event.preventDefault(); focusNextField('client_email'); } }} type="email" autoComplete="email" value={data.client_email} onChange={(e) => update({ client_email: e.target.value })} placeholder={t('enter_email') || "Enter Email"} className={`input-field py-5 font-black ${invalidField === 'client_email' ? 'border-red-500 ring-2 ring-red-200' : ''}`} />
                </FormEntry>
                <FormEntry label={t('mobile_number')} sub={t('whatsapp_linked')} required>
                  <input data-field-id="client_phone" aria-invalid={invalidField === 'client_phone'} onKeyDown={(event) => { if (event.key === 'Enter' && data.client_phone.trim()) { event.preventDefault(); focusNextField('client_phone'); } }} type="tel" autoComplete="tel" value={data.client_phone} onChange={(e) => update({ client_phone: e.target.value })} placeholder="+974" className={`input-field py-5 font-black ${invalidField === 'client_phone' ? 'border-red-500 ring-2 ring-red-200' : ''}`} />
                </FormEntry>
                <label className="flex items-start gap-4 mt-10 cursor-pointer group">
                  <button type="button" data-field-id="terms_accepted" aria-pressed={data.terms_accepted} onClick={() => { const accepted = !data.terms_accepted; update({ terms_accepted: accepted }); if (accepted && data.client_name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.client_email) && data.client_phone.trim()) { setError(null); setStep(4); } }} className={`mt-0.5 min-h-11 min-w-11 rounded-xl border-2 flex items-center justify-center transition-all ${invalidField === 'terms_accepted' ? 'border-red-500 ring-2 ring-red-200' : data.terms_accepted ? 'border-[#0a3030] bg-[#0a3030] shadow-lg' : 'border-gray-200'}`}>
                    {data.terms_accepted && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <span className="text-gray-500 text-xs font-medium leading-relaxed italic">{t('agree_terms')} <RequirementTag required isRtl={isRtl} /></span>
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

          <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-primary/5 bg-white/95 px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-8px_24px_rgba(10,48,48,0.06)] backdrop-blur-md sm:px-10 sm:py-6">
            <button onClick={back} disabled={step === 0} className="flex min-h-11 min-w-11 items-center gap-2 px-3 text-gray-400 font-black uppercase tracking-widest text-[10px] disabled:opacity-20 transition-all hover:text-[#0a3030]">
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} /> {t('back')}
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={next} className="btn-primary flex min-h-11 items-center gap-2 px-5 py-3.5 text-xs uppercase tracking-widest sm:gap-3 sm:px-10 sm:py-4 sm:text-sm">
                {t('next')} <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button onClick={submit} disabled={submitting} className="flex items-center gap-2 rounded-2xl bg-[#C5A059] px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_20px_40px_rgba(197,160,89,0.3)] transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 sm:gap-3 sm:px-12 sm:py-4 sm:text-sm sm:tracking-widest">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('register_consult')}
              </button>
            )}
          </div>
        </div>
      )}
    </EditorialPanel>
  );
}

function FormEntry({ label, sub, children, required = false, headerClassName = '' }: any) {
  const { t, isRtl } = useLanguage();
  return (
    <div className="w-full">
      <div className={`flex justify-between items-end mb-3 px-2 ${headerClassName}`}>
        <span className="flex items-center gap-1.5 text-[#0a3030] font-black text-[10px] uppercase tracking-[0.3em] opacity-50">{label}{required && <RequirementTag required isRtl={isRtl} />}</span>
        <span className="text-gray-300 text-[9px] font-black uppercase tracking-widest">{sub}</span>
      </div>
      {children}
    </div>
  );
}

function RequirementTag({ required, isRtl }: { required: boolean; isRtl: boolean }) {
  return <span className="inline-flex whitespace-nowrap rounded-full bg-[#C5A059]/10 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-normal text-[#8a682d]">{required ? (isRtl ? 'مطلوب' : 'Required') : (isRtl ? 'اختياري' : 'Optional')}</span>;
}

function ReviewRow({ label, value }: any) {
  return (
    <div className="flex justify-between gap-6 px-8 py-5 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">{label}</span>
      <span className="text-[#0a3030] text-xs font-black uppercase">{value}</span>
    </div>
  );
}
