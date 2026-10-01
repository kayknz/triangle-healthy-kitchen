import { useMemo, useState } from 'react';
import { Loader2, Lock, User, KeyRound, CheckCircle2, AlertCircle, Smartphone, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';
import EditorialPanel from './EditorialPanel';
import { getCountryOptions, toE164Phone, type PhoneChannel } from '@/lib/phone-number';
import type { CountryCode } from 'libphonenumber-js';

interface SubscriberAuthProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = 'signin' | 'signup' | 'forgot';

export default function SubscriberAuth({ isOpen = true, onClose, onSuccess }: SubscriberAuthProps) {
  const { signIn, signInPhone, signUp, signUpPhone, verifySignupOtp, resetPassword } = useAuth();
  const { t, isRtl } = useLanguage();
  const [mode, setMode] = useState<Mode>('signup');

  // Single Identifier Input (Email or Mobile)
  const [identifier, setIdentifier] = useState('');
  const [country, setCountry] = useState<CountryCode>('QA');
  const [channel, setChannel] = useState<PhoneChannel>('email');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // OTP Step State
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const isEmail = mode === 'signup' ? channel === 'email' : mode === 'forgot' || identifier.includes('@');
  const formattedPhone = !isEmail ? toE164Phone(identifier, country) || '' : '';
  const countries = useMemo(() => getCountryOptions(isRtl ? 'ar' : 'en'), [isRtl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetSent(false);

    try {
      if (mode === 'forgot') {
        const result = await resetPassword(identifier);
        if (result.error) {
          setError(result.error);
        } else {
          setResetSent(true);
        }
        return;
      }

      if (mode === 'signup') {
        if (password.length < 6) {
          setError(t('password_length_error') || 'Password must be at least 6 characters.');
          return;
        }

        if (otpStep) {
          const destination = channel === 'email' ? identifier.trim().toLowerCase() : formattedPhone;
          if (!destination) throw new Error(t('error_phone') || 'Enter a valid phone number for the selected country.');
          const verified = await verifySignupOtp(destination, otpCode.trim(), channel);
          if (verified.error) setError(verified.error);
          else onSuccess();
          return;
        }

        if (channel === 'whatsapp') {
          const destination = toE164Phone(identifier, country);
          if (!destination) throw new Error(t('error_phone') || 'Enter a valid phone number for the selected country.');
          const result = await signUpPhone(destination, password, name, 'whatsapp');
          if (result.error) setError(result.error);
          else if (result.needsVerification) setOtpStep(true);
          else onSuccess();
          return;
        }

        if (!identifier.trim() || !identifier.includes('@')) throw new Error(t('error_email') || 'Enter a valid email address.');
        const result = await signUp(identifier.trim().toLowerCase(), password, name, 'customer');
        if (result.error) {
          setError(result.error);
        } else if (result.needsVerification) {
          setOtpStep(true);
        } else {
          onSuccess();
        }
      } else {
        // Sign In (Single OR situation)
        let result;
        if (isEmail) {
          result = await signIn(identifier.trim(), password);
        } else {
          if (!formattedPhone) throw new Error(t('error_phone') || 'Enter a valid phone number for the selected country.');
          result = await signInPhone(formattedPhone, password);
        }

        if (result.error) {
          setError(result.error);
        } else {
          onSuccess();
        }
      }
    } catch (e: any) {
      setError(e.message || t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <EditorialPanel
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'signup' ? (t('create_account') || 'Create Account') : mode === 'signin' ? (t('sign_in') || 'Sign In') : (t('password_recovery') || 'Reset Password')}
      badge={t('essential_plan_access') || 'Active Plan'}
      maxWidth="max-w-md"
    >
      <div className="p-6 sm:p-10" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-[2rem] bg-[#0a3030] flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/10">
            <span className="text-[#C5A059] font-black text-xl italic">TK</span>
          </div>
          <h2 className="text-[#0a3030] font-black text-2xl uppercase italic tracking-tight leading-none">
            {mode === 'signup' ? (t('start_your_plan') || 'Start Your Plan') : mode === 'signin' ? (t('welcome_back') || 'Welcome Back') : (t('password_recovery') || 'Password Recovery')}
          </h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">
            {mode === 'signup' ? (t('join_triangle_desc') || 'Join Triangle Healthy Kitchen') : mode === 'signin' ? (t('access_plan_desc') || 'Access your meal plan & account') : (t('reset_email_desc') || 'Enter your email or phone to receive a reset link')}
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 animate-in">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-xs font-semibold">{error}</p>
          </div>
        )}

        {resetSent && (
          <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 text-emerald-700 text-xs font-semibold flex items-start gap-3 animate-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
            <span>{t('reset_link_sent') || 'Password reset link sent.'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && !otpStep && (
            <div className="space-y-2">
              <label className="text-[#0a3030] text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                {t('full_name') || 'Full Name'}
              </label>
              <div className="relative">
                <User className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 ${isRtl ? 'right-4' : 'left-4'}`} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('full_name') || 'Full Name'}
                  className={`w-full bg-white border border-gray-100 rounded-2xl py-4 text-sm font-bold focus:border-[#0a3030] transition-all ${isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'}`}
                  required
                />
              </div>
            </div>
          )}

          {mode === 'signup' && !otpStep && (
            <fieldset className="space-y-2">
              <legend className="text-[#0a3030] text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{isRtl ? 'طريقة استلام رمز التحقق' : 'Verification code delivery'}</legend>
              <div className="grid grid-cols-2 gap-3">
                {(['email', 'whatsapp'] as const).map((value) => (
                  <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold transition-colors ${channel === value ? 'border-[#0a3030] bg-emerald-50 text-[#0a3030]' : 'border-gray-100 bg-white text-gray-500'}`}>
                    <input type="radio" name="signup-channel" value={value} checked={channel === value} onChange={() => { setChannel(value); setIdentifier(''); setError(null); }} />
                    {value === 'email' ? <Mail className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                    {value === 'email' ? (isRtl ? 'البريد الإلكتروني' : 'Email') : 'WhatsApp'}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* International calling-code dropdown for phone entry */}
          {!otpStep && (
            <div className="space-y-2">
              <label className="text-[#0a3030] text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                {mode === 'signup' ? (channel === 'email' ? (t('operational_email') || 'Email address') : (isRtl ? 'رقم الهاتف' : 'Mobile number')) : (t('email_or_phone') || 'Email or Mobile Number')}
              </label>
              <div className="flex gap-2">
                {(mode === 'signup' ? channel === 'whatsapp' : !isEmail) && (
                  <select aria-label={isRtl ? 'رمز الدولة' : 'Country calling code'} value={country} onChange={(e) => setCountry(e.target.value as CountryCode)} className="w-[43%] min-w-0 rounded-2xl border border-gray-100 bg-white px-2 py-4 text-xs font-bold text-[#0a3030]">
                    {countries.map((item) => <option key={item.country} value={item.country}>{item.name} ({item.dialCode})</option>)}
                  </select>
                )}
                <input
                  type={isEmail ? 'email' : 'tel'}
                  inputMode={isEmail ? 'email' : 'tel'}
                  autoComplete={isEmail ? 'email' : 'tel-national'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={isEmail ? 'email@example.com' : (isRtl ? 'رقم الهاتف' : 'Phone number')}
                  className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white px-4 py-4 text-sm font-bold transition-all focus:border-[#0a3030]"
                  required
                />
              </div>
            </div>
          )}

          {/* OTP Verification Input Step */}
          {otpStep && (
            <div className="space-y-4 animate-in">
              <div className="text-center">
                <p className="text-[#0a3030] text-xs font-bold">
                  {isRtl ? 'تم الإرسال إلى' : 'Code sent to'} <span className="font-black">{channel === 'email' ? identifier : formattedPhone}</span>
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[#0a3030] text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-center block">
                  {isRtl ? 'رمز التحقق' : 'Verification code'}
                </label>
                <input
                  type="text"
                  maxLength={8}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-white border border-gray-100 rounded-2xl py-4 text-center text-xl font-black tracking-[0.5em] text-[#0a3030] outline-none"
                  required
                />
              </div>
            </div>
          )}

          {mode !== 'forgot' && !otpStep && (
            <div className="space-y-2">
              <label className="text-[#0a3030] text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                {t('secure_passkey') || 'Password'}
              </label>
              <div className="relative">
                <Lock className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 ${isRtl ? 'right-4' : 'left-4'}`} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-white border border-gray-100 rounded-2xl py-4 text-sm font-bold focus:border-[#0a3030] transition-all ${isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'}`}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0a3030] text-white font-black py-5 rounded-[2rem] text-[11px] uppercase tracking-[0.4em] transition-all hover:shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : otpStep ? (
              <>{isRtl ? 'تحقق وابدأ' : 'Verify & Continue'} <CheckCircle2 className="w-4 h-4" /></>
            ) : mode === 'signup' ? (
              <>{isRtl ? 'إنشاء الحساب وإرسال الرمز' : 'Create account & send code'}</>
            ) : mode === 'signin' ? (
              (t('sign_in') || 'Sign In')
            ) : (
              (t('send_reset_link') || 'Send Reset Link')
            )}
          </button>
        </form>

        <div className="mt-8 space-y-6 text-center">
          {mode === 'signin' && (
            <button
              onClick={() => { setMode('forgot'); setError(null); setResetSent(false); setOtpStep(false); }}
              className="text-gray-400 hover:text-[#0a3030] text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 w-full"
            >
              <KeyRound className="w-4 h-4 opacity-40" /> {t('forgot_password_q') || 'Forgot password?'}
            </button>
          )}

          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup');
                setError(null);
                setResetSent(false);
                setOtpStep(false);
              }}
              className="text-[#0a3030] text-[10px] font-black uppercase tracking-widest hover:underline"
            >
              {mode === 'signup' ? (t('already_have_account_q') || 'Already have an account? Sign In') : (t('need_an_account_q') || 'Need an account? Start Plan')}
            </button>

            <div className="pt-6 border-t border-gray-50">
              <button
                onClick={() => window.location.hash = '#provider'}
                className="text-gray-300 hover:text-[#C5A059] text-[9px] font-black uppercase tracking-[0.3em] transition-all"
              >
                {t('staff_driver_access') || 'Kitchen Staff & Driver Access'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </EditorialPanel>
  );
}
