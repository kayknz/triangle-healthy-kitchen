import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '../supabase';
import SubscriberAuth from '../components/auth/SubscriberAuth';
import ProviderAuth from '../components/auth/ProviderAuth';
import { type UserRole } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const [authType, setAuthType] = useState<'subscriber' | 'provider'>('subscriber');
  const [passwordRecovery, setPasswordRecovery] = useState(() => new URLSearchParams(window.location.search).get('password-recovery') === '1');

  useEffect(() => {
    const handleHash = () => {
      setAuthType(window.location.hash === '#provider' ? 'provider' : 'subscriber');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSuccess = (role?: UserRole, dual?: boolean) => {
    // If they have dual access, send them to home to trigger the selector
    if (dual) {
      window.location.replace('/');
      return;
    }
    const target = role === 'rider' ? '/rider' : role && ['owner', 'ceo', 'admin', 'kitchen', 'transport'].includes(role) ? '/dashboard' : '/account';
    window.location.replace(target);
  };

  if (authType === 'provider') {
    return (
      <ProviderAuth
        onBack={() => window.location.hash = ''}
        onSuccess={(role, dual) => handleSuccess(role, dual)}
      />
    );
  }

  if (passwordRecovery) return <PasswordRecoveryPage onDone={() => { setPasswordRecovery(false); window.history.replaceState({}, '', '/login#provider'); setAuthType('provider'); }} />;

  return (
    <SubscriberAuth
      onBack={() => window.location.href = '/'}
      onSuccess={(dual) => handleSuccess(undefined, dual)}
      onChoosePlan={() => navigate('/plans')}
    />
  );
}

function PasswordRecoveryPage({ onDone }: { onDone: () => void }) {
  const { isRtl } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const update = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (password.length < 8) { setError(isRtl ? 'استخدم ٨ أحرف على الأقل.' : 'Use at least 8 characters.'); return; }
    if (password !== confirmation) { setError(isRtl ? 'كلمتا المرور غير متطابقتين.' : 'The passwords do not match.'); return; }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) setError(updateError.message);
    else setDone(true);
  };
  return <main dir={isRtl ? 'rtl' : 'ltr'} className={`flex min-h-screen items-center justify-center bg-background p-6 ${isRtl ? 'text-right' : 'text-left'}`}><section className="w-full max-w-md rounded-3xl border border-primary/10 bg-white p-8 shadow-xl"><h1 className="text-2xl font-black text-primary">{isRtl ? 'إعادة تعيين كلمة المرور' : 'Reset your password'}</h1>{done ? <div className="mt-6 space-y-4"><p className="text-sm text-emerald-800">{isRtl ? 'تم تحديث كلمة المرور. سجّل الدخول إلى العمليات باستخدام كلمة المرور الجديدة.' : 'Password updated. Sign in to Operations with your new password.'}</p><button className="btn-primary w-full py-4" onClick={onDone}>{isRtl ? 'العودة إلى دخول الموظفين' : 'Return to staff sign-in'}</button></div> : <form onSubmit={update} className="mt-6 space-y-4"><label className="block text-sm font-semibold">{isRtl ? 'كلمة المرور الجديدة' : 'New password'}<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required className="input-field mt-2 py-4"/></label><label className="block text-sm font-semibold">{isRtl ? 'تأكيد كلمة المرور' : 'Confirm password'}<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} required className="input-field mt-2 py-4"/></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={saving} className="btn-primary w-full py-4">{saving ? (isRtl ? 'جارٍ الحفظ…' : 'Saving…') : (isRtl ? 'تحديث كلمة المرور' : 'Update password')}</button></form>}</section></main>;
}
