import { useState } from 'react';
import { ChefHat, Loader2, Lock, Mail, ShieldAlert, Truck, Crown, KeyRound } from 'lucide-react';
import { useAuth, type UserRole } from '../../lib/auth';
import AuthLayout from './AuthLayout';

interface ProviderAuthProps {
  onBack: () => void;
  onSuccess: (role: UserRole, dual?: boolean) => void;
}

const WORKSPACES = [
  { id: 'ceo', label: 'CEO', icon: Crown },
  { id: 'admin', label: 'Admin', icon: ShieldAlert },
  { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
  { id: 'transport', label: 'Transport', icon: Truck },
] as const;

export default function ProviderAuth({ onBack, onSuccess }: ProviderAuthProps) {
  const { signIn, resetPassword } = useAuth();
  const [workspace, setWorkspace] = useState<(typeof WORKSPACES)[number]['id']>('ceo');
  const [email, setEmail] = useState('kevmulgeo@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); setNotice(null); setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result.error) { setError(result.error); return; }
      if (email.trim().toLowerCase() === 'kevmulgeo@gmail.com' && result.role === 'ceo') {
        localStorage.setItem('thk_ops_sector', workspace);
      } else {
        localStorage.removeItem('thk_ops_sector');
      }
      onSuccess(result.role ?? 'subscriber', result.dual);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed. Check your email and password.');
    } finally { setLoading(false); }
  };

  const sendPasswordReset = async () => {
    setError(null); setNotice(null);
    if (!email.trim()) { setError('Enter your staff email first.'); return; }
    setLoading(true);
    try {
      const result = await resetPassword(email.trim());
      if (result.error) setError(result.error);
      else setNotice('If this email has an account, Supabase has sent a password reset link.');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout onBack={onBack} title="Operations sign in" subtitle="Choose the workspace to open after your staff account signs in.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" aria-label="Operations workspace">
          {WORKSPACES.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setWorkspace(id)} aria-pressed={workspace === id} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${workspace === id ? 'border-primary bg-primary text-white' : 'border-primary/10 bg-white text-primary/60 hover:border-gold'}`}><Icon size={14}/>{label}</button>)}
        </div>
        <p className="-mt-3 text-xs leading-relaxed text-primary/60">All workspaces use the same Supabase account password. Your CEO account can open every operations workspace; Rider delivery tools remain in the mobile app.</p>
        {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-xs font-semibold text-red-700"><ShieldAlert size={16} className="shrink-0"/><p>{error}</p></div>}
        {notice && <p role="status" className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-xs font-semibold text-emerald-800">{notice}</p>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-2"><span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-primary/50"><Mail size={13}/> Staff email</span><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required className="input-field py-5 font-semibold" /></label>
          <label className="block space-y-2"><span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-primary/50"><Lock size={13}/> Password</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="input-field py-5 font-semibold" /></label>
          <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-3 py-6 text-[10px] font-black uppercase tracking-[0.4em]">{loading ? <Loader2 size={18} className="animate-spin"/> : <KeyRound size={16}/>}Sign in</button>
        </form>
        <div className="border-t border-primary/10 pt-4 text-center"><button type="button" onClick={sendPasswordReset} disabled={loading} className="text-xs font-semibold text-primary/60 underline underline-offset-4 hover:text-primary">Forgot your password?</button></div>
      </div>
    </AuthLayout>
  );
}
