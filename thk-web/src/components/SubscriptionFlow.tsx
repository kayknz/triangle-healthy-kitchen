import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Loader2, Navigation, Clock, Sparkles, AlertCircle, CreditCard, X, Banknote,
  Shield, Star, RefreshCcw, Activity, Trophy, ArrowUpRight, Lock, Mail, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { useAuth } from '../lib/auth';
import { getCountryOptions, toE164Phone, type PhoneChannel } from '../lib/phone-number';
import type { CountryCode } from 'libphonenumber-js';
import { useLanguage } from '../lib/LanguageContext';
import { PACKAGE_MEALS } from '../types/subscription';
import SecuringProtocol from './SecuringProtocol';
import { resolveQatarDeliveryZone } from '../lib/delivery-zone';
import { parseGoogleMapsUrl } from '../lib/location-utils';

interface SubscriptionFlowProps {
  open: boolean;
  onClose: () => void;
  preselectedPackage?: string | null;
}

type InitialMenuChoice = { dish_id: string; dish_name: string; dish_kcals: number; day_of_week: string; meal_type: string; menu_period: string };
const SERVICE_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const PACKAGE_MENU_MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'];
const CHECKOUT_ALLERGENS = ['Fish', 'Dairy', 'Eggs', 'Gluten', 'Seafood', 'Sesame', 'Nuts'];
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

export default function SubscriptionFlow({ open, onClose, preselectedPackage }: SubscriptionFlowProps) {
  const navigate = useNavigate();
  const { user, signUp, signUpPhone, verifySignupOtp, refreshAuth } = useAuth();
  const { t, isRtl } = useLanguage();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cashPending, setCashPending] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'tap' | 'cash'>('tap');

  // Biological Metrics
  const [assessment, setAssessment] = useState({
    age: 30,
    gender: 'male' as 'male' | 'female',
    weight: 75,
    height: 180,
    weightUnit: 'kg' as 'kg' | 'lbs',
    heightUnit: 'cm' as 'cm' | 'ft',
    fitness_goal: 'maintain',
    activity_level: 'moderate',
  });
  const [bmiReport, setBmiReport] = useState<File | null>(null);

  // Identity (for unauthenticated users)
  const [identity, setIdentity] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [billingEmail, setBillingEmail] = useState(String(user?.email || ''));
  const [signupChannel, setSignupChannel] = useState<PhoneChannel>('email');
  const [signupOtpStep, setSignupOtpStep] = useState(false);
  const [signupOtpCode, setSignupOtpCode] = useState('');
  const [signupCountry, setSignupCountry] = useState<CountryCode>('QA');
  const signupCountries = useMemo(() => getCountryOptions(isRtl ? 'ar' : 'en'), [isRtl]);
  const [phone, setPhone] = useState(String(user?.user_metadata?.phone || ''));

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
  const [deliveryPlace, setDeliveryPlace] = useState<'home' | 'office' | 'gym' | 'other'>('home');
  const [googleMapsInput, setGoogleMapsInput] = useState('');

  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<Array<{ id: string; name: string; description: string; price: number; currency: string; kcals: number; meal_periods?: string[] }>>([]);
  const [initialMenuOptions, setInitialMenuOptions] = useState<Record<string, Array<{ id: string; name: string; kcals: number }>>>({});
  const [initialMenuSelections, setInitialMenuSelections] = useState<Record<string, InitialMenuChoice>>({});
  const [foodAllergies, setFoodAllergies] = useState<string[]>([]);
  const [foodDislikes, setFoodDislikes] = useState('');
  const [menuPeriod, setMenuPeriod] = useState('autumn');
  const [menuLoading, setMenuLoading] = useState(false);
  const packageMenuMeals = availablePackages.find((item) => item.id === pkgId)?.meal_periods || PACKAGE_MEALS[pkgId] || PACKAGE_MENU_MEALS;


  // Dynamic Steps: Insert Identity if user is not logged in
  const STEPS = [
    { label: t('your_info'), id: 'assessment' },
    ...(preselectedPackage ? [] : [{ label: t('pick_plan'), id: 'plan' }]),
    { label: 'Choose meals', id: 'menu' },
    { label: t('delivery_address'), id: 'address' },
    ...(user ? [] : [{ label: t('create_account'), id: 'identity' }]),
    { label: t('payment'), id: 'payment' },
    { label: t('review_start'), id: 'audit' }
  ];

  useEffect(() => {
    if (open) {
      setStep(0);
      setSuccess(false);
      setSignupOtpStep(false);
      setSignupOtpCode('');
      if (preselectedPackage) setPkgId(preselectedPackage);
    }
  }, [open, preselectedPackage]);

  useEffect(() => {
    if (!open || !pkgId) return;
    let cancelled = false;
    const loadInitialMenu = async () => {
      setMenuLoading(true);
      try {
        const now = new Date().toISOString();
        const [{ data: settings }, { data: menu, error: menuError }] = await Promise.all([
          supabase.from('global_settings').select('active_season').maybeSingle(),
          supabase.from('menu_availability').select('week_number,dish_id,day_of_week,meal_period,collection,is_kitchen_choice,available_from,dishes(id,name,kcals)')
            .eq('is_active', true).lte('available_from', now).order('available_from', { ascending: false }),
        ]);
        if (menuError) throw menuError;
        if (cancelled) return;
        const collection = settings?.active_season || 'autumn';
        const published = (menu || []).filter((row: any) => row.collection === collection);
        const latestRelease = published[0]?.available_from;
        const rows = latestRelease ? published.filter((row: any) => row.available_from === latestRelease) : [];
        setMenuPeriod(collection);
        const options: Record<string, Array<{ id: string; name: string; kcals: number }>> = {};
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
        setInitialMenuOptions(options);
        setInitialMenuSelections(defaults);
      } catch (menuLoadError: any) {
        if (!cancelled) { setInitialMenuOptions({}); setInitialMenuSelections({}); setError(menuLoadError?.message || 'Menu is not available right now.'); }
      } finally { if (!cancelled) setMenuLoading(false); }
    };
    void loadInitialMenu();
    return () => { cancelled = true; };
  }, [open, pkgId]);

  useEffect(() => {
    if (user?.user_metadata?.phone && !phone) setPhone(String(user.user_metadata.phone));
  }, [user, phone]);

  const pkg = availablePackages.find((p) => p.id === pkgId);
  const selectionWindowOpen = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Qatar', weekday: 'short' }).format(new Date()) !== 'Fri';

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void supabase.from('packages').select('id, name, description, price, currency, kcals, meal_periods').eq('active', true).order('sort_order').then(({ data, error: packageError }) => {
      if (cancelled) return;
      if (packageError) {
        setError('Meal plans are temporarily unavailable. Please try again shortly.');
        return;
      }
      const rows = data || [];
      setAvailablePackages(rows);
      setPkgId((current) => rows.some((row) => row.id === (preselectedPackage || current)) ? (preselectedPackage || current) : (rows[0]?.id || ''));
    });
    return () => { cancelled = true; };
  }, [open, preselectedPackage]);

  if (!open) return null;

  const handleNext = async () => {
    const currentStepId = STEPS[step].id;
    if (currentStepId === 'assessment' && (!assessment.weight || !assessment.height || assessment.age < 13 || assessment.age > 110)) return setError('Enter your age, weight, and height to continue.');
    if (currentStepId === 'plan' && !pkgId) return setError(t('error_select_package'));
    if (currentStepId === 'menu') {
      if (menuLoading) return setError('Please wait while the weekly menu loads.');
      if (!Object.keys(initialMenuOptions).some((key) => (initialMenuOptions[key] || []).length)) return setError('The menu is not published yet. Please check back after the kitchen releases this week’s menu.');
      const requiredKeys = SERVICE_DAYS.flatMap((day) => packageMenuMeals.map((meal) => `${day}|${meal}`).filter((key) => (initialMenuOptions[key] || []).length));
      if (!requiredKeys.length) return setError('No meals are available for this package in the published menu.');
      if (requiredKeys.some((key) => !initialMenuSelections[key])) return setError('Choose one meal for every day and meal period to continue.');
    }
    if (currentStepId === 'address' && (!address.building_number.trim() || !address.street.trim() || !address.area.trim() || !address.zone.trim() || !phone.trim())) return setError('Enter your phone number and complete the building, street, area, and zone details.');
    if (currentStepId === 'identity') {
      if (!identity.fullName || !identity.email || identity.password.length < 6) return setError('Enter your name and billing email. Password must be at least 6 characters.');
      if (signupChannel === 'whatsapp' && !toE164Phone(phone, signupCountry)) return setError('Enter a valid phone number for the selected country.');
      setSubmitting(true);
      setError(null);
      try {
        if (signupOtpStep) {
          const destination = signupChannel === 'email' ? identity.email.trim().toLowerCase() : toE164Phone(phone, signupCountry)!;
          const verified = await verifySignupOtp(destination, signupOtpCode.trim(), signupChannel);
          if (verified.error) return setError(verified.error);
          setSignupOtpStep(false);
          setSignupOtpCode('');
          setStep((currentStepIndex) => Math.min(currentStepIndex + 1, STEPS.length - 1));
          return;
        }
        const created = signupChannel === 'email'
          ? await signUp(identity.email.trim().toLowerCase(), identity.password, 'subscriber', identity.fullName)
          : await signUpPhone(toE164Phone(phone, signupCountry)!, identity.password, identity.fullName, 'whatsapp', identity.email.trim().toLowerCase());
        if (created.error) return setError(created.error);
        if (created.needsVerification) {
          setSignupOtpStep(true);
          return;
        }
        setStep((currentStepIndex) => Math.min(currentStepIndex + 1, STEPS.length - 1));
      } catch (signupError: any) {
        setError(signupError?.message || 'Could not create your account.');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (currentStepId === 'payment' && !termsAccepted) return setError(t('legal_error'));
    if (currentStepId === 'payment' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail.trim() || identity.email.trim() || user?.email || '')) return setError('Enter a valid email address for Tap payment receipts.');

    setError(null);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const detectLocation = () => {
    setLocating(true);
    setLocationMessage(null);
    setError(null);
    if (!navigator.geolocation) {
      setError("Location signal restricted.");
      setLocating(false);
      return;
    }
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
      () => { setLocationMessage('Could not get your location. Enter the delivery address manually.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubscribe = async () => {
    setSubmitting(true);
    setError(null);
    let checkoutWindow: Window | null = null;

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

        throw new Error('Sign in to your verified account before continuing to checkout.');
      }

      if (!finalUser) throw new Error("Connection failed.");

      if (!pkg) throw new Error('Select an available meal plan before continuing.');
      // Open synchronously during the click gesture so browsers do not block
      // Tap's hosted checkout after the asynchronous upload/function request.
      if (paymentMethod === 'tap') checkoutWindow = window.open('about:blank', '_blank');
      let bmiReportPath: string | null = null;
      if (bmiReport) {
        const objectName = `${finalUser.id}/${crypto.randomUUID()}-${bmiReport.name.replace(/[^\w.-]/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from('bmi-reports').upload(objectName, bmiReport, { contentType: bmiReport.type, upsert: false });
        if (uploadError) throw new Error(`BMI report upload failed: ${uploadError.message}`);
        bmiReportPath = objectName;
      }
      // The Edge Function creates a paused subscriber when needed. Only the
      // verified Tap webhook activates the selected plan.
      const { data: result, error: fetchErr } = await supabase.functions.invoke('tap-checkout', {
        body: {
          package_id: pkg.id,
          payment_method: paymentMethod,
          profile: {
            email: billingEmail.trim().toLowerCase() || identity.email.trim().toLowerCase() || finalUser.email || '',
            full_name: identity.fullName || finalUser.user_metadata?.full_name || 'Member',
            age: assessment.age,
            gender: assessment.gender,
            bmi_report_path: bmiReportPath,
            weight_kg: assessment.weight,
            height_cm: assessment.height,
            fitness_goal: assessment.fitness_goal,
            allergies: foodAllergies,
            dislikes: foodDislikes.split(',').map((item) => item.trim()).filter(Boolean),
            phone: (signupChannel === 'whatsapp' ? toE164Phone(phone, signupCountry) : null) || phone.trim(),
            building_number: address.building_number,
            street: address.street,
            area: address.area,
            zone_number: address.zone,
            delivery_notes: [`Deliver to: ${deliveryPlace}`, address.delivery_notes.trim()].filter(Boolean).join(' — '),
            latitude: address.latitude,
            longitude: address.longitude,
            initial_menu_selections: Object.values(initialMenuSelections).map((choice) => ({ ...choice, week_start_date: upcomingServiceWeekStart() })),
          },
        }
      });

      if (fetchErr) throw fetchErr;
      if (paymentMethod === 'cash' && result?.cash_pending && result?.transaction_id) { setCashPending(true); setSuccess(true); return; }
      if (!result?.checkout_url || !result?.transaction_id) throw new Error(result?.error || 'Tap did not return a valid checkout session.');
      if (checkoutWindow) checkoutWindow.location.href = result.checkout_url;
      else window.location.assign(result.checkout_url);
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 3000));
        const { data: transaction, error: statusError } = await supabase.from('payment_transactions').select('status').eq('id', result.transaction_id).maybeSingle();
        if (statusError) throw statusError;
        if (transaction?.status === 'captured') { checkoutWindow?.close(); await refreshAuth(); setSuccess(true); return; }
        if (transaction && ['failed', 'cancelled', 'voided'].includes(transaction.status)) { checkoutWindow?.close(); throw new Error('Tap did not capture the payment. You can try checkout again.'); }
      }
      throw new Error('Payment is still awaiting Tap confirmation. Your plan will activate automatically after the verified payment arrives.');

    } catch (e: any) {
      if (checkoutWindow && !checkoutWindow.closed) {
        try {
          if (checkoutWindow.location.href === 'about:blank') checkoutWindow.close();
        } catch {
          // A redirected Tap window is cross-origin; leave it open for the customer.
        }
      }
      setError(e.message || "Payment Gateway Offline");
    } finally {
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
            {preselectedPackage && pkg && <p className="mt-3 text-xs font-bold uppercase tracking-wider text-primary/60">Selected: {t(pkg.id)} · {pkg.price.toLocaleString()} {pkg.currency}</p>}
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
          {success ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center gap-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><Check className="w-10 h-10" /></div>
              <h3 className="text-2xl font-black uppercase italic text-primary">{cashPending ? 'Cash collection requested' : 'Payment confirmed'}</h3>
              <p className="max-w-md text-sm text-primary/60">{cashPending ? 'We’ll reach out to collect the cash. Your plan stays pending and activates only after Admin or CEO verifies collection.' : 'Tap confirmed your payment and your plan is active. The kitchen team can now prepare your meals.'}</p>
              <button onClick={close} className="btn-primary px-10 py-5">Continue</button>
            </div>
          ) : <>
          <AnimatePresence>
            {submitting && <SecuringProtocol message="Preparing your Plan" subtitle="Securely connecting..." />}
          </AnimatePresence>

          {error && <div className="mb-10 bg-red-50 border border-red-100 rounded-[2rem] px-8 py-6 text-red-600 text-xs font-black uppercase tracking-widest flex items-start gap-4"><AlertCircle className="w-5 h-5 shrink-0" /><p>{error}</p></div>}

          {STEPS[step].id === 'assessment' && (
            <div className="space-y-12 animate-reveal">
              <h3 className="text-xl font-black uppercase italic text-primary tracking-tight">{t('your_info')}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="space-y-2 text-xs font-black uppercase tracking-widest text-primary/50">Gender<select value={assessment.gender} onChange={(event) => setAssessment({ ...assessment, gender: event.target.value as 'male' | 'female' })} className="input-field py-4 text-sm font-semibold normal-case"><option value="male">Male</option><option value="female">Female</option></select></label><label className="space-y-2 text-xs font-black uppercase tracking-widest text-primary/50">Age<input type="number" min={13} max={110} value={assessment.age} onChange={(event) => setAssessment({ ...assessment, age: Number(event.target.value) })} className="input-field py-4 text-sm font-semibold" /></label></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <MetricPicker label="Weight" value={assessment.weight} unit="KG" min={40} max={150} onChange={(v:any) => setAssessment({...assessment, weight: v})} />
                 <MetricPicker label="Height" value={assessment.height} unit="CM" min={140} max={220} onChange={(v:any) => setAssessment({...assessment, height: v})} />
              </div>
              <label className="block rounded-2xl border border-primary/10 bg-white/70 p-5"><span className="block text-xs font-black uppercase tracking-widest text-primary">BMI report <span className="font-medium normal-case text-primary/50">(optional)</span></span><span className="mt-1 block text-xs text-primary/55">Attach a recent clinic or body-composition report so the nutrition team can review your plan.</span><input type="file" accept="application/pdf,image/jpeg,image/png" className="mt-4 block w-full text-sm" onChange={(event) => { const file = event.target.files?.[0] || null; if (file && (!['application/pdf','image/jpeg','image/png'].includes(file.type) || file.size > 10 * 1024 * 1024)) { setError('Choose a PDF, JPG, or PNG report up to 10 MB.'); event.currentTarget.value = ''; setBmiReport(null); return; } setError(null); setBmiReport(file); }} />{bmiReport && <span className="mt-2 block text-xs font-semibold text-emerald-800">Selected: {bmiReport.name}</span>}</label>
            </div>
          )}

          {STEPS[step].id === 'plan' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-reveal">
               {availablePackages.map((p) => (
                 <button key={p.id} onClick={() => setPkgId(p.id)} className={`text-left p-6 sm:p-12 rounded-[2.5rem] border-2 transition-all duration-500 relative overflow-hidden group ${pkgId === p.id ? 'border-primary bg-primary text-white shadow-4xl scale-[1.02]' : 'border-primary/5 bg-white/40 hover:border-gold/30 shadow-xl'}`}>
                   <h4 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-1 sm:mb-2 italic">{t(p.id)}</h4>
                   <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-8 sm:mb-10">{p.kcals} KCAL Plan</p>
                   <p className="text-2xl sm:text-3xl font-black italic tracking-tighter">{p.price} <span className="opacity-40 text-xs font-bold uppercase not-italic ml-1">{p.currency}</span></p>
                 </button>
               ))}
            </div>
          )}

          {STEPS[step].id === 'menu' && (
            <div className="space-y-6 animate-reveal">
              <div><h3 className="text-xl font-black uppercase italic text-primary">Choose your meals</h3><p className="mt-2 text-sm text-primary/60">Select from the kitchen’s published choices for your plan. Kitchen’s choice is preselected where available.</p></div>
              <section className="rounded-2xl border border-red-200 bg-white/80 p-5"><h4 className="font-black uppercase text-primary">Allergies and kitchen notes</h4><p className="mt-1 text-xs text-primary/60">These notes are shared with the kitchen for food safety and preparation.</p><div className="mt-3 flex flex-wrap gap-2">{CHECKOUT_ALLERGENS.map((item) => <label key={item} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${foodAllergies.includes(item) ? 'border-red-600 bg-red-600 text-white' : 'border-primary/15 text-primary/70'}`}><input type="checkbox" checked={foodAllergies.includes(item)} onChange={(event) => setFoodAllergies((current) => event.target.checked ? [...current,item] : current.filter((value) => value !== item))}/>{item}</label>)}</div><label className="mt-4 block text-xs font-bold text-primary/70">Ingredients to avoid or general kitchen notes<textarea value={foodDislikes} onChange={(event) => setFoodDislikes(event.target.value)} placeholder="For example: no onions, mild spice" className="input-field mt-2 min-h-20 w-full py-3 normal-case"/></label></section>
              {menuLoading ? <div className="flex items-center gap-3 text-sm font-semibold text-primary/60"><Loader2 className="h-5 w-5 animate-spin"/>Loading this week’s menu…</div> : !Object.values(initialMenuOptions).some((choices) => choices.length) ? <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900">No published meals are available yet. The kitchen needs to publish a menu before checkout can continue.</div> : SERVICE_DAYS.map((day) => {
                const meals = packageMenuMeals.filter((meal) => (initialMenuOptions[`${day}|${meal}`] || []).length);
                if (!meals.length) return null;
                return <section key={day} className="rounded-2xl border border-primary/10 bg-white/70 p-5"><h4 className="mb-4 font-black uppercase tracking-wider text-primary">{t(day) || day}</h4><div className="grid gap-3 sm:grid-cols-2">{meals.map((meal) => { const key = `${day}|${meal}`; const choices = initialMenuOptions[key]; return <label key={key} className="space-y-2 text-xs font-bold uppercase tracking-wider text-primary/60">{t(meal) || meal}<select value={initialMenuSelections[key]?.dish_id || ''} onChange={(event) => { const selected = choices.find((choice) => choice.id === event.target.value); if (!selected) return; setInitialMenuSelections((previous) => ({ ...previous, [key]: { dish_id: selected.id, dish_name: selected.name, dish_kcals: selected.kcals, day_of_week: day, meal_type: meal === 'snacks' ? 'snack' : meal, menu_period: menuPeriod } })); }} className="input-field py-3 normal-case">{choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.name} · {choice.kcals} kcal</option>)}</select></label>; })}</div></section>;
              })}
            </div>
          )}

          {STEPS[step].id === 'address' && (
            <div className="space-y-12 animate-reveal">
               <div className="space-y-3"><h3 className="text-xl font-black uppercase italic text-primary">Where should we deliver?</h3><p className="text-sm text-primary/55">Choose the destination and enter that address. Your current location is only used if you tap the optional GPS button below.</p></div>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="group" aria-label="Delivery destination">
                 {(['home', 'office', 'gym', 'other'] as const).map((place) => <button type="button" key={place} aria-pressed={deliveryPlace === place} onClick={() => setDeliveryPlace(place)} className={`rounded-2xl border-2 px-4 py-4 text-xs font-black uppercase tracking-widest transition-colors ${deliveryPlace === place ? 'border-primary bg-primary text-white' : 'border-primary/10 bg-white text-primary/60 hover:border-gold'}`}>{place === 'office' ? 'Work' : place}</button>)}
               </div>
               <button onClick={detectLocation} disabled={locating} className={`w-full flex items-center justify-center gap-4 bg-white border border-primary/10 py-8 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-xl hover:border-gold transition-all active:scale-95 group ${locating ? 'animate-pulse' : ''}`}>
                  {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5 text-gold" />} Use current location to fill address (optional)
               </button>
               {locationMessage && <p role="status" className="-mt-8 text-sm font-semibold text-primary/70">{locationMessage}</p>}
               <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Google Maps Location Link (Optional)</p>
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
                    className="input-field py-7 font-black bg-white/60 text-xs"
                  />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3"><p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Building / Unit</p><input type="text" value={address.building_number} onChange={(e) => setAddress({...address, building_number: e.target.value})} placeholder="e.g. Building 12" className="input-field py-7 font-black bg-white/60" /></div>
                  <div className="space-y-3"><p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Street Name</p><input type="text" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} placeholder="e.g. Al-Duhail St" className="input-field py-7 font-black bg-white/60" /></div>
               </div>
               <div className="space-y-3"><label htmlFor="checkout-delivery-notes" className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Landmark or delivery instructions (optional)</label><textarea id="checkout-delivery-notes" value={address.delivery_notes} onChange={(e) => setAddress({ ...address, delivery_notes: e.target.value })} placeholder="For example: office reception, gym entrance, or villa gate" className="input-field min-h-28 py-5 font-medium bg-white/60" /></div>
               <div className="space-y-3"><label htmlFor="checkout-phone" className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Delivery Contact Number</label><input id="checkout-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+974 3312 3456" className="input-field py-7 font-black bg-white/60" /></div>
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
                  {!signupOtpStep && <fieldset className="space-y-3"><legend className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">{isRtl ? 'طريقة إرسال رمز التحقق' : 'Verification code delivery'}</legend><div className="grid grid-cols-2 gap-3">{(['email','whatsapp'] as const).map((method) => <label key={method} className="flex items-center gap-2 rounded-xl border border-primary/10 bg-white/60 px-4 py-3 text-sm font-bold"><input type="radio" name="checkout-otp-channel" checked={signupChannel === method} onChange={() => setSignupChannel(method)} />{method === 'email' ? (isRtl ? 'البريد الإلكتروني' : 'Email') : 'WhatsApp'}</label>)}</div></fieldset>}
                  <div className="space-y-3"><p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">{isRtl ? 'البريد الإلكتروني لإيصال الدفع' : 'Email for payment receipts'}</p><div className="relative"><Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" /><input type="email" value={identity.email || billingEmail} readOnly={signupOtpStep} onChange={(e) => { setIdentity({...identity, email: e.target.value}); setBillingEmail(e.target.value); }} placeholder={isRtl ? 'أدخل بريدك الإلكتروني' : 'Enter your email'} className="input-field py-7 pl-16 font-black bg-white/60" required /></div></div>
                  {signupChannel === 'whatsapp' && !signupOtpStep && <div className="space-y-3"><p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">WhatsApp number</p><div className="grid grid-cols-2 gap-3"><select aria-label="Country calling code" value={signupCountry} onChange={(e) => setSignupCountry(e.target.value as CountryCode)} className="input-field min-w-0 bg-white/60">{signupCountries.map((option) => <option key={option.country} value={option.country}>{option.name} ({option.dialCode})</option>)}</select><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number" className="input-field min-w-0 bg-white/60" required /></div></div>}
                  {signupOtpStep ? <div className="space-y-3"><p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Enter verification code sent to {signupChannel === 'email' ? identity.email : toE164Phone(phone, signupCountry)}</p><input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={signupOtpCode} onChange={(e) => setSignupOtpCode(e.target.value.replace(/\s/g, ''))} placeholder="Verification code" className="input-field bg-white/60 text-center tracking-[0.3em]" required /></div> : <div className="space-y-3"><p className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">Your Password (6+ Chars)</p><div className="relative"><Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" /><input type="password" value={identity.password} onChange={(e) => setIdentity({...identity, password: e.target.value})} placeholder="••••••••" className="input-field py-7 pl-16 font-black bg-white/60" required /></div></div>}
               </div>
            </div>
          )}

          {STEPS[step].id === 'payment' && (
            <div className="space-y-10 animate-reveal">
               <div className="space-y-3"><label htmlFor="tap-receipt-email" className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-2">{isRtl ? 'البريد الإلكتروني لإيصال الدفع' : 'Email for payment receipts'}</label><input id="tap-receipt-email" type="email" value={billingEmail || identity.email} onChange={(e) => setBillingEmail(e.target.value)} placeholder={isRtl ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'} className="input-field py-5 font-bold bg-white/60" required /></div>
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button type="button" onClick={() => setPaymentMethod('tap')} className={`flex items-center gap-6 p-8 rounded-[2.5rem] border-2 text-left ${paymentMethod === 'tap' ? 'border-primary bg-primary text-white shadow-4xl' : 'border-primary/10 bg-white/60 text-primary'}`}>
                    <CreditCard className="w-7 h-7 text-gold" />
                    <div className="text-left"><p className="text-lg font-black uppercase tracking-tight italic leading-none">Secure payment with Tap</p><p className="text-[9px] uppercase tracking-[0.2em] mt-2 text-white/60">Card and wallet options appear in Tap checkout</p></div>
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('cash')} className={`flex items-center gap-5 rounded-[2.5rem] border-2 p-8 text-left ${paymentMethod === 'cash' ? 'border-primary bg-primary text-white' : 'border-primary/10 bg-white/60 text-primary'}`}><Banknote className="h-7 w-7 text-gold"/><span><strong className="block text-base font-black uppercase">Cash collection</strong><small className="mt-2 block text-xs opacity-70">Pay before your plan starts; Admin/CEO verifies collection.</small></span></button>
               </div>
               {paymentMethod === 'cash' && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Your plan will remain pending until cash collection is confirmed.</p>}

               <label className="flex items-start gap-8 mt-12 cursor-pointer group px-4">
                  <button type="button" onClick={() => setTermsAccepted(!termsAccepted)} className={`mt-0.5 w-10 h-10 rounded-[1.2rem] border-2 flex items-center justify-center transition-all ${termsAccepted ? 'border-primary bg-primary shadow-xl scale-110' : 'border-primary/10 group-hover:border-primary/30 bg-white'}`}>
                    {termsAccepted && <Check className="w-6 h-6 text-white" />}
                  </button>
                  <span className="text-primary/40 text-[12px] italic font-medium leading-relaxed pt-1">I agree to the terms and authorize {paymentMethod === 'cash' ? 'cash collection before activation' : 'the healthy meal plan payment'}.</span>
               </label>
            </div>
          )}

          {STEPS[step].id === 'audit' && (
            <div className="space-y-12 animate-reveal">
               <div className="glass-card p-0 overflow-hidden border-primary/10 bg-white/40 shadow-4xl rounded-[4rem]">
                  <ReviewRow label="Name" value={identity.fullName || user?.user_metadata?.full_name} />
                  <ReviewRow label="Plan Type" value={t(pkg?.id || '')} />
                  <ReviewRow label="Deliver to" value={`${deliveryPlace === 'office' ? 'Work' : deliveryPlace}: ${address.building_number}, ${address.street}, ${address.area}`} />
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
          </>}
        </div>

        {/* Footer */}
        {!success && <div className={`px-6 sm:px-12 py-8 sm:py-12 border-t border-primary/5 flex items-center justify-between bg-white/80 backdrop-blur-md flex-shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-primary/30 hover:text-primary transition-colors disabled:opacity-0 group flex items-center gap-2 active:scale-90"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back</button>
          <button onClick={step === STEPS.length - 1 ? handleSubscribe : handleNext} disabled={submitting} className="btn-primary px-8 sm:px-24 py-5 sm:py-8 text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.5em] shadow-4xl active:scale-95 flex items-center gap-4 sm:gap-6 transition-all group">
            {step === STEPS.length - 1 ? 'START MEALS' : 'PROCEED'}
            <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>}
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
