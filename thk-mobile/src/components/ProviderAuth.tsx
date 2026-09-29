import { useState } from 'react';
import { AlertCircle, Loader2, Lock, Mail, Navigation } from 'lucide-react';
import { useAuth, type UserRole } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';
import EditorialPanel from './EditorialPanel';

interface ProviderAuthProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: (role: UserRole) => void;
}

/** Mobile staff entry is intentionally limited to rider accounts. Other operations live on THK Web. */
export default function ProviderAuth({ isOpen = true, onClose, onSuccess }: ProviderAuthProps) {
  const { signIn } = useAuth();
  const { t, isRtl } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result.error) setError(result.error);
      else onSuccess(result.role ?? 'driver');
    } catch (e: any) {
      setError(e?.message || t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <EditorialPanel isOpen={isOpen} onClose={onClose} title="Rider Portal" badge="Delivery Team" maxWidth="max-w-[500px]">
      <div className="p-6 sm:p-10" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[2rem] border border-white/10 bg-[#0a3030] shadow-xl">
            <Navigation className="h-8 w-8 text-[#C5A059]" />
          </div>
          <h2 className="text-2xl font-black uppercase italic leading-none tracking-tight text-[#0a3030]">Rider Sign In</h2>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Delivery assignments and route updates</p>
        </div>

        {error && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs font-semibold text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a3030]/50">{t('email_identifier') || 'Work Email'}</span>
            <span className="relative block">
              <Mail className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 ${isRtl ? 'right-4' : 'left-4'}`} />
              <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="rider@trianglehk.com" className={`w-full rounded-2xl border border-gray-100 bg-white py-4 text-sm font-bold focus:border-[#0a3030] ${isRtl ? 'pl-4 pr-12 text-right' : 'pl-12 pr-4 text-left'}`} />
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a3030]/50">{t('secure_passkey') || 'Password'}</span>
            <span className="relative block">
              <Lock className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 ${isRtl ? 'right-4' : 'left-4'}`} />
              <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} className={`w-full rounded-2xl border border-gray-100 bg-white py-4 text-sm font-bold focus:border-[#0a3030] ${isRtl ? 'pl-4 pr-12 text-right' : 'pl-12 pr-4 text-left'}`} />
            </span>
          </label>

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-[2rem] bg-[#0a3030] py-5 text-[11px] font-black uppercase tracking-[0.4em] text-white transition-all hover:shadow-2xl active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (t('sign_in') || 'Sign In')}
          </button>
        </form>
        <p className="mt-7 text-center text-[10px] leading-5 text-gray-400">CEO, admin, kitchen, and transport operations are available on the web portal.</p>
      </div>
    </EditorialPanel>
  );
}
