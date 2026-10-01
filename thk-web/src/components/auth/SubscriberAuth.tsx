import { useMemo, useState } from 'react';
import { Loader2, Mail, Lock, User, KeyRound, CheckCircle2, Smartphone } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import AuthLayout from './AuthLayout';
import { useLanguage } from '../../lib/LanguageContext';
import { getCountryOptions, toE164Phone, type PhoneChannel } from '../../lib/phone-number';
import type { CountryCode } from 'libphonenumber-js';

interface SubscriberAuthProps {
  onBack: () => void;
  onSuccess: (dual?: boolean) => void;
}

type Mode = 'signin' | 'signup' | 'forgot';

export default function SubscriberAuth({ onBack, onSuccess }: SubscriberAuthProps) {
  const { signIn, signInPhone, signUp, signUpPhone, verifySignupOtp, resetPassword } = useAuth();
  const { t, isRtl } = useLanguage();
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<CountryCode>('QA');
  const [channel, setChannel] = useState<PhoneChannel>('email');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const countries = useMemo(() => getCountryOptions(isRtl ? 'ar' : 'en'), [isRtl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetSent(false);

    try {
      if (mode === 'forgot') {
        const result = await resetPassword(email);
        if (result.error) setError(result.error);
        else setResetSent(true);
        return;
      }

      if (otpStep) {
        const destination = channel === 'email' ? email.trim().toLowerCase() : toE164Phone(phone, country);
        if (!destination) throw new Error('Enter a valid phone number for the selected country.');
        const result = await verifySignupOtp(destination, otpCode.trim(), channel);
        if (result.error) setError(result.error);
        else onSuccess();
      } else if (mode === 'signup') {
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (channel === 'email' && !email.trim()) throw new Error('Enter your email address.');
        if (channel === 'whatsapp' && !toE164Phone(phone, country)) throw new Error('Enter a valid phone number for the selected country.');
        const result = channel === 'email'
          ? await signUp(email.trim().toLowerCase(), password, 'subscriber', name)
          : await signUpPhone(toE164Phone(phone, country)!, password, name, 'whatsapp');
        if (result.error) setError(result.error);
        else if (result.needsVerification) setOtpStep(true);
        else onSuccess();
      } else {
        const destination = channel === 'email' ? email.trim().toLowerCase() : toE164Phone(phone, country);
        if (!destination) throw new Error(channel === 'email' ? 'Enter your email address.' : 'Enter a valid phone number for the selected country.');
        const result = channel === 'email'
          ? await signIn(destination, password)
          : await signInPhone(destination, password);
        if (result.error) setError(result.error);
        else onSuccess(result.dual);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      onBack={onBack}
      title={mode === 'signup' ? t('register_title') : mode === 'signin' ? t('login_title') : t('forgot_password')}
      subtitle={otpStep ? 'Enter the verification code we sent you.' : mode === 'signup' ? t('register_subtitle') : mode === 'signin' ? t('login_subtitle') : 'Enter your email to reset'}
    >
      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-red-600 text-[10px] font-black uppercase tracking-widest leading-relaxed">
          {error}
        </div>
      )}

      {resetSent && (
        <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Check your email for the reset link.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {!otpStep && mode === 'signup' && (
          <div className="space-y-2">
            <label className="text-primary/40 text-[9px] font-black uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
              <User className="w-3 h-3" /> {t('identity_name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="input-field py-5 bg-white/40 font-black italic tracking-tighter"
              required
            />
          </div>
        )}

        {!otpStep && mode !== 'forgot' && (
          <fieldset className="space-y-2">
            <legend className="text-primary/40 text-[9px] font-black uppercase tracking-[0.3em] ml-2">{isRtl ? 'كيف نرسل رمز التحقق؟' : 'How should we send your verification code?'}</legend>
            <div className="grid grid-cols-2 gap-3">
              {(['email', 'whatsapp'] as const).map((value) => (
                <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition-colors ${channel === value ? 'border-primary bg-primary/5 text-primary' : 'border-primary/10 bg-white/40 text-primary/60'}`}>
                  <input type="radio" name="signup-channel" value={value} checked={channel === value} onChange={() => { setChannel(value); setError(null); }} />
                  {value === 'email' ? <Mail className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                  {value === 'email' ? (isRtl ? 'البريد الإلكتروني' : 'Email') : 'WhatsApp'}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {!otpStep && (channel === 'email' || mode === 'forgot') ? <div className="space-y-2">
          <label className="text-primary/40 text-[9px] font-black uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
            <Mail className="w-3 h-3" /> {t('operational_email')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="input-field py-5 bg-white/40 font-black italic tracking-tighter"
            required
          />
        </div> : !otpStep && (
          <div className="space-y-2">
            <label className="text-primary/40 text-[9px] font-black uppercase tracking-[0.3em] ml-2">{isRtl ? 'رقم الهاتف' : 'Mobile number'}</label>
            <div className="flex gap-2">
              <select aria-label="Country calling code" value={country} onChange={(e) => setCountry(e.target.value as CountryCode)} className="input-field w-[45%] min-w-0 bg-white/40 py-4 text-sm">
                {countries.map((item) => <option key={item.country} value={item.country}>{item.name} ({item.dialCode})</option>)}
              </select>
              <input type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={isRtl ? 'رقم الهاتف' : 'Phone number'} className="input-field min-w-0 flex-1 bg-white/40 py-5 font-black" required />
            </div>
          </div>
        )}

        {otpStep && (
          <div className="space-y-2">
            <label className="text-primary/40 text-[9px] font-black uppercase tracking-[0.3em] ml-2">{isRtl ? 'رمز التحقق' : 'Verification code'}</label>
            <p className="px-2 text-xs text-primary/60">{isRtl ? 'تم الإرسال إلى' : 'Sent to'} {channel === 'email' ? email : toE164Phone(phone, country)}</p>
            <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\s/g, ''))} placeholder="Enter code" className="input-field bg-white/40 py-5 text-center text-xl font-black tracking-[0.35em]" required />
          </div>
        )}

        {!otpStep && mode !== 'forgot' && (
          <div className="space-y-2">
            <label className="text-primary/40 text-[9px] font-black uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
              <Lock className="w-3 h-3" /> {t('security_key')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field py-5 bg-white/40 font-black"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-6 text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-3 active:scale-95"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gold" />
          ) : otpStep ? (isRtl ? 'تحقق من الرمز' : 'VERIFY CODE') : mode === 'signup' ? t('register_button') : mode === 'signin' ? t('login_button') : 'SEND RESET LINK'}
        </button>
      </form>

      <div className="mt-10 space-y-6 text-center border-t border-primary/5 pt-8">
        {mode === 'signin' && (
          <button
            onClick={() => { setMode('forgot'); setError(null); setResetSent(false); }}
            className="text-primary/30 hover:text-gold text-[9px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 w-full transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" /> {t('forgot_password')}
          </button>
        )}

        {mode === 'forgot' ? (
          <button
            onClick={() => { setMode('signin'); setError(null); setResetSent(false); }}
            className="text-primary/30 hover:text-gold text-[9px] font-black uppercase tracking-[0.3em] transition-colors"
          >
            {t('return_to_login')}
          </button>
        ) : (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup');
                setOtpStep(false);
                setOtpCode('');
                setError(null);
                setResetSent(false);
              }}
              className="text-primary/30 hover:text-gold text-[9px] font-black uppercase tracking-[0.3em] transition-colors underline underline-offset-8 decoration-primary/10"
            >
              {mode === 'signup'
                ? t('existing_account')
                : t('new_account')}
            </button>

            <div className="pt-6 border-t border-primary/5">
              <button
                onClick={() => window.location.hash = '#provider'}
                className="text-gold hover:text-primary text-[9px] font-black uppercase tracking-[0.4em] transition-all bg-gold/5 px-6 py-3 rounded-xl border border-gold/10"
              >
                Ops & Logistics Portal
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
