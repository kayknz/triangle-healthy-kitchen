import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail, Navigation, Phone, UserRound } from 'lucide-react';
import { useAuth, type UserRole } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';
import EditorialPanel from './EditorialPanel';

interface ProviderAuthProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: (role: UserRole) => void;
}

type Mode = 'signin' | 'apply' | 'verify';

/** Mobile staff entry is intentionally limited to riders. Other operations live on THK Web. */
export default function ProviderAuth({ isOpen = true, onClose, onSuccess }: ProviderAuthProps) {
  const { signIn, signUp } = useAuth();
  const { t, isRtl } = useLanguage();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'apply') {
        const result = await signUp(email.trim().toLowerCase(), password, name.trim(), 'driver', phone.trim());
        if (result.error) {
          setError(result.error);
        } else if (result.needsVerification) {
          setMode('verify');
        } else {
          onSuccess(result.role ?? 'driver');
        }
        return;
      }

      const result = await signIn(email.trim().toLowerCase(), password);
      if (result.error) setError(result.error);
      else onSuccess(result.role ?? 'driver');
    } catch (e: any) {
      setError(e?.message || t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <EditorialPanel isOpen={isOpen} onClose={onClose} title={t('rider_portal_title')} badge={t('delivery_team_badge')} maxWidth="max-w-[500px]">
      <div className="p-6 sm:p-10" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[2rem] border border-white/10 bg-[#0a3030] shadow-xl">
            <Navigation className="h-8 w-8 text-[#C5A059]" />
          </div>
          <h2 className="text-2xl font-black uppercase italic leading-none tracking-tight text-[#0a3030]">
            {mode === 'apply' ? t('rider_apply_title') : mode === 'verify' ? t('rider_verify_title') : t('rider_signin_title')}
          </h2>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            {mode === 'apply' ? t('rider_apply_desc') : mode === 'verify' ? t('rider_verify_desc') : t('rider_signin_desc')}
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs font-semibold text-red-700">{error}</p>
          </div>
        )}

        {mode === 'verify' ? (
          <div role="status" className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-7 w-7 text-emerald-700" />
            <p className="text-sm font-semibold text-emerald-900">{t('rider_verify_success')}</p>
            <button type="button" onClick={() => { setMode('signin'); setPassword(''); }} className="mt-5 rounded-xl bg-[#0a3030] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">
              {t('rider_back_signin')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'apply' && <>
              <label className="block space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a3030]/50">{t('rider_full_name')}</span>
                <span className="relative block">
                  <UserRound className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 ${isRtl ? 'right-4' : 'left-4'}`} />
                  <input type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} className={`w-full rounded-2xl border border-gray-100 bg-white py-4 text-sm font-bold focus:border-[#0a3030] ${isRtl ? 'pl-4 pr-12 text-right' : 'pl-12 pr-4 text-left'}`} />
                </span>
              </label>
              <label className="block space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a3030]/50">{t('rider_phone')}</span>
                <span className="relative block">
                  <Phone className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 ${isRtl ? 'right-4' : 'left-4'}`} />
                  <input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required maxLength={32} placeholder="+974 0000 0000" className={`w-full rounded-2xl border border-gray-100 bg-white py-4 text-sm font-bold focus:border-[#0a3030] ${isRtl ? 'pl-4 pr-12 text-right' : 'pl-12 pr-4 text-left'}`} />
                </span>
              </label>
            </>}

            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a3030]/50">{t('email_identifier') || 'Work Email'}</span>
              <span className="relative block">
                <Mail className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 ${isRtl ? 'right-4' : 'left-4'}`} />
                <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} placeholder="name@example.com" className={`w-full rounded-2xl border border-gray-100 bg-white py-4 text-sm font-bold focus:border-[#0a3030] ${isRtl ? 'pl-4 pr-12 text-right' : 'pl-12 pr-4 text-left'}`} />
              </span>
            </label>

            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a3030]/50">{t('secure_passkey') || 'Password'}</span>
              <span className="relative block">
                <Lock className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 ${isRtl ? 'right-4' : 'left-4'}`} />
                <input type="password" autoComplete={mode === 'apply' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} className={`w-full rounded-2xl border border-gray-100 bg-white py-4 text-sm font-bold focus:border-[#0a3030] ${isRtl ? 'pl-4 pr-12 text-right' : 'pl-12 pr-4 text-left'}`} />
              </span>
            </label>

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-[2rem] bg-[#0a3030] py-5 text-[11px] font-black uppercase tracking-[0.4em] text-white transition-all hover:shadow-2xl active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === 'apply' ? t('rider_submit_application') : (t('sign_in') || 'Sign In')}
            </button>
          </form>
        )}

        {mode !== 'verify' && <div className="mt-7 text-center">
          <p className="text-[10px] leading-5 text-gray-400">{t('rider_application_approval_note')}</p>
          <button type="button" onClick={() => { setError(null); setPassword(''); setMode(mode === 'signin' ? 'apply' : 'signin'); }} className="mt-4 text-xs font-bold text-[#0a3030] underline underline-offset-4">
            {mode === 'signin' ? t('rider_apply_link') : t('rider_signin_link')}
          </button>
          <p className="mt-5 text-[10px] leading-5 text-gray-400">{t('rider_other_ops_web')}</p>
        </div>}
      </div>
    </EditorialPanel>
  );
}
