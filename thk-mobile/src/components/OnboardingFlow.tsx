import { useState } from 'react';
import { ChevronRight, Check, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';
import EditorialPanel from './EditorialPanel';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [gender, setStepGender] = useState<'male' | 'female'>('male');
  const [submitting, setSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Use UPSERT instead of update to ensure the record is created for new users
      const { error } = await supabase
        .from('subscribers')
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          gender,
          email: user.email || ''
        }, { onConflict: 'user_id' });

      if (error && error.message?.includes('gender')) {
        await supabase
          .from('subscribers')
          .upsert({
            user_id: user.id,
            onboarding_completed: true,
            email: user.email || ''
          }, { onConflict: 'user_id' });
      }
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EditorialPanel
      isOpen={true}
      onClose={() => {}}
      title={t('define_identity')}
      badge={t('phase_01')}
      maxWidth="max-w-md"
    >
      <div className="p-10 space-y-8 animate-in">
        <div className="space-y-4">
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setStepGender(g)}
              className={`w-full group relative overflow-hidden p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${
                gender === g ? 'border-[#0a3030] bg-[#0a3030] text-white shadow-2xl' : 'border-gray-50 bg-white hover:border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="text-left">
                  <p className="text-xl font-black uppercase tracking-widest">{t(g)}</p>
                  <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${gender === g ? 'text-white/40' : 'text-gray-300'}`}>{t('bio_profile')}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${
                  gender === g ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-100'
                }`}>
                  {gender === g ? <Check className="w-6 h-6 text-white" /> : <ChevronRight className="w-6 h-6 text-gray-200" />}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleComplete}
          disabled={submitting}
          className="w-full bg-[#0a3030] text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] transition-all hover:bg-[#154a4a] hover:shadow-2xl active:scale-95 disabled:opacity-50"
        >
          {submitting ? '...' : t('continue')}
        </button>
      </div>
    </EditorialPanel>
  );
}
