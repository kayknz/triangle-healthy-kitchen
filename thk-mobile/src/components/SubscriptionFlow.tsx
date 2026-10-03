import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
  Loader2, Navigation, CreditCard, AlertCircle, CheckCircle2, Banknote
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

function FieldLabel({ children, required = true, isRtl = false }: { children?: React.ReactNode; required?: boolean; isRtl?: boolean }) {
  return <span className="inline-flex flex-wrap items-center gap-1.5">{children}<span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black normal-case tracking-normal ${required ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-500'}`}>{required ? (isRtl ? 'مطلوب' : 'Required') : (isRtl ? 'اختياري' : 'Optional')}</span></span>;
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
  const [cashPending, setCashPending] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'tap' | 'cash'>('tap');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<Array<{ id: string; name: string; description: string; price: number; currency: string; meal_periods?: string[] }>>([]);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [initialMenuOptions, setInitialMenuOptions] = useState<Record<string, Array<{ id: string; name: string; kcals: number }>>>({});
  const [initialMenuSelections, setInitialMenuSelections] = useState<Record<string, InitialMenuChoice>>({});
  const [foodAllergies, setFoodAllergies] = useState<string[]>([]);
  const [foodDislikes, setFoodDislikes] = useState('');
  const [menuPeriod, setMenuPeriod] = useState('autumn');
  const [menuLoading, setMenuLoading] = useState(false);

  const [assessment, setAssessment] = useState<{ age: string; gender: 'male' | 'female'; weight: string; height: string; fitness_goal: string; activity_level: string }>({
    age: '30',
    gender: 'male' as 'male' | 'female',
    weight: '75',
    height: '180',
    fitness_goal: 'weight_loss',
    activity_level: 'moderate',
  });
  const [bmiReport, setBmiReport] = useState<File | null>(null);

  const [pkgId, setPkgId] = useState('');
  const [fridayDelivery, setFridayDelivery] = useState(false);
  const packageMenuMeals = availablePackages.find((item) => item.id === pkgId)?.meal_periods || PACKAGE_MEALS[pkgId] || PACKAGE_MENU_MEALS;
  const packageMenuDays = pkgId === 'daily_trial' ? [SERVICE_DAYS[0]] : fridayDelivery ? [...SERVICE_DAYS, 'Friday'] : SERVICE_DAYS;
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
  const [invalidField, setInvalidField] = useState<string | null>(null);
  const checkoutBodyRef = useRef<HTMLDivElement>(null);

  const focusCheckoutField = (fieldId: string) => {
    setInvalidField(fieldId);
    window.requestAnimationFrame(() => {
      const field = checkoutBodyRef.current?.querySelector<HTMLElement>(`[data-field-id="${fieldId}"]`);
      field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field?.focus({ preventScroll: true });
    });
  };
  const clearInvalidField = (fieldId: string) => setInvalidField((current) => current === fieldId ? null : current);
  const invalidFieldClass = (fieldId: string) => invalidField === fieldId ? 'border-red-500 ring-2 ring-red-200' : '';
  const focusNextCheckoutField = (fieldId: string) => {
    const ids: Record<string, string> = {
      assessment_age: 'assessment_weight', assessment_weight: 'assessment_height', assessment_height: 'assessment_goal',
      address_building: 'address_street', address_street: 'address_area', address_area: 'address_zone', address_zone: 'address_phone',
      identity_name: 'identity_email', identity_email: 'identity_password', payment_email: 'payment_terms',
    };
    if (fieldId.startsWith('menu-')) {
      window.setTimeout(() => {
        const fields = Array.from(checkoutBodyRef.current?.querySelectorAll<HTMLElement>('[data-field-id^="menu-"]') || []);
        const nextField = fields[fields.findIndex((field) => field.dataset.fieldId === fieldId) + 1];
        nextField?.focus({ preventScroll: false });
      }, 0);
      return;
    }
    const nextId = ids[fieldId];
    if (nextId) window.requestAnimationFrame(() => checkoutBodyRef.current?.querySelector<HTMLElement>(`[data-field-id="${nextId}"]`)?.focus({ preventScroll: false }));
  };
  const rejectStep = (message: string, fieldId?: string) => {
    setError(message);
    if (fieldId) focusCheckoutField(fieldId);
  };

  const getSteps = () => {
    const base = [
      { label: 'Your Info', id: 'assessment' },
      ...(!preselectedPackage ? [{ label: 'Pick Plan', id: 'plan' }] : []),
      { label: 'Choose meals', id: 'menu' },
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
      void supabase.from('packages').select('id, name, description, price, currency, meal_periods').eq('active', true).order('sort_order').then(({ data, error: packageError }) => {
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
        const serviceWeek = upcomingServiceWeekStart();
        const { data: preparedMenu, error: fallbackError } = await supabase.rpc('ensure_service_week_menu', { p_week_start: serviceWeek });
        if (fallbackError) throw fallbackError;
        const collection = preparedMenu?.collection;
        if (!collection) throw new Error('No published menu is available for this service week yet.');
        const weekStart = new Date(`${serviceWeek}T00:00:00+03:00`).toISOString();
        const endDate = new Date(`${serviceWeek}T12:00:00Z`);
        endDate.setUTCDate(endDate.getUTCDate() + 1);
        const weekEnd = new Date(`${endDate.toISOString().slice(0, 10)}T00:00:00+03:00`).toISOString();
        const { data: menu, error: menuError } = await supabase.from('menu_availability')
          .select('week_number,dish_id,day_of_week,meal_period,collection,is_kitchen_choice,available_from,dishes(id,name,kcals)')
          .eq('collection', collection).eq('is_active', true).gte('available_from', weekStart).lt('available_from', weekEnd).order('available_from', { ascending: false });
        if (menuError) throw menuError;
        if (cancelled) return;
        const rows = menu || [];
        const options: Record<string, Array<{ id: string; name: string; kcals: number; kitchen_choice?: boolean }>> = {};
        const defaults: Record<string, InitialMenuChoice> = {};
        for (const day of packageMenuDays) for (const meal of packageMenuMeals) {
          const key = `${day}|${meal}`;
          const matching = rows.filter((row: any) => row.day_of_week === day && row.meal_period === (meal === 'snacks_2' ? 'snacks' : meal)).flatMap((row: any) => {
            const dish = Array.isArray(row.dishes) ? row.dishes[0] : row.dishes;
            return dish ? [{ id: String(dish.id), name: String(dish.name), kcals: Number(dish.kcals || 0), kitchen_choice: Boolean(row.is_kitchen_choice) }] : [];
          });
          options[key] = matching;
          const priorSnack = defaults[`${day}|snacks`];
          const preferred = matching.find((item) => item.kitchen_choice) || matching[0];
          const chosen = meal === 'snacks_2' && priorSnack
            ? matching.find((item) => item.id !== priorSnack.dish_id) || null
            : preferred;
          if (chosen) defaults[key] = { dish_id: chosen.id, dish_name: chosen.name, dish_kcals: chosen.kcals, day_of_week: day, meal_type: meal === 'snacks' ? 'snack' : meal === 'snacks_2' ? 'snack_2' : meal, menu_period: collection };
        }
        setMenuPeriod(collection); setInitialMenuOptions(options); setInitialMenuSelections(defaults);
      } catch (menuError: any) {
        if (!cancelled) { setInitialMenuOptions({}); setInitialMenuSelections({}); setError(menuError?.message || 'Menu is not available right now.'); }
      } finally { if (!cancelled) setMenuLoading(false); }
    };
    void loadMenu();
    return () => { cancelled = true; };
  }, [open, pkgId, fridayDelivery]);

  if (!open) return null;

  const pkg = availablePackages.find((p) => p.id === pkgId);
  const selectionWindowOpen = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Qatar', weekday: 'short' }).format(new Date()) !== 'Fri';

  const handleNext = async () => {
    const currentStep = STEPS[step]?.id;
    const assessmentAge = Number(assessment.age);
    const assessmentWeight = Number(assessment.weight);
    const assessmentHeight = Number(assessment.height);
    if (currentStep === 'assessment' && (!Number.isFinite(assessmentWeight) || assessmentWeight < 40 || assessmentWeight > 150 || !Number.isFinite(assessmentHeight) || assessmentHeight < 140 || assessmentHeight > 220 || !Number.isFinite(assessmentAge) || assessmentAge < 13 || assessmentAge > 110)) {
      const target = !Number.isFinite(assessmentAge) || assessmentAge < 13 || assessmentAge > 110 ? 'assessment_age' : !Number.isFinite(assessmentWeight) || assessmentWeight < 40 || assessmentWeight > 150 ? 'assessment_weight' : 'assessment_height';
      rejectStep('Enter your age and a valid weight (40–150 kg) and height (140–220 cm).', target);
      return;
    }
    if (currentStep === 'plan' && !pkg) {
      rejectStep('Select an available meal plan to continue.', 'plan_choice');
      return;
    }
    if (currentStep === 'menu') {
      if (menuLoading) { rejectStep('Please wait while the weekly menu loads.'); return; }
      if (!Object.values(initialMenuOptions).some((choices) => choices.length)) { rejectStep('The kitchen has not published a menu yet. Please check back after the weekly menu is released.'); return; }
      const requiredKeys = packageMenuDays.flatMap((day) => packageMenuMeals.map((meal) => `${day}|${meal}`));
      const missingOptions = requiredKeys.find((key) => !(initialMenuOptions[key] || []).length);
      if (missingOptions) return rejectStep('The published menu is missing one or more meals for this package. Please ask the kitchen to complete the weekly menu.', `menu-${missingOptions}`);
      if (!requiredKeys.length) { rejectStep('No meals are available for this package in the published menu.'); return; }
      const missingSelection = requiredKeys.find((key) => !initialMenuSelections[key]);
      if (missingSelection) { rejectStep('Choose one meal for every day and meal period to continue.', `menu-${missingSelection}`); return; }
      const duplicateSnacks = packageMenuMeals.includes('snacks_2') && packageMenuDays.find((day) => initialMenuSelections[`${day}|snacks`]?.dish_id === initialMenuSelections[`${day}|snacks_2`]?.dish_id);
      if (duplicateSnacks) { rejectStep('Choose two different snacks for each day. The published menu needs at least two snack choices.', `menu-${duplicateSnacks}|snacks_2`); return; }
    }
    if (currentStep === 'address' && (!address.building_number.trim() || !address.street.trim() || !address.area.trim() || !address.zone.trim() || !phone.trim())) {
      const target = !address.building_number.trim() ? 'address_building' : !address.street.trim() ? 'address_street' : !address.area.trim() ? 'address_area' : !address.zone.trim() ? 'address_zone' : 'address_phone';
      rejectStep('Enter your phone number and complete the building, street, area, and zone details.', target);
      return;
    }
    if (currentStep === 'identity') {
      if (!name.trim() || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 6 || !phone.trim()) {
        const target = !name.trim() ? 'identity_name' : !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'identity_email' : password.length < 6 ? 'identity_password' : signupChannel === 'whatsapp' ? 'identity_phone' : 'address_phone';
        rejectStep('Enter your name, billing email, phone number, and a password with at least 6 characters.', target);
        return;
      }
      if (signupChannel === 'whatsapp' && !toE164Phone(phone, signupCountry)) {
        rejectStep(t('error_phone') || 'Enter a valid phone number for the selected country.', 'identity_phone');
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        if (signupOtpStep) {
          if (!signupOtpCode.trim()) { rejectStep(isRtl ? 'أدخل رمز التحقق المرسل إليك.' : 'Enter the verification code sent to you.', 'identity_otp'); return; }
          const destination = signupChannel === 'email' ? email.trim().toLowerCase() : toE164Phone(phone, signupCountry)!;
          const verified = await verifySignupOtp(destination, signupOtpCode.trim(), signupChannel);
          if (verified.error) { setError(verified.error); return; }
          setSignupOtpStep(false);
          setSignupOtpCode('');
          setStep((currentStepIndex) => Math.min(currentStepIndex + 1, STEPS.length - 1));
          return;
        }
        const created = signupChannel === 'email'
          ? await signUp(email.trim().toLowerCase(), password, name, 'subscriber', phone)
          : await signUpPhone(toE164Phone(phone, signupCountry)!, password, name, 'whatsapp', email.trim().toLowerCase());
        if (created.error) { setError(created.error); return; }
        if (created.needsVerification) { setSignupOtpStep(true); return; }
        setStep((currentStepIndex) => Math.min(currentStepIndex + 1, STEPS.length - 1));
      } catch (accountError: any) {
        setError(accountError?.message || 'Could not create your account.');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (currentStep === 'payment' && !termsAccepted) {
      rejectStep('Please accept the plan and payment terms to continue.', 'payment_terms');
      return;
    }
    if (currentStep === 'payment' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail.trim() || email.trim() || user?.email || '')) {
      rejectStep('Enter a valid email address for Tap payment receipts.', 'payment_email');
      return;
    }
    setError(null);
    setInvalidField(null);
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
          payment_method: paymentMethod,
          profile: {
            email: billingEmail.trim().toLowerCase() || email.trim().toLowerCase() || activeUser.email || '',
            full_name: name || activeUser.user_metadata?.full_name || 'Triangle Member',
            age: Number(assessment.age),
            gender: assessment.gender,
            bmi_report_path: bmiReportPath,
            phone: (signupChannel === 'whatsapp' ? toE164Phone(phone, signupCountry) : null) || phone || activeUser.user_metadata?.phone || '',
            weight_kg: Number(assessment.weight),
            height_cm: Number(assessment.height),
            fitness_goal: assessment.fitness_goal,
            allergies: foodAllergies,
            dislikes: foodDislikes.split(',').map((item) => item.trim()).filter(Boolean),
            building_number: address.building_number,
            street: address.street,
            area: address.area || 'Doha',
            zone_number: address.zone,
            delivery_notes: [`Deliver to: ${deliveryPlace}`, address.delivery_notes.trim()].filter(Boolean).join(' — '),
            latitude: address.latitude,
              longitude: address.longitude,
            },
            friday_delivery_addon: fridayDelivery,
            initial_menu_selections: Object.values(initialMenuSelections).map((choice) => ({ ...choice, week_start_date: upcomingServiceWeekStart() })),
          },
      });
      if (checkoutError) throw checkoutError;
      if (paymentMethod === 'cash' && checkout?.cash_pending && checkout?.transaction_id) {
        setCashPending(true);
        setSuccess(true);
        return;
      }
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
      contentClassName="min-h-0 flex-1 overflow-hidden"
    >
      <div className="h-full min-h-0 overflow-y-auto overscroll-contain p-6 sm:p-10" ref={checkoutBodyRef} dir={isRtl ? 'rtl' : 'ltr'}>
        {preselectedPackage && pkg && (
          <div className="mb-6 rounded-2xl border border-[#C5A059]/30 bg-[#C5A059]/10 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#7b6332]">{isRtl ? 'الخطة المختارة' : 'Selected plan'}</p>
            <p className="mt-1 font-black text-[#0a3030]">{t(pkg.id)} · {(pkg.price + (fridayDelivery ? 199 : 0)).toLocaleString()} {pkg.currency}{fridayDelivery ? ` · ${t('friday_delivery_addon')}` : ''}</p>
          </div>
        )}
        {success ? (
          <div className="text-center py-10 space-y-6 animate-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-[#0a3030] uppercase italic">{cashPending ? 'Cash collection requested' : 'Subscription Protocol Activated!'}</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              {cashPending ? 'We will reach out to collect cash. Your plan stays pending and activates only after Admin or CEO verifies collection.' : 'Tap confirmed your payment. Your plan is now active and ready for operations review.'}
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
              <div role="alert" aria-live="assertive" className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 0: Body Assessment */}
            {STEPS[step]?.id === 'assessment' && (
              <div className="space-y-4 animate-in">
                <h3 className="text-[#0a3030] font-black text-lg uppercase italic">{isRtl ? 'تقييم الصحة والأهداف' : 'Health & Goal Assessment'}</h3>
                <div className="grid grid-cols-2 items-start gap-4"><label className="block text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'الجنس' : 'Gender'}</FieldLabel><select value={assessment.gender} onChange={(event) => setAssessment({ ...assessment, gender: event.target.value as 'male' | 'female' })} className="input-field mt-2 py-3 text-sm font-semibold normal-case"><option value="male">{isRtl ? 'ذكر' : 'Male'}</option><option value="female">{isRtl ? 'أنثى' : 'Female'}</option></select></label><label className="block text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'العمر' : 'Age'}</FieldLabel><input data-field-id="assessment_age" aria-invalid={invalidField === 'assessment_age'} enterKeyHint="next" onKeyDown={(event) => { if (event.key === 'Enter' && assessment.age) { event.preventDefault(); focusNextCheckoutField('assessment_age'); } }} type="number" inputMode="numeric" min={13} max={110} value={assessment.age} onChange={(event) => { setAssessment({ ...assessment, age: event.target.value }); clearInvalidField('assessment_age'); }} className={`input-field mt-2 py-3 font-bold ${invalidFieldClass('assessment_age')}`} /></label></div>
                <div className="grid grid-cols-2 items-start gap-4">
                  <div>
                    <label className="flex min-h-10 items-end text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'الوزن الحالي (كجم)' : 'Current Weight (kg)'}</FieldLabel></label>
                    <input
                      data-field-id="assessment_weight"
                      aria-invalid={invalidField === 'assessment_weight'}
                      enterKeyHint="next"
                      onKeyDown={(event) => { if (event.key === 'Enter' && assessment.weight) { event.preventDefault(); focusNextCheckoutField('assessment_weight'); } }}
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min={40}
                      max={150}
                      value={assessment.weight}
                      onChange={(e) => { setAssessment({ ...assessment, weight: e.target.value }); clearInvalidField('assessment_weight'); }}
                      className={`input-field py-3 font-bold ${invalidFieldClass('assessment_weight')}`}
                    />
                  </div>
                  <div>
                    <label className="flex min-h-10 items-end text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'الطول (سم)' : 'Standing Height (cm)'}</FieldLabel></label>
                    <input
                      data-field-id="assessment_height"
                      aria-invalid={invalidField === 'assessment_height'}
                      enterKeyHint="next"
                      onKeyDown={(event) => { if (event.key === 'Enter' && assessment.height) { event.preventDefault(); focusNextCheckoutField('assessment_height'); } }}
                      type="number"
                      inputMode="numeric"
                      min={140}
                      max={220}
                      value={assessment.height}
                      onChange={(e) => { setAssessment({ ...assessment, height: e.target.value }); clearInvalidField('assessment_height'); }}
                      className={`input-field py-3 font-bold ${invalidFieldClass('assessment_height')}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'الهدف' : 'Target Goal'}</FieldLabel></label>
                  <select
                    data-field-id="assessment_goal"
                    value={assessment.fitness_goal}
                    onChange={(e) => setAssessment({ ...assessment, fitness_goal: e.target.value })}
                    className="input-field py-3 font-bold bg-white"
                  >
                    <option value="weight_loss">{isRtl ? 'إنقاص الوزن (عجز السعرات)' : 'Weight Loss (Calorie Deficit)'}</option>
                    <option value="maintain">{isRtl ? 'المحافظة على الوزن والعافية' : 'Maintenance & Wellness'}</option>
                    <option value="gain">{isRtl ? 'زيادة العضلات (فائض السعرات)' : 'Muscle Gain (Calorie Surplus)'}</option>
                  </select>
                </div>
                <label className="block rounded-2xl border border-primary/10 bg-white p-4"><span className="block text-[10px] font-black uppercase tracking-widest text-primary"><FieldLabel required={false} isRtl={isRtl}>{isRtl ? 'تقرير مؤشر كتلة الجسم' : 'BMI report'}</FieldLabel></span><span className="mt-1 block text-xs text-gray-500">{isRtl ? 'أرفق تقريراً حديثاً من العيادة أو تقرير تكوين الجسم لمراجعته غذائياً.' : 'Attach a recent clinic or body-composition report for nutrition review.'}</span><input type="file" accept="application/pdf,image/jpeg,image/png" className="mt-3 block w-full text-xs" onChange={(event) => { const file = event.target.files?.[0] || null; if (file && (!['application/pdf','image/jpeg','image/png'].includes(file.type) || file.size > 10 * 1024 * 1024)) { setError(isRtl ? 'اختر تقريراً بصيغة PDF أو JPG أو PNG بحجم يصل إلى ١٠ ميغابايت.' : 'Choose a PDF, JPG, or PNG report up to 10 MB.'); event.currentTarget.value = ''; setBmiReport(null); return; } setError(null); setBmiReport(file); }} />{bmiReport && <span className="mt-2 block text-xs font-semibold text-emerald-800">{isRtl ? 'تم الاختيار:' : 'Selected:'} {bmiReport.name}</span>}</label>
              </div>
            )}

            {/* Step 1: Pick Plan */}
            {STEPS[step]?.id === 'plan' && (
              <div className="space-y-4 animate-in">
                <h3 className="flex items-center justify-between gap-2 text-[#0a3030] font-black text-lg uppercase italic"><span>{isRtl ? 'اختر خطة الوجبات' : 'Select Plan Protocol'}</span><FieldLabel required isRtl={isRtl} /></h3>
                <div className="grid grid-cols-1 gap-3">
                  {availablePackages.map((p) => (
                    <button
                      key={p.id}
                      data-field-id={p.id === availablePackages[0]?.id ? 'plan_choice' : undefined}
                      onClick={() => { setPkgId(p.id); if (p.id === 'daily_trial' || p.id === 'weekly_reset') setFridayDelivery(false); }}
                      aria-invalid={invalidField === 'plan_choice'}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        invalidField === 'plan_choice' ? 'border-red-500 ring-2 ring-red-200' : pkgId === p.id ? 'border-[#0a3030] bg-[#0a3030]/5 shadow-md' : 'border-gray-100 bg-white'
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
                {pkgId && !['daily_trial', 'weekly_reset'].includes(pkgId) && <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${fridayDelivery ? 'border-[#0a3030] bg-[#0a3030]/5' : 'border-gray-200 bg-white'}`}><input type="checkbox" className="mt-1 h-4 w-4 accent-[#0a3030]" checked={fridayDelivery} onChange={(event) => setFridayDelivery(event.target.checked)}/><span className="text-sm"><strong className="block text-[#0a3030]">{t('friday_delivery_addon')} · {t('friday_delivery_price')}</strong><span className="mt-1 block text-gray-500">{t('friday_delivery_addon_desc')}</span></span></label>}
              </div>
            )}

            {STEPS[step]?.id === 'menu' && (
              <div className="space-y-4 animate-in">
                <div><h3 className="text-[#0a3030] font-black text-lg uppercase italic">{isRtl ? 'اختر وجباتك' : 'Choose your meals'}</h3><p className="mt-1 text-sm text-gray-500">{isRtl ? 'اختر وجباتك من قائمة المطبخ المنشورة لهذا الأسبوع. يتم تحديد اختيار المطبخ مسبقاً عند توفره.' : 'Select meals from this week’s published kitchen menu. Kitchen’s choice is preselected where available.'}</p></div>
                <section className="rounded-2xl border border-red-200 bg-white p-4"><h4 className="flex items-center justify-between gap-2 font-black uppercase text-[#0a3030]">{isRtl ? 'الحساسية وملاحظات المطبخ' : 'Allergies and kitchen notes'}<FieldLabel required={false} isRtl={isRtl} /></h4><p className="mt-1 text-xs text-gray-500">{isRtl ? 'تُشارك مع المطبخ لضمان سلامة الطعام والتحضير المناسب.' : 'Shared with the kitchen for food safety and preparation.'}</p><div className="mt-3 flex flex-wrap gap-2">{CHECKOUT_ALLERGENS.map((item) => { const selected = foodAllergies.includes(item); return <label key={item} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${selected ? 'border-red-600 bg-red-600 text-white' : 'border-gray-200 text-gray-700'}`}><input type="checkbox" checked={selected} onChange={(event) => setFoodAllergies((current) => event.target.checked ? [...current,item] : current.filter((value) => value !== item))}/>{isRtl ? (t(item.toLowerCase()) || item) : item}</label>; })}</div><label className="mt-4 block text-xs font-bold text-gray-700"><FieldLabel required={false} isRtl={isRtl}>{isRtl ? 'مكونات يجب تجنبها أو ملاحظات عامة للمطبخ' : 'Ingredients to avoid or general kitchen notes'}</FieldLabel><textarea value={foodDislikes} onChange={(event) => setFoodDislikes(event.target.value)} placeholder={isRtl ? 'مثال: بدون بصل، توابل خفيفة' : 'For example: no onions, mild spice'} className="input-field mt-2 min-h-20 w-full py-3 normal-case"/></label></section>
                {menuLoading ? <p className="py-6 text-sm text-gray-500">{isRtl ? 'جارٍ تحميل القائمة…' : 'Loading menu…'}</p> : !Object.values(initialMenuOptions).some((choices) => choices.length) ? <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{isRtl ? 'لم ينشر المطبخ قائمة الطعام بعد. يرجى العودة بعد نشر قائمة الأسبوع.' : 'The kitchen has not published a menu yet. Check back after the weekly menu is released.'}</p> : packageMenuDays.map((day) => {
                  const meals = packageMenuMeals.filter((meal) => (initialMenuOptions[`${day}|${meal}`] || []).length);
                  if (!meals.length) return null;
                  return <section key={day} className="rounded-2xl border border-gray-100 bg-white p-4"><h4 className="mb-3 font-black uppercase text-[#0a3030]">{day}</h4>{meals.map((meal) => { const key = `${day}|${meal}`; const choices = initialMenuOptions[key]; return <label key={key} className="mb-3 block text-xs font-bold uppercase text-gray-500"><FieldLabel required isRtl={isRtl}>{t(meal) || meal}</FieldLabel><select data-field-id={`menu-${key}`} aria-invalid={invalidField === `menu-${key}`} value={initialMenuSelections[key]?.dish_id || ''} onChange={(event) => { const selected = choices.find((choice) => choice.id === event.target.value); if (selected) setInitialMenuSelections((previous) => ({ ...previous, [key]: { dish_id: selected.id, dish_name: selected.name, dish_kcals: selected.kcals, day_of_week: day, meal_type: meal === 'snacks' ? 'snack' : meal === 'snacks_2' ? 'snack_2' : meal, menu_period: menuPeriod } })); clearInvalidField(`menu-${key}`); focusNextCheckoutField(`menu-${key}`); }} className={`input-field mt-1 py-3 normal-case ${invalidFieldClass(`menu-${key}`)}`}>{choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.name} · {choice.kcals} kcal</option>)}</select></label>; })}</section>;
                })}
              </div>
            )}

            {/* Step 2: Address */}
            {STEPS[step]?.id === 'address' && (
              <div className="space-y-4 animate-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#0a3030] font-black text-lg uppercase italic">{isRtl ? 'أين تريد استلام التوصيل؟' : 'Where should we deliver?'}</h3>
                  <button
                    onClick={locateUserAddress}
                    disabled={locating}
                    className="text-[10px] font-black uppercase text-[#C5A059] hover:underline flex items-center gap-1"
                  >
                    {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                    Use current location (optional)
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-gray-500">{isRtl ? 'اختر مكان استلام الطعام وأدخل العنوان أدناه. لن يُستخدم موقع هاتفك الحالي إلا عند الضغط على زر تحديد الموقع الاختياري.' : 'Choose where you want the food delivered, then enter that destination below. Your phone’s current location is only used if you tap the optional GPS button.'}</p>
                {locationMessage && <p role="status" className="text-xs font-semibold text-[#0a3030]">{locationMessage}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Delivery destination">
                  {(['home', 'office', 'gym', 'other'] as const).map((place) => <button type="button" key={place} aria-pressed={deliveryPlace === place} onClick={() => setDeliveryPlace(place)} className={`rounded-xl border px-3 py-3 text-xs font-black uppercase tracking-wider ${deliveryPlace === place ? 'border-[#0a3030] bg-[#0a3030] text-white' : 'border-gray-200 bg-white text-gray-600'}`}>{place === 'office' ? 'Work' : place}</button>)}
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400"><FieldLabel required={false} isRtl={isRtl}>{isRtl ? 'رابط الموقع من خرائط Google' : 'Google Maps Location Link'}</FieldLabel></label>
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
                    <label className="text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'رقم المبنى' : 'Building Number'}</FieldLabel></label>
                    <input
                      data-field-id="address_building"
                      enterKeyHint="next"
                      onKeyDown={(event) => { if (event.key === 'Enter' && address.building_number.trim()) { event.preventDefault(); focusNextCheckoutField('address_building'); } }}
                      type="text"
                      value={address.building_number}
                      aria-invalid={invalidField === 'address_building'}
                      onChange={(e) => { setAddress({ ...address, building_number: e.target.value }); clearInvalidField('address_building'); }}
                      placeholder="e.g. Building 14"
                      className={`input-field py-3 font-bold ${invalidFieldClass('address_building')}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'اسم الشارع' : 'Street Name'}</FieldLabel></label>
                    <input
                      data-field-id="address_street"
                      enterKeyHint="next"
                      onKeyDown={(event) => { if (event.key === 'Enter' && address.street.trim()) { event.preventDefault(); focusNextCheckoutField('address_street'); } }}
                      type="text"
                      value={address.street}
                      aria-invalid={invalidField === 'address_street'}
                      onChange={(e) => { setAddress({ ...address, street: e.target.value }); clearInvalidField('address_street'); }}
                      placeholder="e.g. Lusail Boulevard"
                      className={`input-field py-3 font-bold ${invalidFieldClass('address_street')}`}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'اسم المنطقة' : 'Area Name'}</FieldLabel></label>
                  <input
                    data-field-id="address_area"
                    enterKeyHint="next"
                    onKeyDown={(event) => { if (event.key === 'Enter' && address.area.trim()) { event.preventDefault(); focusNextCheckoutField('address_area'); } }}
                    type="text"
                    value={address.area}
                    aria-invalid={invalidField === 'address_area'}
                    onChange={(e) => { setAddress({ ...address, area: e.target.value }); clearInvalidField('address_area'); }}
                    placeholder="e.g. Lusail / West Bay / The Pearl"
                    className={`input-field py-3 font-bold ${invalidFieldClass('address_area')}`}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'رقم المنطقة' : 'Zone Number'}</FieldLabel></label>
                    <input data-field-id="address_zone" aria-invalid={invalidField === 'address_zone'} enterKeyHint="next" onKeyDown={(event) => { if (event.key === 'Enter' && address.zone.trim()) { event.preventDefault(); focusNextCheckoutField('address_zone'); } }} type="text" value={address.zone} onChange={(e) => { setAddress({ ...address, zone: e.target.value }); clearInvalidField('address_zone'); }} placeholder="e.g. 66" className={`input-field py-3 font-bold ${invalidFieldClass('address_zone')}`} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'هاتف التوصيل' : 'Delivery Phone'}</FieldLabel></label>
                    <input data-field-id="address_phone" aria-invalid={invalidField === 'address_phone'} type="tel" autoComplete="tel" value={phone} onChange={(e) => { setPhone(e.target.value); clearInvalidField('address_phone'); }} placeholder="+974 3312 3456" className={`input-field py-3 font-bold ${invalidFieldClass('address_phone')}`} required />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400"><FieldLabel required={false} isRtl={isRtl}>{isRtl ? 'علامة مميزة أو تعليمات التوصيل' : 'Landmark or delivery instructions'}</FieldLabel></label>
                  <textarea value={address.delivery_notes} onChange={(e) => setAddress({ ...address, delivery_notes: e.target.value })} placeholder="For example: office reception, gym entrance, or villa gate" className="input-field min-h-24 py-3 font-medium" />
                </div>
              </div>
            )}

            {/* Step 3: Identity / Signup (if not logged in) */}
            {STEPS[step]?.id === 'identity' && (
              <div className="space-y-4 animate-in">
                <h3 className="text-[#0a3030] font-black text-lg uppercase italic">{isRtl ? 'إنشاء الحساب' : 'Account Registration'}</h3>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'الاسم الكامل' : 'Full Name'}</FieldLabel></label>
                  <input
                    data-field-id="identity_name"
                    aria-invalid={invalidField === 'identity_name'}
                    enterKeyHint="next"
                    onKeyDown={(event) => { if (event.key === 'Enter' && name.trim()) { event.preventDefault(); focusNextCheckoutField('identity_name'); } }}
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearInvalidField('identity_name'); }}
                    placeholder="Full Name"
                    className={`input-field py-3 font-bold ${invalidFieldClass('identity_name')}`}
                    required
                  />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'البريد الإلكتروني لإيصالات الدفع' : 'Email for payment receipts'}</FieldLabel></label>
                    <input
                      data-field-id="identity_email"
                      aria-invalid={invalidField === 'identity_email'}
                      enterKeyHint="next"
                      onKeyDown={(event) => { if (event.key === 'Enter' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { event.preventDefault(); focusNextCheckoutField('identity_email'); } }}
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setBillingEmail(e.target.value); clearInvalidField('identity_email'); }}
                      readOnly={signupOtpStep}
                    placeholder="email@example.com"
                    className={`input-field py-3 font-bold ${invalidFieldClass('identity_email')}`}
                    required
                  />
                </div>
                {!signupOtpStep && <fieldset className="space-y-2"><legend className="text-[10px] font-black uppercase text-gray-400"><FieldLabel required={false} isRtl={isRtl}>{isRtl ? 'طريقة استلام رمز التحقق' : 'Verification code delivery'}</FieldLabel></legend><div className="grid grid-cols-2 gap-3">{(['email','whatsapp'] as const).map((method) => <label key={method} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-3 text-xs font-bold"><input type="radio" name="checkout-otp-channel" checked={signupChannel === method} onChange={() => setSignupChannel(method)} />{method === 'email' ? (isRtl ? 'البريد الإلكتروني' : 'Email') : 'WhatsApp'}</label>)}</div></fieldset>}
                {signupChannel === 'whatsapp' && !signupOtpStep && <div><label className="text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'رقم واتساب' : 'WhatsApp number'}</FieldLabel></label><div className="mt-1 grid grid-cols-2 gap-2"><select aria-label={isRtl ? 'رمز الدولة' : 'Country calling code'} value={signupCountry} onChange={(e) => setSignupCountry(e.target.value as CountryCode)} className="input-field min-w-0 py-3 text-xs">{signupCountries.map((option) => <option key={option.country} value={option.country}>{option.name} ({option.dialCode})</option>)}</select><input data-field-id="identity_phone" aria-invalid={invalidField === 'identity_phone'} type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); clearInvalidField('identity_phone'); }} placeholder={isRtl ? 'رقم الهاتف' : 'Mobile number'} className={`input-field min-w-0 py-3 font-bold ${invalidFieldClass('identity_phone')}`} required /></div></div>}
                {signupOtpStep && <div><label className="text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'رمز التحقق' : 'Verification code'}</FieldLabel> · {signupChannel === 'email' ? email : toE164Phone(phone, signupCountry)}</label><input data-field-id="identity_otp" aria-invalid={invalidField === 'identity_otp'} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={signupOtpCode} onChange={(e) => { setSignupOtpCode(e.target.value.replace(/\s/g, '')); clearInvalidField('identity_otp'); }} placeholder="123456" className={`input-field mt-1 py-3 text-center font-bold tracking-[0.3em] ${invalidFieldClass('identity_otp')}`} required /></div>}
                {!signupOtpStep && <div>
                  <label className="text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'كلمة المرور' : 'Password'}</FieldLabel></label>
                  <input
                    data-field-id="identity_password"
                    aria-invalid={invalidField === 'identity_password'}
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearInvalidField('identity_password'); }}
                    placeholder="••••••••"
                    className={`input-field py-3 font-bold ${invalidFieldClass('identity_password')}`}
                     required={!signupOtpStep}
                     hidden={signupOtpStep}
                  />
                </div>}
              </div>
            )}

            {/* Step 4: Payment Selection */}
            {STEPS[step]?.id === 'payment' && (
              <div className="space-y-4 animate-in">
                <h3 className="text-[#0a3030] font-black text-lg uppercase italic">{isRtl ? 'اختر طريقة الدفع' : 'Choose payment method'}</h3>
                <div><label className="text-[10px] font-black uppercase text-gray-400"><FieldLabel required isRtl={isRtl}>{isRtl ? 'البريد الإلكتروني لإيصالات الدفع' : 'Email for payment receipts'}</FieldLabel></label><input data-field-id="payment_email" aria-invalid={invalidField === 'payment_email'} type="email" value={billingEmail || email} onChange={(e) => { setBillingEmail(e.target.value); clearInvalidField('payment_email'); }} placeholder="email@example.com" className={`input-field mt-1 py-3 font-bold ${invalidFieldClass('payment_email')}`} required /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => setPaymentMethod('tap')} className={`rounded-2xl border p-5 text-left flex items-start gap-3 ${paymentMethod === 'tap' ? 'border-[#0a3030] bg-[#0a3030] text-white' : 'border-gray-100 bg-white text-gray-600'}`}><CreditCard className="w-5 h-5 text-[#C5A059] shrink-0"/><span><strong className="block">{isRtl ? 'الدفع الإلكتروني عبر Tap' : 'Pay online with Tap'}</strong><small className="mt-1 block opacity-80">{isRtl ? 'ادفع بالبطاقة أو المحفظة. تُفعّل الخطة بعد تأكيد الدفع.' : 'Card and wallet checkout; plan activates after confirmation.'}</small></span></button>
                  <button type="button" onClick={() => setPaymentMethod('cash')} className={`rounded-2xl border p-5 text-left flex items-start gap-3 ${paymentMethod === 'cash' ? 'border-[#0a3030] bg-[#0a3030] text-white' : 'border-gray-100 bg-white text-gray-600'}`}><Banknote className="w-5 h-5 text-[#C5A059] shrink-0"/><span><strong className="block">{isRtl ? 'الدفع النقدي' : 'Cash collection'}</strong><small className="mt-1 block opacity-80">{isRtl ? 'سنتواصل لترتيب التحصيل قبل تفعيل خطتك.' : 'We’ll arrange collection before activating your plan.'}</small></span></button>
                </div>
                {paymentMethod === 'cash' && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{isRtl ? 'ستبقى خطتك معلّقة حتى يؤكد المسؤول أو الرئيس التنفيذي استلام المبلغ النقدي.' : 'Your plan stays pending until cash collection is verified by Admin or CEO.'}</p>}
                <label className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm text-gray-600">
                  <input data-field-id="payment_terms" aria-invalid={invalidField === 'payment_terms'} type="checkbox" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); clearInvalidField('payment_terms'); }} className={`mt-1 h-5 w-5 accent-[#0a3030] ${invalidField === 'payment_terms' ? 'outline outline-2 outline-red-500' : ''}`} />
                  <span><FieldLabel required isRtl={isRtl}>{isRtl ? `أوافق على شروط خطة الوجبات وأفوّض ${paymentMethod === 'cash' ? 'تحصيل النقد قبل التفعيل' : 'دفعة Tap المحددة'}.` : `I agree to the meal plan terms and authorize ${paymentMethod === 'cash' ? 'cash collection before activation' : 'the selected Tap payment'}.`}</FieldLabel></span>
                </label>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="sticky bottom-0 z-20 flex shrink-0 justify-between border-t border-gray-100 bg-[#F5F3EB]/95 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-8px_24px_rgba(10,48,48,0.06)] backdrop-blur-md sm:px-10">
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : waitingForPayment ? 'Waiting for Tap confirmation' : paymentMethod === 'cash' ? 'Request cash collection' : 'Continue to Tap checkout'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </EditorialPanel>
  );
}
