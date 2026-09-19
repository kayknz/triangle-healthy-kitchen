import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  'https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', // Fresh herbs/prep
  'https://images.pexels.com/photos/1435895/pexels-photo-1435895.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', // Clean vegetables
  'https://images.pexels.com/photos/4061528/pexels-photo-4061528.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', // High-end salad
  'https://images.pexels.com/photos/1153370/pexels-photo-1153370.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'  // Minimalist food detail
];

export default function CinematicSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, 6000); // More energetic but still rhythmic
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.01 }}
          animate={{ opacity: 0.7, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${SLIDES[index]}')` }}
        />
      </AnimatePresence>
      {/* Minimalist Depth Overlay */}
      <div className="absolute inset-0 bg-background/80" />

      {/* Optimized Filter Layer */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-gradient-to-b from-transparent to-background/20" />
    </div>
  );
}
