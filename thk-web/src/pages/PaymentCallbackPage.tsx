import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PaymentCallbackPage() {
  return (
    <main className="min-h-[65vh] flex items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-[2.5rem] border border-primary/10 bg-white/70 p-10 text-center shadow-2xl sm:p-14">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/10 text-teal">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-gold">Tap secure checkout</p>
        <h1 className="mb-4 text-2xl font-black uppercase italic text-primary">Payment status is being confirmed</h1>
        <p className="mx-auto mb-8 max-w-md text-sm leading-6 text-primary/60">
          Your plan activates only after Tap confirms the payment. Return to the open Triangle Healthy Kitchen page to see the verified status.
        </p>
        <button onClick={() => window.history.back()} className="btn-primary inline-flex items-center gap-3 px-8 py-4">
          <ArrowLeft className="h-4 w-4" /> Return to Triangle
        </button>
      </section>
    </main>
  );
}
