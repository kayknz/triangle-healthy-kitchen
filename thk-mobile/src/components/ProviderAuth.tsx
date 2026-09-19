import { useState } from 'react';
import { ChefHat, Loader2, Lock, Mail, User, Phone, AlertCircle } from 'lucide-react';
import { useAuth, type UserRole } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';
import EditorialPanel from './EditorialPanel';

interface ProviderAuthProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: (role: UserRole) => void;
}

export default function ProviderAuth({ isOpen = true, onClose, onSuccess }: ProviderAuthProps) {
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
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
        result = await signUp(email, password, name, role, phone);
      }

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess(result.role ?? role);
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
      title={role === 'owner' ? t('owner_chef') : t('rider')}
      badge={t('ops_console')}
      maxWidth="max-w-md"
    >
      <div className="p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-[2rem] bg-[#0a3030] flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/10">
            <ChefHat className="w-8 h-8 text-[#C5A059]" />
          </div>
          <h2 className="text-[#0a3030] font-black text-2xl uppercase italic tracking-tight leading-none">
            {t('command_entry')}
          </h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">
            {mode === 'signin' ? t('authorize_session') : t('rider_flow')}
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-gray-50 rounded-2xl p-1 mb-8">
          <button
            onClick={() => setRole('owner')}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
              role === 'owner' ? 'bg-[#0a3030] text-white shadow-lg' : 'text-gray-400 hover:text-[#0a3030]'
            }`}
          >
            {t('owner_chef')}
          </button>
          <button
            onClick={() => setRole('rider')}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
              role === 'rider' ? 'bg-[#0a3030] text-white shadow-lg' : 'text-gray-400 hover:text-[#0a3030]'
            }`}
          >
            {t('rider')}
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-xs font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-[#0a3030] text-[10px] font-black uppercase tracking-[0.3em] opacity-40 ml-1">
                {t('full_name')}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'rider' ? "Enter Unit Identifier" : "Full Name"}
                  required
                  className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-[#0a3030] transition-all"
                />
              </div>
            </div>
          )}
          {mode === 'signup' && role === 'rider' && (
            <div className="space-y-2">
              <label className="text-[#0a3030] text-[10px] font-black uppercase tracking-[0.3em] opacity-40 ml-1">
                {t('mobile_number')}
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Mobile Signal (+974)"
                  required
                  className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-[#0a3030] transition-all"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[#0a3030] text-[10px] font-black uppercase tracking-[0.3em] opacity-40 ml-1">
              {t('email_identifier')}
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-[#0a3030] transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[#0a3030] text-[10px] font-black uppercase tracking-[0.3em] opacity-40 ml-1">
              {t('secure_passkey')}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-[#0a3030] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0a3030] text-white font-black py-5 rounded-[2rem] text-[11px] uppercase tracking-[0.4em] transition-all hover:shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'signin' ? t('sign_in') : t('sign_up'))}
          </button>
        </form>

        <div className="text-center mt-8">
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
            className="text-[#0a3030] text-[10px] font-black uppercase tracking-widest hover:underline"
          >
            {mode === 'signin' ? t('sign_up') : t('sign_in')}
          </button>
        </div>
      </div>
    </EditorialPanel>
  );
}
