import { useMemo, useState } from 'react';
import { Loader2, Mail, Lock, KeyRound, CheckCircle2, Smartphone } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import AuthLayout from './AuthLayout';
import { useLanguage } from '../../lib/LanguageContext';
import { getCountryOptions, toE164Phone, type PhoneChannel } from '../../lib/phone-number';
import type { CountryCode } from 'libphonenumber-js';

interface SubscriberAuthProps {
  onBack: () => void;
  onSuccess: (dual?: boolean) => void;
  onChoosePlan: () => void;
}

type Mode = 'signin' | 'forgot';

export default function SubscriberAuth({ onBack, onSuccess, onChoosePlan }: SubscriberAuthProps) {
  const { signIn, signInPhone, resetPassword } = useAuth();
  const { t, isRtl } = useLanguage();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<CountryCode>('QA');
  const [channel, setChannel] = useState<PhoneChannel>('email');
  const [password, setPassword] = useState('');
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

      {
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
      title={mode === 'signin' ? t('login_title') : t('forgot_password')}
      subtitle={mode === 'signin' ? t('login_subtitle') : 'Enter your email to reset'}
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
        {mode !== 'forgot' && (
          <fieldset className="space-y-2">
            <legend className="text-primary/40 text-[9px] font-black uppercase tracking-[0.3em] ml-2">{isRtl ? 'تسجيل الدخول باستخدام' : 'Sign in using'}</legend>
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

        {(channel === 'email' || mode === 'forgot') ? <div className="space-y-2">
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
        </div> : (
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

        {mode !== 'forgot' && (
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
          ) : mode === 'signin' ? t('login_button') : 'SEND RESET LINK'}
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
                setError(null);
                setResetSent(false);
                onChoosePlan();
              }}
              className="text-primary/30 hover:text-gold text-[9px] font-black uppercase tracking-[0.3em] transition-colors underline underline-offset-8 decoration-primary/10"
            >
              {isRtl ? 'عميل جديد؟ اختر خطة أولاً' : 'New customer? Choose a plan first'}
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
