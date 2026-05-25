'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { LoadingScreen } from '../ui/LoadingScreen';

interface AnimatedSplashProps {
  showSplash: boolean;
  onFinished: () => void;
}

export default function AnimatedSplash({ showSplash, onFinished }: AnimatedSplashProps) {
  return (
    <AnimatePresence mode="wait">
      {showSplash && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1, y: 0 }}
          exit={{ 
            opacity: 0, 
            y: '-100%',
            filter: 'blur(20px)',
            transition: { 
              duration: 0.65, 
              ease: [0.76, 0, 0.24, 1] // Custom luxury cubic-bezier
            } 
          }}
          className="fixed inset-0 z-[9999] w-screen h-screen overflow-hidden"
        >
          <LoadingScreen isSplash={true} onFinished={onFinished} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
