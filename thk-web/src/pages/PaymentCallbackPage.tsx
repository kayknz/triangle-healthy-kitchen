import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabase';

export default function PaymentCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Checking Tap’s secure payment confirmation…');
  const [state, setState] = useState<'checking' | 'captured' | 'pending' | 'failed'>('checking');

  useEffect(() => {
    let cancelled = false;
    const tapId = new URLSearchParams(window.location.search).get('tap_id');
    if (!tapId) {
      setState('failed');
      setMessage('We could not read the payment reference. Sign in to check your plan status.');
      return () => { cancelled = true; };
    }

    void (async () => {
      for (let attempt = 0; attempt < 20 && !cancelled; attempt += 1) {
        const { data, error } = await supabase.from('payment_transactions')
          .select('status').eq('tap_charge_id', tapId).maybeSingle();
        if (error) break;
        if (data?.status === 'captured') {
          if (cancelled) return;
          setState('captured');
          setMessage('Tap confirmed your payment. Your plan is active.');
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'thk-payment-captured' }, window.location.origin);
            window.close();
            return;
          }
          return;
        }
        if (data && ['failed', 'cancelled', 'voided'].includes(data.status)) {
          setState('failed');
          setMessage('Tap did not complete this payment. Your plan has not been activated.');
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }
      if (!cancelled) {
        setState('pending');
        setMessage('Tap is still confirming this payment. Your plan will activate only after confirmation.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-[65vh] flex items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-[2.5rem] border border-primary/10 bg-white/70 p-10 text-center shadow-2xl sm:p-14">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/10 text-teal">
          {state === 'checking' ? <Loader2 className="h-8 w-8 animate-spin"/> : <ShieldCheck className="h-8 w-8"/>}
        </div>
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-gold">Tap secure checkout</p>
        <h1 className="mb-4 text-2xl font-black uppercase italic text-primary">{state === 'captured' ? 'Payment confirmed' : state === 'failed' ? 'Payment not completed' : 'Payment status'}</h1>
        <p className="mx-auto mb-8 max-w-md text-sm leading-6 text-primary/60">{message}</p>
        <button onClick={() => navigate('/account', { replace: true })} className="btn-primary inline-flex items-center gap-3 px-8 py-4">
          Go to my account <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </main>
  );
}
