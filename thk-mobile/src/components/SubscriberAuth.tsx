import { useState } from 'react';
import { Loader2, Mail, Lock, User, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';
import EditorialPanel from './EditorialPanel';

interface SubscriberAuthProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = 'signin' | 'signup' | 'forgot';

export default function SubscriberAuth({ isOpen = true, onClose, onSuccess }: SubscriberAuthProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const { t, isRtl } = useLanguage();
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
        const result = await signUp(email, password, name);
        if (result.error) {
          setError(result.error);
        } else {
          onSuccess();
        }
      } else {
        const result = await signIn(email, password);
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
      <div className="p-8 sm:p-10" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-[2rem] bg-[#0a3030] flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/10">
            <span className="text-[#C5A059] font-black text-xl italic">TK</span>
          </div>
          <h2 className="text-[#0a3030] font-black text-2xl uppercase italic tracking-tight leading-none">
            {mode === 'signup' ? (t('start_your_plan') || 'Start Your Plan') : mode === 'signin' ? (t('welcome_back') || 'Welcome Back') : (t('password_recovery') || 'Password Recovery')}
          </h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">
            {mode === 'signup' ? (t('join_triangle_desc') || 'Join Triangle Healthy Kitchen') : mode === 'signin' ? (t('access_plan_desc') || 'Access your meal plan & account') : (t('reset_email_desc') || 'Enter your email to receive a reset link')}
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
            <span>{t('reset_link_sent') || 'Password reset link sent to your email.'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
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

          <div className="space-y-2">
            <label className="text-[#0a3030] text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
              {t('email_address') || 'Email Address'}
            </label>
            <div className="relative">
              <Mail className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 ${isRtl ? 'right-4' : 'left-4'}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email_address') || 'Email Address'}
                className={`w-full bg-white border border-gray-100 rounded-2xl py-4 text-sm font-bold focus:border-[#0a3030] transition-all ${isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'}`}
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'signup' ? (t('start_today') || 'Start Plan') : mode === 'signin' ? (t('sign_in') || 'Sign In') : (t('send_reset_link') || 'Send Reset Link'))}
          </button>
        </form>

        <div className="mt-10 space-y-6 text-center">
          {mode === 'signin' && (
            <button
              onClick={() => { setMode('forgot'); setError(null); setResetSent(false); }}
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
