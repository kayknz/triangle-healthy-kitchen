import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface SecuringProtocolProps {
  message?: string;
  subtitle?: string;
}

export default function SecuringProtocol({
  message = "Loading...",
  subtitle = "Connecting to your account..."
}: SecuringProtocolProps) {
  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#123F38] overflow-hidden p-6">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#C5A059]/10 rounded-full blur-[140px] -mr-40 -mt-40 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#F5F3EB]/5 rounded-full blur-[140px] -ml-40 -mb-40 animate-pulse" />

      {/* Center Shield Structure */}
      <div className="relative flex flex-col items-center max-w-md text-center animate-reveal">
        <div className="relative w-28 h-28 mb-10">
          <div className="absolute inset-0 bg-[#C5A059]/20 rounded-[2rem] blur-xl animate-ping" />
          <div className="absolute -inset-2 bg-gradient-to-tr from-[#C5A059] to-transparent rounded-[2.2rem] opacity-30 animate-spin [animation-duration:8s]" />

          <div className="relative w-full h-full rounded-[2rem] bg-[#123F38] border border-[#C5A059]/30 shadow-2xl flex items-center justify-center">
            <ShieldCheck className="w-12 h-12 text-[#C5A059]" />
          </div>
        </div>

        {/* Text Polish */}
        <h2
          className="text-3xl md:text-4xl font-serif text-[#F5F3EB] tracking-tight italic mb-3"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          {message}
        </h2>

        <p
          className="text-[#F5F3EB]/70 text-sm font-medium leading-relaxed max-w-xs"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          {subtitle}
        </p>
      </div>

      {/* Premium Shimmer Indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-56 flex flex-col items-center">
        <div className="h-[3px] w-full bg-[#F5F3EB]/10 rounded-full overflow-hidden p-[1px]">
          <div className="h-full bg-gradient-to-r from-transparent via-[#C5A059] to-transparent w-3/4 animate-shimmer" />
        </div>
        <span
          className="text-[#C5A059] text-[9px] font-black uppercase tracking-[0.3em] mt-4 flex items-center gap-2"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          <Sparkles className="w-3 h-3 fill-[#C5A059]" /> Safe & Secure
        </span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(150%); }
        }
        .animate-shimmer {
          animation: shimmer 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}} />
    </div>
  );
}
