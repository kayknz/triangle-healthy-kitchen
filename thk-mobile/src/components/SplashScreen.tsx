import { Sparkles } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0a3030] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C5A059]/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] -ml-64 -mb-64 animate-pulse" />

      {/* Logo Section */}
      <div className="relative flex flex-col items-center animate-in">
        <div className="relative w-32 h-32 mb-8 group">
          <div className="absolute inset-0 bg-[#C5A059]/20 rounded-[2.5rem] blur-2xl animate-pulse" />
          <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl shadow-black/50 p-1 bg-[#0a3030]">
             <img
               src="/logo.png"
               alt="Triangle Logo"
               className="w-full h-full object-contain p-2"
             />
          </div>
        </div>

        <div className="text-center">
          <p className="text-[#C5A059] font-black tracking-[0.6em] text-xs uppercase mb-2 animate-pulse">
            Triangle
          </p>
          <div className="flex items-center gap-3">
             <span className="h-px w-8 bg-white/10" />
             <p className="text-white/60 text-[9px] font-bold tracking-[0.4em] uppercase">
                Healthy Kitchen
             </p>
             <span className="h-px w-8 bg-white/10" />
          </div>
        </div>
      </div>

      {/* Loading Bar */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48">
        <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
           <div className="h-full bg-gradient-to-r from-transparent via-[#C5A059] to-transparent w-2/3 animate-shimmer" />
        </div>
        <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.4em] mt-4 text-center flex items-center justify-center gap-2">
           <Sparkles className="w-2.5 h-2.5" /> Initializing Excellent Access
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(150%); }
        }
        .animate-shimmer {
          animation: shimmer 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}} />
    </div>
  );
}
