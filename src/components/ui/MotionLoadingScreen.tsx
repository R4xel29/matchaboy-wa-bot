'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MotionLoadingScreenProps {
  message?: string;
  customMessages?: string[];
}

const DEFAULT_MESSAGES = [
  "Menghubungkan ke server aman...",
  "Memverifikasi tanda tangan digital...",
  "Menakar racikan seduhan terbaik...",
  "Mengamankan sesi autentikasi...",
  "Menyiapkan cangkir kehangatan Anda...",
  "Hampir selesai..."
];

export function MotionLoadingScreen({ 
  message,
  customMessages 
}: MotionLoadingScreenProps) {
  const messages = customMessages || DEFAULT_MESSAGES;
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen flex flex-col items-center justify-center bg-[#0B130E] text-[#FFFBF5] overflow-hidden select-none">
      
      {/* Inline styles for GPU accelerated, buttery-smooth CSS animations */}
      <style>{`
        @keyframes css-rotate-clockwise {
          from { transform: rotate(0deg) translate3d(0,0,0); }
          to { transform: rotate(360deg) translate3d(0,0,0); }
        }
        @keyframes css-rotate-counter {
          from { transform: rotate(0deg) translate3d(0,0,0); }
          to { transform: rotate(-360deg) translate3d(0,0,0); }
        }
        @keyframes css-float {
          0%, 100% { transform: translateY(0px) translate3d(0,0,0); }
          50% { transform: translateY(-6px) translate3d(0,0,0); }
        }
        @keyframes css-drift-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1) translate3d(0,0,0); }
          50% { transform: translate(30px, -20px) scale(1.05) translate3d(0,0,0); }
        }
        @keyframes css-drift-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1) translate3d(0,0,0); }
          50% { transform: translate(-20px, 30px) scale(0.95) translate3d(0,0,0); }
        }
        @keyframes css-wave-flow {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes css-wave-flow-reverse {
          from { transform: translate3d(-50%, 0, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        @keyframes css-steam {
          0% { transform: translateY(0) scaleY(1) translate3d(0,0,0); opacity: 0; }
          15% { opacity: 0.6; }
          85% { opacity: 0.6; }
          100% { transform: translateY(-30px) scaleY(0.8) translate3d(0,0,0); opacity: 0; }
        }

        .animate-rotate-cw {
          animation: css-rotate-clockwise 8s linear infinite;
          will-change: transform;
        }
        .animate-rotate-ccw {
          animation: css-rotate-counter 6s linear infinite;
          will-change: transform;
        }
        .animate-bowl-float {
          animation: css-float 4s ease-in-out infinite;
          will-change: transform;
        }
        .animate-drift-green {
          animation: css-drift-1 12s ease-in-out infinite;
          will-change: transform;
        }
        .animate-drift-gold {
          animation: css-drift-2 15s ease-in-out infinite;
          will-change: transform;
        }
        .animate-wave-move-1 {
          animation: css-wave-flow 18s linear infinite;
          will-change: transform;
        }
        .animate-wave-move-2 {
          animation: css-wave-flow-reverse 12s linear infinite;
          will-change: transform;
        }
        .animate-wave-move-3 {
          animation: css-wave-flow 8s linear infinite;
          will-change: transform;
        }
        .animate-steam-rise {
          animation: css-steam 2.5s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>

      {/* Background Glow Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Matcha Green Orb */}
        <div 
          className="absolute w-[400px] h-[400px] rounded-full bg-[#2E5A44]/15 blur-[100px] animate-drift-green transform-gpu"
          style={{ top: '-10%', left: '10%' }}
        />
        {/* Golden Tea Orb */}
        <div 
          className="absolute w-[350px] h-[350px] rounded-full bg-[#B48A5E]/10 blur-[110px] animate-drift-gold transform-gpu"
          style={{ bottom: '-10%', right: '10%' }}
        />
      </div>

      {/* Main Motion Graphic Content */}
      <div className="relative flex flex-col items-center justify-center z-10 scale-95 md:scale-100">
        
        {/* Whisking Matcha Bowl Container */}
        <div className="relative w-60 h-60 flex items-center justify-center">
          
          {/* Outer glowing pulsing border */}
          <div className="absolute inset-4 rounded-full border border-[#2E5A44]/25 bg-gradient-to-tr from-[#2E5A44]/5 to-transparent transition-transform duration-1000 transform-gpu" />

          {/* Golden Orbit Ring */}
          <svg className="absolute w-[160px] h-[160px] animate-rotate-cw transform-gpu" viewBox="0 0 180 180">
            <circle
              cx="90"
              cy="90"
              r="84"
              fill="none"
              stroke="#D4A574"
              strokeWidth="1.5"
              strokeDasharray="40 180 80 180"
              strokeLinecap="round"
            />
          </svg>

          {/* Matcha Swirl Orbit Ring */}
          <svg className="absolute w-[190px] h-[190px] animate-rotate-ccw transform-gpu" viewBox="0 0 210 210">
            <circle
              cx="105"
              cy="105"
              r="98"
              fill="none"
              stroke="#2E5A44"
              strokeWidth="1.2"
              strokeDasharray="60 300"
              strokeLinecap="round"
            />
          </svg>

          {/* Centerpiece Chawan (Matcha Bowl) */}
          <div className="relative w-24 h-24 rounded-full bg-[#0D1B14] border-2 border-[#2E5A44]/80 shadow-2xl flex items-center justify-center overflow-hidden animate-bowl-float transform-gpu">
            {/* Swirling Green Foam inside Bowl */}
            <div className="absolute w-20 h-20 rounded-full border border-dashed border-[#2E5A44]/40 bg-gradient-to-r from-[#2E5A44]/20 to-transparent animate-rotate-cw transform-gpu" />
            
            {/* Glowing Brand Icon (Inner Core) */}
            <div className="w-10 h-10 rounded-full bg-[#FFFBF5] flex items-center justify-center shadow-lg z-10">
              <svg className="w-6 h-6 text-[#2E5A44]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2Z" strokeOpacity="0.15" />
                <path d="M12 2a10 10 0 0 1 7.54 16.58A8 8 0 0 0 12 6a6 6 0 0 0-4.8 9.6" />
                <path d="M12 6a6 6 0 0 1 4.52 9.95A4 4 0 0 0 12 10a2 2 0 0 0-1.6 3.2" />
              </svg>
            </div>
          </div>

          {/* Steam rising (CSS-based & GPU-accelerated) */}
          <div className="absolute -top-4 flex gap-2 pointer-events-none">
            <span className="w-[1.5px] h-5 bg-gradient-to-t from-[#E8F5E9]/40 to-transparent rounded-full animate-steam-rise" style={{ animationDelay: '0s' }} />
            <span className="w-[1.5px] h-7 bg-gradient-to-t from-[#E8F5E9]/50 to-transparent rounded-full animate-steam-rise" style={{ animationDelay: '0.8s' }} />
            <span className="w-[1.5px] h-5 bg-gradient-to-t from-[#E8F5E9]/40 to-transparent rounded-full animate-steam-rise" style={{ animationDelay: '1.6s' }} />
          </div>

        </div>

        {/* Text Container: Simplified fade transition for absolute smoothness */}
        <div className="mt-4 text-center px-6 h-10 flex items-center justify-center max-w-sm">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.9, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="text-[11px] uppercase tracking-[0.25em] font-extrabold text-[#E8F5E9]/90 font-sans"
            >
              {message || messages[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* CSS-only pulsing loader bar */}
        <div className="w-24 h-[2px] bg-[#2E5A44]/20 rounded-full mt-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#2E5A44] to-[#D4A574] rounded-full transform-gpu"
            style={{
              width: '50%',
              animation: 'css-wave-flow 1.8s ease-in-out infinite alternate',
              willChange: 'transform'
            }}
          />
        </div>

      </div>

      {/* Floating Leaves (Simplified to 3 CSS-animated leaves) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute text-[#2E5A44]/10 w-5 h-5 animate-bowl-float transform-gpu"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ top: '25%', left: '15%', animationDuration: '6s' }}
        >
          <path d="M17 8C8 10 4 17 4 17S12 17 19 11C21 9 22 6 22 6S19 6 17 8Z" />
        </svg>
        <svg
          className="absolute text-[#2E5A44]/10 w-5 h-5 animate-bowl-float transform-gpu"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ bottom: '25%', right: '15%', animationDuration: '8s' }}
        >
          <path d="M17 8C8 10 4 17 4 17S12 17 19 11C21 9 22 6 22 6S19 6 17 8Z" />
        </svg>
      </div>

      {/* Premium Wave Fluid overlay (optimized CSS wave movement) */}
      <div className="absolute bottom-0 left-0 right-0 w-full h-[70px] overflow-hidden pointer-events-none z-10">
        <div className="relative w-[200%] h-full flex transform-gpu">
          
          {/* Wave 1 */}
          <div className="absolute inset-0 animate-wave-move-1 transform-gpu" style={{ width: '200%' }}>
            <svg className="w-full h-full" viewBox="0 0 1000 120" preserveAspectRatio="none">
              <path d="M0,60 C150,90 350,30 500,60 C650,90 850,30 1000,60 L1000,120 L0,120 Z" fill="#2E5A44" fillOpacity="0.08" />
            </svg>
          </div>

          {/* Wave 2 */}
          <div className="absolute inset-0 animate-wave-move-2 transform-gpu" style={{ width: '200%' }}>
            <svg className="w-full h-full" viewBox="0 0 1000 120" preserveAspectRatio="none">
              <path d="M0,70 C120,40 280,100 500,70 C620,40 780,100 1000,70 L1000,120 L0,120 Z" fill="#D4A574" fillOpacity="0.1" />
            </svg>
          </div>

          {/* Wave 3 */}
          <div className="absolute inset-0 animate-wave-move-3 transform-gpu" style={{ width: '200%' }}>
            <svg className="w-full h-full" viewBox="0 0 1000 120" preserveAspectRatio="none">
              <path d="M0,80 C180,110 320,50 500,80 C680,110 820,50 1000,80 L1000,120 L0,120 Z" fill="#E8F5E9" fillOpacity="0.12" />
            </svg>
          </div>
        </div>
      </div>

    </div>
  );
}
