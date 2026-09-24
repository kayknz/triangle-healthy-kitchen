import { useState } from 'react';
import { Loader2, Lock, Mail, User, Phone, ShieldAlert } from 'lucide-react';
import { useAuth, type UserRole } from '../../lib/auth';
import AuthLayout from './AuthLayout';

interface ProviderAuthProps {
  onBack: () => void;
  onSuccess: (role: UserRole, dual?: boolean) => void;
}

export default function ProviderAuth({ onBack, onSuccess }: ProviderAuthProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'owner' | 'rider'>('owner');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      if (mode === 'signin') {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, role, name, phone);
      }

      if (result.error) {
        setError(result.error);
      } else {
        const dualAccess = 'dual' in result ? result.dual : false;
        onSuccess(result.role ?? (role as UserRole), dualAccess ?? false);
      }
    } catch (err: any) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      onBack={onBack}
      title={role === 'owner' ? 'Kitchen Command' : 'Driver Portal'}
      subtitle={mode === 'signin' ? `Login to your ${role} account` : `Register as a new ${role}`}
    >
      <div className="flex bg-primary/5 rounded-[1.5rem] p-1.5 mb-10 border border-primary/5">
        <button
          onClick={() => setRole('owner')}
          className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
            role === 'owner' ? 'bg-primary text-white shadow-xl' : 'text-primary/40 hover:text-primary'
          }`}
        >
          KITCHEN
        </button>
        <button
          onClick={() => setRole('rider')}
          className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
            role === 'rider' ? 'bg-primary text-white shadow-xl' : 'text-primary/40 hover:text-primary'
          }`}
        >
          DRIVER
        </button>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'signup' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-primary/40 text-[9px] font-black uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                <User className="w-3 h-3" /> NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className="input-field py-5 bg-white/40 font-black italic tracking-tighter"
              />
            </div>
            {role === 'rider' && (
              <div className="space-y-2">
                <label className="text-primary/40 text-[9px] font-black uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                  <Phone className="w-3 h-3" /> PHONE
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  required
                  className="input-field py-5 bg-white/40 font-black italic tracking-tighter"
                />
              </div>
            )}
          </div>
        )}
        <div className="space-y-2">
          <label className="text-primary/40 text-[9px] font-black uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
            <Mail className="w-3 h-3" /> EMAIL
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            required
            className="input-field py-5 bg-white/40 font-black italic tracking-tighter"
          />
        </div>
        <div className="space-y-2">
          <label className="text-primary/40 text-[9px] font-black uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
            <Lock className="w-3 h-3" /> PASSWORD
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="input-field py-5 bg-white/40 font-black"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-6 text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-3 active:scale-95"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gold" />
          ) : (
            mode === 'signin' ? 'LOGIN' : 'SIGN UP'
          )}
        </button>
      </form>

      <div className="text-center mt-10 border-t border-primary/5 pt-8">
        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
          className="text-primary/30 font-black uppercase tracking-[0.3em] text-[9px] transition-colors underline underline-offset-8 decoration-primary/10"
        >
          {mode === 'signin'
            ? "Need an account? Sign up"
            : 'Back to login'}
        </button>
      </div>
    </AuthLayout>
  );
}
