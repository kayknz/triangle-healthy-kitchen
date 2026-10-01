import React, { useState, useEffect, useMemo } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
  Loader2, Navigation, CreditCard, AlertCircle, CheckCircle2
} from 'lucide-react';
import { safeHaptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';
import { PACKAGE_MEALS } from '@/types/subscription';
import EditorialPanel from './EditorialPanel';
import { resolveQatarDeliveryZone } from '@/lib/delivery-zone';
import { parseGoogleMapsUrl } from '@/lib/location-utils';
import { getCountryOptions, toE164Phone, type PhoneChannel } from '@/lib/phone-number';
import type { CountryCode } from 'libphonenumber-js';

type InitialMenuChoice = { dish_id: string; dish_name: string; dish_kcals: number; day_of_week: string; meal_type: string; menu_period: string };
const SERVICE_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const PACKAGE_MENU_MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'];
function upcomingServiceWeekStart() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Qatar', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const date = new Date(`${today}T12:00:00Z`);
  const daysUntilSaturday = (6 - date.getUTCDay() + 7) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilSaturday);
  return date.toISOString().slice(0, 10);
}
function currentMenuReleaseStart() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Qatar', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 1) % 7));
  return date.toISOString().slice(0, 10);
}

interface SubscriptionFlowProps {
  open: boolean;
  onClose: () => void;
  preselectedPackage?: string | null;
}

export default function SubscriptionFlow({ open, onClose, preselectedPackage }: SubscriptionFlowProps) {
  const { user, signUp, signUpPhone, verifySignupOtp } = useAuth();
  const { t, isRtl } = useLanguage();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<Array<{ id: string; name: string; description: string; price: number; currency: string }>>([]);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [initialMenuOptions, setInitialMenuOptions] = useState<Record<string, Array<{ id: string; name: string; kcals: number }>>>({});
  const [initialMenuSelections, setInitialMenuSelections] = useState<Record<string, InitialMenuChoice>>({});
  const [menuPeriod, setMenuPeriod] = useState('autumn');
  const [menuLoading, setMenuLoading] = useState(false);

  const [assessment, setAssessment] = useState({
    age: 30,
    gender: 'male' as 'male' | 'female',
    weight: 75,
    height: 180,
    fitness_goal: 'weight_loss',
    activity_level: 'moderate',
  });
  const [bmiReport, setBmiReport] = useState<File | null>(null);

  const [pkgId, setPkgId] = useState('');
  const packageMenuMeals = PACKAGE_MEALS[pkgId] || PACKAGE_MENU_MEALS;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupChannel, setSignupChannel] = useState<PhoneChannel>('email');
  const [signupOtpStep, setSignupOtpStep] = useState(false);
  const [signupOtpCode, setSignupOtpCode] = useState('');
  const [signupCountry, setSignupCountry] = useState<CountryCode>('QA');
  const signupCountries = useMemo(() => getCountryOptions(isRtl ? 'ar' : 'en'), [isRtl]);
  const [billingEmail, setBillingEmail] = useState(String(user?.email || ''));
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  const [address, setAddress] = useState({
    building_number: '',
    street: '',
    area: '',
    zone: '',
    latitude: null as number | null,
    longitude: null as number | null,
    delivery_notes: '',
  });
  const [deliveryPlace, setDeliveryPlace] = useState<'home' | 'office' | 'gym' | 'other'>('home');
  const [googleMapsInput, setGoogleMapsInput] = useState('');

  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const getSteps = () => {
    const base = [
      { label: 'Your Info', id: 'assessment' },
      ...(!preselectedPackage ? [{ label: 'Pick Plan', id: 'plan' }] : []),
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

  useEffect(() => {
    if (open) {
      setStep(0);
      setSuccess(false);
      setError(null);
      setTermsAccepted(false);
      setSignupOtpStep(false);
      setSignupOtpCode('');
      void supabase.from('packages').select('id, name, description, price, currency').eq('active', true).order('sort_order').then(({ data, error: packageError }) => {
        if (packageError) {
          setError('Meal plans are temporarily unavailable. Please try again shortly.');
          return;
        }
        const rows = data || [];
        setAvailablePackages(rows);
        setPkgId((current) => rows.some((row) => row.id === (preselectedPackage || current)) ? (preselectedPackage || current) : (rows[0]?.id || ''));
      });
    }
  }, [open, preselectedPackage]);

  useEffect(() => {
    if (!open || !pkgId) return;
    let cancelled = false;
    const loadMenu = async () => {
      setMenuLoading(true);
      try {
        const releaseStart = currentMenuReleaseStart();
        const releaseEnd = new Date(`${releaseStart}T12:00:00Z`);
        releaseEnd.setUTCDate(releaseEnd.getUTCDate() + 7);
        const startAt = new Date(`${releaseStart}T00:00:00+03:00`).toISOString();
        const endDate = releaseEnd.toISOString().slice(0, 10);
        const endAt = new Date(`${endDate}T00:00:00+03:00`).toISOString();
        const [{ data: settings }, { data: menu, error: menuError }] = await Promise.all([
          supabase.from('global_settings').select('active_season').maybeSingle(),
          supabase.from('menu_availability').select('week_number,dish_id,day_of_week,meal_period,collection,is_kitchen_choice,dishes(id,name,kcals)').eq('is_active', true).gte('available_from', startAt).lt('available_from', endAt),
        ]);
        if (menuError) throw menuError;
        if (cancelled) return;
        const collection = settings?.active_season || 'autumn';
        const rows = (menu || []).filter((row: any) => row.collection === collection);
        const options: Record<string, Array<{ id: string; name: string; kcals: number; kitchen_choice?: boolean }>> = {};
        const defaults: Record<string, InitialMenuChoice> = {};
        for (const day of SERVICE_DAYS) for (const meal of packageMenuMeals) {
          const key = `${day}|${meal}`;
          const matching = rows.filter((row: any) => row.day_of_week === day && row.meal_period === meal).flatMap((row: any) => {
            const dish = Array.isArray(row.dishes) ? row.dishes[0] : row.dishes;
            return dish ? [{ id: String(dish.id), name: String(dish.name), kcals: Number(dish.kcals || 0), kitchen_choice: Boolean(row.is_kitchen_choice) }] : [];
          });
          options[key] = matching;
          const chosen = matching.find((item) => item.kitchen_choice) || matching[0];
          if (chosen) defaults[key] = { dish_id: chosen.id, dish_name: chosen.name, dish_kcals: chosen.kcals, day_of_week: day, meal_type: meal === 'snacks' ? 'snack' : meal, menu_period: collection };
        }
        setMenuPeriod(collection); setInitialMenuOptions(options); setInitialMenuSelections(defaults);
      } catch (menuError: any) {
        if (!cancelled) { setInitialMenuOptions({}); setInitialMenuSelections({}); setError(menuError?.message || 'Menu is not available right now.'); }
      } finally { if (!cancelled) setMenuLoading(false); }
    };
    void loadMenu();
    return () => { cancelled = true; };
  }, [open, pkgId]);

  if (!open) return null;

  const pkg = availablePackages.find((p) => p.id === pkgId);
  const selectionWindowOpen = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Qatar', weekday: 'short' }).format(new Date()) !== 'Fri';

  const handleNext = async () => {
    const currentStep = STEPS[step]?.id;
    if (currentStep === 'assessment' && (!Number.isFinite(assessment.weight) || assessment.weight < 40 || assessment.weight > 150 || !Number.isFinite(assessment.height) || assessment.height < 140 || assessment.height > 220 || assessment.age < 13 || assessment.age > 110)) {
      setError('Enter your age and a valid weight (40–150 kg) and height (140–220 cm).');
      return;
    }
    if (currentStep === 'plan' && !pkg) {
      setError('Select an available meal plan to continue.');
      return;
    }
    if (currentStep === 'address' && (!address.building_number.trim() || !address.street.trim() || !address.area.trim() || !address.zone.trim() || !phone.trim())) {
      setError('Enter your phone number and complete the building, street, area, and zone details.');
      return;
    }
    if (currentStep === 'identity') {
      if (!name.trim() || !email.trim() || password.length < 6 || !phone.trim()) {
        setError('Enter your name, billing email, phone number, and a password with at least 6 characters.');
        return;
      }
      if (signupChannel === 'whatsapp' && !toE164Phone(phone, signupCountry)) {
        setError(t('error_phone') || 'Enter a valid phone number for the selected country.');
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        if (signupOtpStep) {
          const destination = signupChannel === 'email' ? email.trim().toLowerCase() : toE164Phone(phone, signupCountry)!;
          const verified = await verifySignupOtp(destination, signupOtpCode.trim(), signupChannel);
          if (verified.error) { setError(verified.error); return; }
          setSignupOtpStep(false);
          setSignupOtpCode('');
          setStep((currentStepIndex) => currentStepIndex);
          return;
        }
        const created = signupChannel === 'email'
          ? await signUp(email.trim().toLowerCase(), password, name, 'subscriber', phone)
          : await signUpPhone(toE164Phone(phone, signupCountry)!, password, name, 'whatsapp', email.trim().toLowerCase());
        if (created.error) { setError(created.error); return; }
        if (created.needsVerification) { setSignupOtpStep(true); return; }
        setStep((currentStepIndex) => currentStepIndex);
      } catch (accountError: any) {
        setError(accountError?.message || 'Could not create your account.');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (currentStep === 'payment' && !termsAccepted) {
      setError('Please accept the plan and payment terms to continue.');
      return;
    }
    if (currentStep === 'payment' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail.trim() || email.trim() || user?.email || '')) {
      setError('Enter a valid email address for Tap payment receipts.');
      return;
    }
    setError(null);
    setStep((currentStepIndex) => Math.min(currentStepIndex + 1, STEPS.length - 1));
  };

  const locateUserAddress = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setError(null);
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const [addressResponse, zoneNumber] = await Promise.all([
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`).then((response) => response.ok ? response.json() : null).catch(() => null),
            resolveQatarDeliveryZone(latitude, longitude).catch(() => null),
          ]);
          const addr = addressResponse?.address || {};
          setAddress((previous) => ({
            ...previous,
            building_number: addr.house_number || addr.building || addr.office || addr.amenity || addr.shop || '',
            street: addr.road || addr.pedestrian || addr.residential || '',
            area: addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.city || '',
            zone: zoneNumber || '',
            delivery_notes: addr.amenity || addr.shop || addr.leisure || previous.delivery_notes,
            latitude,
            longitude,
          }));
          setLocationMessage(zoneNumber
            ? `Location found. Delivery zone ${zoneNumber} filled automatically; review the other address fields.`
            : 'Location found, but its zone could not be matched. Check the address and enter the zone number.');
        } finally { setLocating(false); }
      },
      () => {
        setLocationMessage('Could not get your location. Enter the delivery address manually.');
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
        throw new Error('Sign in to your verified account before continuing to checkout.');
      }

      if (!activeUser) throw new Error("Identity verification failed.");

      if (!pkg) throw new Error('Select an available meal plan before continuing.');
      let bmiReportPath: string | null = null;
      if (bmiReport) {
        const objectName = `${activeUser.id}/${crypto.randomUUID()}-${bmiReport.name.replace(/[^\w.-]/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from('bmi-reports').upload(objectName, bmiReport, { contentType: bmiReport.type, upsert: false });
        if (uploadError) throw new Error(`BMI report upload failed: ${uploadError.message}`);
        bmiReportPath = objectName;
      }
      const { data: checkout, error: checkoutError } = await supabase.functions.invoke('tap-checkout', {
        body: {
          package_id: pkg.id,
          profile: {
            email: billingEmail.trim().toLowerCase() || email.trim().toLowerCase() || activeUser.email || '',
            full_name: name || activeUser.user_metadata?.full_name || 'Triangle Member',
            age: assessment.age,
            gender: assessment.gender,
            bmi_report_path: bmiReportPath,
            phone: (signupChannel === 'whatsapp' ? toE164Phone(phone, signupCountry) : null) || phone || activeUser.user_metadata?.phone || '',
            weight_kg: assessment.weight,
            height_cm: assessment.height,
            fitness_goal: assessment.fitness_goal,
            building_number: address.building_number,
            street: address.street,
            area: address.area || 'Doha',
            zone_number: address.zone,
            delivery_notes: [`Deliver to: ${deliveryPlace}`, address.delivery_notes.trim()].filter(Boolean).join(' — '),
            latitude: address.latitude,
              longitude: address.longitude,
            },
            initial_menu_selections: Object.values(initialMenuSelections).map((choice) => ({ ...choice, week_start_date: upcomingServiceWeekStart() })),
          },
      });
      if (checkoutError) throw checkoutError;
      if (!checkout?.checkout_url || !checkout?.transaction_id) throw new Error(checkout?.error || 'Tap did not return a valid checkout session.');

      if (Capacitor.isNativePlatform()) await Browser.open({ url: checkout.checkout_url });
      else window.open(checkout.checkout_url, '_blank', 'noopener,noreferrer');
      setWaitingForPayment(true);
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 3000));
        const { data: transaction, error: statusError } = await supabase
          .from('payment_transactions').select('status').eq('id', checkout.transaction_id).maybeSingle();
        if (statusError) throw statusError;
        if (transaction?.status === 'captured') {
          setSuccess(true);
          setWaitingForPayment(false);
          return;
        }
        if (transaction && ['failed', 'cancelled', 'voided'].includes(transaction.status)) {
          throw new Error('Tap did not capture the payment. You can try checkout again.');
        }
      }
      setError('Payment is still being confirmed by Tap. Your plan will activate automatically after the verified payment arrives.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Subscription Request Failed');
    } finally {
      setWaitingForPayment(false);
      setSubmitting(false);
    }
  };

  return (
    <EditorialPanel
      isOpen={open}
      onClose={onClose}
      title="Start Your Plan"
      badge="Verified Member"
      maxWidth="max-w-xl"
    >
      <div className="p-6 sm:p-10" dir={isRtl ? 'rtl' : 'ltr'}>
        {preselectedPackage && pkg && (
          <div className="mb-6 rounded-2xl border border-[#C5A059]/30 bg-[#C5A059]/10 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#7b6332]">Selected plan</p>
            <p className="mt-1 font-black text-[#0a3030]">{t(pkg.id)} · {pkg.price.toLocaleString()} {pkg.currency}</p>
          </div>
        )}
        {success ? (
          <div className="text-center py-10 space-y-6 animate-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-[#0a3030] uppercase italic">Subscription Protocol Activated!</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Tap confirmed your payment. Your plan is now active and ready for operations review.
            </p>
            <button
              onClick={() => { onClose(); window.location.hash = '#my-plan'; }}
              className="bg-[#0a3030] text-white font-black px-8 py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-[#C5A059] transition-all shadow-xl"
            >
              Go to My Plan Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step Indicators */}
            <div className="flex justify-between items-center bg-gray-100/80 p-2 rounded-2xl mb-6 overflow-x-auto">
              {STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => { if (idx <= step) setStep(idx); }}
                  disabled={idx > step}
                  className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    step === idx ? 'bg-[#0a3030] text-white shadow-md' : 'text-gray-400'
                  }`}
                >
                  {idx + 1}. {s.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 0: Body Assessment */}
            {STEPS[step]?.id === 'assessment' && (
              <div className="space-y-4 animate-in">
                <h3 className="text-[#0a3030] font-black text-lg uppercase italic">Health & Goal Assessment</h3>
                <div className="grid grid-cols-2 gap-4"><label className="text-[10px] font-black uppercase text-gray-400">Gender<select value={assessment.gender} onChange={(event) => setAssessment({ ...assessment, gender: event.target.value as 'male' | 'female' })} className="input-field mt-2 py-3 text-sm font-semibold normal-case"><option value="male">Male</option><option value="female">Female</option></select></label><label className="text-[10px] font-black uppercase text-gray-400">Age<input type="number" min={13} max={110} value={assessment.age} onChange={(event) => setAssessment({ ...assessment, age: Number(event.target.value) })} className="input-field mt-2 py-3 font-bold" /></label></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Current Weight (kg)</label>
                    <input
                      type="number"
                      value={assessment.weight}
                      onChange={(e) => setAssessment({ ...assessment, weight: Number(e.target.value) })}
                      className="input-field py-3 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Standing Height (cm)</label>
                    <input
                      type="number"
                      value={assessment.height}
                      onChange={(e) => setAssessment({ ...assessment, height: Number(e.target.value) })}
                      className="input-field py-3 font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Target Goal</label>
                  <select
                    value={assessment.fitness_goal}
                    onChange={(e) => setAssessment({ ...assessment, fitness_goal: e.target.value })}
                    className="input-field py-3 font-bold bg-white"
                  >
                    <option value="weight_loss">Weight Loss (Calorie Deficit)</option>
                    <option value="maintain">Maintenance & Wellness</option>
                    <option value="gain">Muscle Gain (Calorie Surplus)</option>
                  </select>
                </div>
                <label className="block rounded-2xl border border-primary/10 bg-white p-4"><span className="block text-[10px] font-black uppercase tracking-widest text-primary">BMI report <span className="font-medium normal-case text-gray-400">(optional)</span></span><span className="mt-1 block text-xs text-gray-500">Attach a recent clinic or body-composition report for nutrition review.</span><input type="file" accept="application/pdf,image/jpeg,image/png" className="mt-3 block w-full text-xs" onChange={(event) => { const file = event.target.files?.[0] || null; if (file && (!['application/pdf','image/jpeg','image/png'].includes(file.type) || file.size > 10 * 1024 * 1024)) { setError('Choose a PDF, JPG, or PNG report up to 10 MB.'); event.currentTarget.value = ''; setBmiReport(null); return; } setError(null); setBmiReport(file); }} />{bmiReport && <span className="mt-2 block text-xs font-semibold text-emerald-800">Selected: {bmiReport.name}</span>}</label>
              </div>
            )}

            {/* Step 1: Pick Plan */}
            {STEPS[step]?.id === 'plan' && (
              <div className="space-y-4 animate-in">
                <h3 className="text-[#0a3030] font-black text-lg uppercase italic">Select Plan Protocol</h3>
                <div className="grid grid-cols-1 gap-3">
                  {availablePackages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPkgId(p.id)}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        pkgId === p.id ? 'border-[#0a3030] bg-[#0a3030]/5 shadow-md' : 'border-gray-100 bg-white'
                      }`}
                    >
                      <div>
                        <p className="font-black text-[#0a3030] text-sm">{p.name}</p>
                        <p className="text-gray-400 text-xs">{p.description}</p>
                      </div>
                      <span className="font-black text-[#C5A059] text-sm">{p.price} {p.currency}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Address */}
            {STEPS[step]?.id === 'address' && (
              <div className="space-y-4 animate-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#0a3030] font-black text-lg uppercase italic">Where should we deliver?</h3>
                  <button
                    onClick={locateUserAddress}
                    disabled={locating}
                    className="text-[10px] font-black uppercase text-[#C5A059] hover:underline flex items-center gap-1"
                  >
                    {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                    Use current location (optional)
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-gray-500">Choose where you want the food delivered, then enter that destination below. Your phone’s current location is only used if you tap the optional GPS button.</p>
                {locationMessage && <p role="status" className="text-xs font-semibold text-[#0a3030]">{locationMessage}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Delivery destination">
                  {(['home', 'office', 'gym', 'other'] as const).map((place) => <button type="button" key={place} aria-pressed={deliveryPlace === place} onClick={() => setDeliveryPlace(place)} className={`rounded-xl border px-3 py-3 text-xs font-black uppercase tracking-wider ${deliveryPlace === place ? 'border-[#0a3030] bg-[#0a3030] text-white' : 'border-gray-200 bg-white text-gray-600'}`}>{place === 'office' ? 'Work' : place}</button>)}
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Google Maps Location Link (Optional)</label>
                  <input
                    type="text"
                    value={googleMapsInput}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setGoogleMapsInput(val);
                      if (val.trim()) {
                        const parsed = await parseGoogleMapsUrl(val);
                        if (parsed.isValid && parsed.latitude !== null && parsed.longitude !== null) {
                          setAddress((prev) => ({
                            ...prev,
                            latitude: parsed.latitude,
                            longitude: parsed.longitude,
                            zone: parsed.zone || prev.zone,
                          }));
                          setLocationMessage(parsed.zone
                            ? `Google Maps location detected! Delivery zone ${parsed.zone} applied.`
                            : 'Google Maps location coordinates detected!');
                        }
                      }
                    }}
                    placeholder="Paste Google Maps URL or WhatsApp location link"
                    className="input-field py-3 font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Building Number</label>
                    <input
                      type="text"
                      value={address.building_number}
                      onChange={(e) => setAddress({ ...address, building_number: e.target.value })}
                      placeholder="e.g. Building 14"
                      className="input-field py-3 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Street Name</label>
                    <input
                      type="text"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      placeholder="e.g. Lusail Boulevard"
                      className="input-field py-3 font-bold"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Area Name</label>
                  <input
                    type="text"
                    value={address.area}
                    onChange={(e) => setAddress({ ...address, area: e.target.value })}
                    placeholder="e.g. Lusail / West Bay / The Pearl"
                    className="input-field py-3 font-bold"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Zone Number</label>
                    <input type="text" value={address.zone} onChange={(e) => setAddress({ ...address, zone: e.target.value })} placeholder="e.g. 66" className="input-field py-3 font-bold" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Delivery Phone</label>
                    <input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+974 3312 3456" className="input-field py-3 font-bold" required />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Landmark or delivery instructions (optional)</label>
                  <textarea value={address.delivery_notes} onChange={(e) => setAddress({ ...address, delivery_notes: e.target.value })} placeholder="For example: office reception, gym entrance, or villa gate" className="input-field min-h-24 py-3 font-medium" />
                </div>
              </div>
            )}

            {/* Step 3: Identity / Signup (if not logged in) */}
            {STEPS[step]?.id === 'identity' && (
              <div className="space-y-4 animate-in">
                <h3 className="text-[#0a3030] font-black text-lg uppercase italic">Account Registration</h3>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="input-field py-3 font-bold"
                    required
                  />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Email for payment receipts</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setBillingEmail(e.target.value); }}
                      readOnly={signupOtpStep}
                    placeholder="email@example.com"
                    className="input-field py-3 font-bold"
                    required
                  />
                </div>
                {!signupOtpStep && <fieldset className="space-y-2"><legend className="text-[10px] font-black uppercase text-gray-400">{isRtl ? 'طريقة استلام رمز التحقق' : 'Verification code delivery'}</legend><div className="grid grid-cols-2 gap-3">{(['email','whatsapp'] as const).map((method) => <label key={method} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-3 text-xs font-bold"><input type="radio" name="checkout-otp-channel" checked={signupChannel === method} onChange={() => setSignupChannel(method)} />{method === 'email' ? (isRtl ? 'البريد الإلكتروني' : 'Email') : 'WhatsApp'}</label>)}</div></fieldset>}
                {signupChannel === 'whatsapp' && !signupOtpStep && <div><label className="text-[10px] font-black uppercase text-gray-400">{isRtl ? 'رقم واتساب' : 'WhatsApp number'}</label><div className="mt-1 grid grid-cols-2 gap-2"><select aria-label={isRtl ? 'رمز الدولة' : 'Country calling code'} value={signupCountry} onChange={(e) => setSignupCountry(e.target.value as CountryCode)} className="input-field min-w-0 py-3 text-xs">{signupCountries.map((option) => <option key={option.country} value={option.country}>{option.name} ({option.dialCode})</option>)}</select><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={isRtl ? 'رقم الهاتف' : 'Mobile number'} className="input-field min-w-0 py-3 font-bold" required /></div></div>}
                {signupOtpStep && <div><label className="text-[10px] font-black uppercase text-gray-400">{isRtl ? 'رمز التحقق' : 'Verification code'} · {signupChannel === 'email' ? email : toE164Phone(phone, signupCountry)}</label><input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={signupOtpCode} onChange={(e) => setSignupOtpCode(e.target.value.replace(/\s/g, ''))} placeholder="123456" className="input-field mt-1 py-3 text-center font-bold tracking-[0.3em]" required /></div>}
                {!signupOtpStep && <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field py-3 font-bold"
                     required={!signupOtpStep}
                     hidden={signupOtpStep}
                  />
                </div>}
              </div>
            )}

            {/* Step 4: Payment Selection */}
            {STEPS[step]?.id === 'payment' && (
              <div className="space-y-4 animate-in">
                <h3 className="text-[#0a3030] font-black text-lg uppercase italic">Secure payment with Tap</h3>
                <div><label className="text-[10px] font-black uppercase text-gray-400">Email for payment receipts</label><input type="email" value={billingEmail || email} onChange={(e) => setBillingEmail(e.target.value)} placeholder="email@example.com" className="input-field mt-1 py-3 font-bold" required /></div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-[#C5A059] shrink-0" />
                  <p className="text-gray-600 text-sm">Card and wallet options available through Tap will appear in its secure checkout. Your plan activates only after Tap confirms payment.</p>
                </div>
                <label className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm text-gray-600">
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 accent-[#0a3030]" />
                  <span>I agree to the meal plan terms and authorize the selected Tap payment.</span>
                </label>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-100">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 rounded-2xl bg-gray-100 text-[#0a3030] font-black text-xs uppercase tracking-wider"
                >
                  Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="ml-auto px-8 py-3 rounded-2xl bg-[#0a3030] text-white font-black text-xs uppercase tracking-widest hover:bg-[#C5A059] transition-all"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={submitting}
                  className="ml-auto px-10 py-4 rounded-2xl bg-[#0a3030] text-white font-black text-xs uppercase tracking-widest hover:bg-[#C5A059] transition-all shadow-xl flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : waitingForPayment ? 'Waiting for Tap confirmation' : 'Continue to Tap checkout'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </EditorialPanel>
  );
}
