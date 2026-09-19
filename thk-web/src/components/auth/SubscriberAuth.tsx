import { useState } from 'react';
import { Loader2, Mail, Lock, User, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import AuthLayout from './AuthLayout';
import { useLanguage } from '../../lib/LanguageContext';

interface SubscriberAuthProps {
  onBack: () => void;
  onSuccess: (dual?: boolean) => void;
}

type Mode = 'signin' | 'signup' | 'forgot';

export default function SubscriberAuth({ onBack, onSuccess }: SubscriberAuthProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

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

      if (mode === 'signup') {
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        const result = await signUp(email, password, 'subscriber', name);
        if (result.error) setError(result.error);
        else onSuccess();
      } else {
        const result = await signIn(email, password);
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
      subtitle={mode === 'signup' ? t('register_subtitle') : mode === 'signin' ? t('login_subtitle') : 'Enter your email to reset'}
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
        {mode === 'signup' && (
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

        <div className="space-y-2">
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
        </div>

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
          ) : mode === 'signup' ? t('register_button') : mode === 'signin' ? t('login_button') : 'SEND RESET LINK'}
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
