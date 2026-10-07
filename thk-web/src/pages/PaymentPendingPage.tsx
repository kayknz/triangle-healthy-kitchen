import { Clock3, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/LanguageContext';

export default function PaymentPendingPage() {
  const { signOut, refreshAuth } = useAuth();
  const { isRtl } = useLanguage();
  return (
    <main dir={isRtl ? 'rtl' : 'ltr'} className="min-h-[75vh] flex items-center justify-center bg-background px-5 py-24">
      <section className="w-full max-w-xl rounded-3xl border border-primary/10 bg-white p-7 text-center shadow-xl sm:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><Clock3 className="h-8 w-8" /></div>
        <h1 className="text-2xl font-black text-primary sm:text-3xl">{isRtl ? 'طلبك بانتظار المراجعة' : 'Your account is awaiting approval'}</h1>
        <p className="mt-4 text-sm leading-6 text-primary/70 sm:text-base">
          {isRtl ? 'استلمنا طلب الدفع أو التفعيل. لن تحتاج إلى اختيار الخطة أو الدفع مرة أخرى. سنفعّل حسابك بعد التحقق.' : 'We received your payment or activation request. Please do not select a plan or pay again. Your account will be activated after the team verifies it.'}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => void refreshAuth()} className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-4"><RefreshCw className="h-4 w-4" />{isRtl ? 'تحديث الحالة' : 'Check status'}</button>
          <button type="button" onClick={() => void signOut()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/15 px-6 py-4 font-bold text-primary"><LogOut className="h-4 w-4" />{isRtl ? 'تسجيل الخروج' : 'Sign out'}</button>
        </div>
      </section>
    </main>
  );
}
