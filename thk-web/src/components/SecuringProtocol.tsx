import React from 'react';
import { motion } from 'framer-motion';
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
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-[#123F38] overflow-hidden p-6">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#C5A059]/10 rounded-full blur-[140px] -mr-40 -mt-40 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[#F5F3EB]/5 rounded-full blur-[140px] -ml-40 -mb-40 animate-pulse" />

      {/* Center Shield Structure */}
      <div className="relative flex flex-col items-center max-w-md text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-32 h-32 mb-12"
        >
          <div className="absolute inset-0 bg-[#C5A059]/20 rounded-[2.5rem] blur-2xl animate-ping" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border-2 border-gold/20 border-t-gold rounded-[3rem]"
          />
          <div className="relative w-full h-full rounded-[2.5rem] bg-[#123F38] border border-[#C5A059]/30 shadow-4xl flex items-center justify-center">
            <ShieldCheck className="w-14 h-14 text-[#C5A059]" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-serif text-[#F5F3EB] tracking-tight italic mb-4"
        >
          {message}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-[#F5F3EB]/70 text-sm font-medium leading-relaxed max-w-xs"
        >
          {subtitle}
        </motion.p>
      </div>

      {/* Shimmer Indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-64 flex flex-col items-center">
        <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden relative">
           <motion.div
             animate={{ x: ["-100%", "200%"] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
             className="absolute inset-0 bg-gradient-to-r from-transparent via-gold to-transparent"
           />
        </div>
        <span className="text-[#C5A059] text-[9px] font-black uppercase tracking-[0.3em] mt-6 flex items-center gap-2">
          <Sparkles className="w-3 h-3 fill-gold" /> Safe & Secure
        </span>
      </div>
    </div>
  );
}
