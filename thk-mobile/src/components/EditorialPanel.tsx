import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { ReactNode } from 'react';
import { useLanguage } from '../lib/LanguageContext';

interface EditorialPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  badge?: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function EditorialPanel({
  isOpen,
  onClose,
  title,
  badge,
  children,
  maxWidth = "max-w-4xl"
}: EditorialPanelProps) {
  const { isRtl, t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/60 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative bg-[#F5F3EB] w-full ${maxWidth} rounded-[3.5rem] shadow-4xl flex flex-col max-h-[95vh] border border-white/20 overflow-hidden`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-8 sm:px-12 py-10 border-b border-primary/5 flex-shrink-0 bg-white/40 backdrop-blur-md ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className={`flex items-center gap-2 mb-3 bg-primary/5 px-3 py-1.5 rounded-full w-fit ${isRtl ? 'flex-row-reverse ml-auto' : ''}`}>
                  <Star className="w-3 h-3 fill-gold text-gold" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                    {badge || 'Active Plan'}
                  </span>
                </div>
                {title && (
                  <h2 className="text-primary font-black text-2xl sm:text-3xl uppercase tracking-tighter italic leading-none">
                    {title}
                  </h2>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-muted hover:text-primary p-3 rounded-full hover:bg-white/50 transition-all border border-transparent hover:border-primary/5"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function SecuringProtocol({ message, subtitle, error, onRetry }: { message?: string, subtitle?: string, error?: string | null, onRetry?: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-20 animate-in">
      {/* Animated Dual-Orbital Loader */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Outer Orbit */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-0 border-2 border-dashed rounded-full ${error ? 'border-red-500/30' : 'border-gold/30'}`}
        />
        {/* Inner Orbit */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-4 border-2 border-dashed rounded-full ${error ? 'border-red-500/40' : 'border-teal/40'}`}
        />

        {/* Shimmering Logo / Error Icon */}
        <div className="relative w-24 h-24 group">
          <div className={`absolute inset-0 rounded-[2rem] blur-2xl animate-pulse ${error ? 'bg-red-500/20' : 'bg-gold/20'}`} />
          <div className={`relative w-full h-full rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl p-4 ${error ? 'bg-red-900' : 'bg-[#0a3030]'}`}>
             {error ? (
               <div className="w-full h-full flex items-center justify-center">
                 <X className="w-12 h-12 text-white" />
               </div>
             ) : (
               <img
                 src="/logo.png"
                 alt="Triangle Logo"
                 className="w-full h-full object-contain animate-pulse"
               />
             )}
          </div>
        </div>
      </div>

      <div className="text-center space-y-6 px-8">
        <div className="flex flex-col items-center">
          <h3 className={`font-black text-3xl uppercase tracking-tighter italic ${error ? 'text-red-500' : 'text-primary'}`}>
            {error ? 'Error Occurred' : (message || 'Loading...')}
          </h3>
          <p className="text-muted text-[10px] font-bold uppercase tracking-[0.3em] mt-2 max-w-xs mx-auto">
            {error || subtitle || 'Setting up your account'}
          </p>
        </div>

        {/* Action Badge */}
        {!error ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-3 bg-teal text-white px-6 py-3 rounded-2xl shadow-xl shadow-teal/20 mx-auto w-fit"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {t('biometric_link') || 'Secure Connection'}
            </span>
          </motion.div>
        ) : onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-3 bg-red-500 text-white px-8 py-4 rounded-2xl shadow-xl shadow-red-500/20 mx-auto w-fit font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
