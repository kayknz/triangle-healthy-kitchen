import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Leaf, Wind, Star } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export default function TriangleSculpture() {
  const { t } = useLanguage();

  // Mathematical Equilateral Triangle Coordinates
  const TOP = { x: 200, y: 60 };
  const BR = { x: 350, y: 320 };
  const BL = { x: 50, y: 320 };

  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 0.15,
      transition: { duration: 2.5, ease: "easeInOut" }
    }
  };

  const vertexVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, delay: 1.5 }
    }
  };

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto flex items-center justify-center overflow-visible select-none">
      {/* 1. ATMOSPHERIC PULSE */}
      <div className="absolute w-64 h-64 bg-gold/5 rounded-full blur-[100px] animate-pulse" />

      {/* 2. THE CONTINUOUS LINE FRAME (SVG) */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full drop-shadow-2xl overflow-visible">
        <defs>
          <linearGradient id="lineGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#171717" />
            <stop offset="50%" stopColor="#d4b26a" />
            <stop offset="100%" stopColor="#171717" />
          </linearGradient>
        </defs>

        {/* The single continuous path forming the triangle */}
        <motion.path
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={lineVariants}
          d={`M ${TOP.x},${TOP.y} L ${BR.x},${BR.y} L ${BL.x},${BL.y} Z`}
          stroke="url(#lineGold)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* 3. VERTICES (THE JOINTS) */}

      {/* MIND (TOP) */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={vertexVariants}
        className="absolute top-[5%] flex flex-col items-center z-10"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-white border border-primary/5 shadow-2xl flex items-center justify-center mb-4 group hover:scale-110 transition-transform duration-700">
           <Brain className="w-8 h-8 text-teal drop-shadow-sm" />
        </div>
        <p className="text-[10px] font-black tracking-[0.5em] text-primary uppercase italic whitespace-nowrap">{t('healthy_mind_title')}</p>
      </motion.div>

      {/* SOUL (BOTTOM LEFT) */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={vertexVariants}
        style={{ left: '5%', bottom: '15%' }}
        className="absolute flex flex-col items-center z-10"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-white border border-primary/5 shadow-2xl flex items-center justify-center mb-4 group hover:scale-110 transition-transform duration-700">
           <Wind className="w-8 h-8 text-teal drop-shadow-sm" />
        </div>
        <p className="text-[10px] font-black tracking-[0.5em] text-primary uppercase italic whitespace-nowrap">{t('healthy_soul_title')}</p>
      </motion.div>

      {/* BODY (BOTTOM RIGHT) */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={vertexVariants}
        style={{ right: '5%', bottom: '15%' }}
        className="absolute flex flex-col items-center z-10"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-white border border-primary/5 shadow-2xl flex items-center justify-center mb-4 group hover:scale-110 transition-transform duration-700">
           <Leaf className="w-8 h-8 text-teal drop-shadow-sm" />
        </div>
        <p className="text-[10px] font-black tracking-[0.5em] text-primary uppercase italic whitespace-nowrap">{t('healthy_body_title')}</p>
      </motion.div>

      {/* 4. THE HEARTBEAT (CENTER STAR) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
         <div className="w-16 h-16 rounded-full bg-gold/10 animate-ping absolute" />
         <motion.div
           initial={{ opacity: 0, scale: 0 }}
           whileInView={{ opacity: 1, scale: 1 }}
           transition={{ delay: 2, duration: 1 }}
           className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white shadow-3xl flex items-center justify-center border border-primary/5 relative z-20"
         >
            <Star className="w-6 h-6 fill-gold text-gold" />
         </motion.div>
      </div>
    </div>
  );
}
