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
    }, 2000);
    return () => clearInterval(interval);
  }, [messages]);

  // Framer Motion variants for letter reveal
  const textContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.02, delayChildren: 0.1 }
    }
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 10 } }
  };

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen flex flex-col items-center justify-center bg-[#0B130E] text-[#FFFBF5] overflow-hidden select-none">
      
      {/* Background Glow Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Matcha Green Orb */}
        <motion.div
          className="absolute w-[450px] h-[450px] rounded-full bg-[#2E5A44]/20 blur-[100px]"
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -50, 40, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '-10%', left: '10%' }}
        />
        
        {/* Golden Tea Orb */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-[#B48A5E]/15 blur-[120px]"
          animate={{
            x: [0, -40, 60, 0],
            y: [0, 60, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ bottom: '-10%', right: '10%' }}
        />
      </div>

      {/* Main Motion Graphic Content */}
      <div className="relative flex flex-col items-center justify-center z-10 scale-95 md:scale-100">
        
        {/* Floating/Whisking Matcha Bowl Graphic */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          
          {/* Outer glowing pulsing aura */}
          <motion.div 
            className="absolute inset-0 rounded-full border border-[#2E5A44]/35 bg-gradient-to-tr from-[#2E5A44]/5 to-transparent"
            animate={{
              scale: [0.9, 1.1, 0.9],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Golden Orbit Ring */}
          <svg className="absolute w-[180px] h-[180px]" viewBox="0 0 180 180">
            <motion.circle
              cx="90"
              cy="90"
              r="84"
              fill="none"
              stroke="#D4A574"
              strokeWidth="1.5"
              strokeDasharray="40 180 80 180"
              strokeLinecap="round"
              className="origin-center"
              animate={{ rotate: 360 }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </svg>

          {/* Matcha Swirl Orbit Ring (counter-clockwise) */}
          <svg className="absolute w-[210px] h-[210px]" viewBox="0 0 210 210">
            <motion.circle
              cx="105"
              cy="105"
              r="98"
              fill="none"
              stroke="#2E5A44"
              strokeWidth="1.2"
              strokeDasharray="60 300"
              strokeLinecap="round"
              className="origin-center"
              animate={{ rotate: -360 }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </svg>

          {/* Whisking / Spiraling Particles (Interactive Motion Graphic) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-[#E8F5E9]"
                style={{
                  originX: '0px',
                  originY: '45px',
                }}
                animate={{
                  rotate: 360,
                  scale: [0.4, 1.2, 0.4],
                  opacity: [0.2, 0.9, 0.2]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.4,
                }}
              />
            ))}
          </div>

          {/* Centerpiece Chawan (Matcha Bowl) with Steam and Liquid Whisking */}
          <motion.div
            className="relative w-28 h-28 rounded-full bg-[#0D1B14] border-2 border-[#2E5A44] shadow-2xl flex items-center justify-center overflow-hidden"
            animate={{
              y: [0, -6, 0],
              scale: [0.97, 1.03, 0.97]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Swirling Green Foam inside Bowl */}
            <motion.div 
              className="absolute w-24 h-24 rounded-full border border-dashed border-[#2E5A44]/60 bg-gradient-to-r from-[#2E5A44]/20 via-[#4E8A64]/10 to-transparent"
              animate={{ rotate: 360 }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Interactive Matcha Droplets (Chasen effects) */}
            <motion.div 
              className="absolute w-20 h-20 rounded-full border border-dotted border-[#E8F5E9]/40"
              animate={{ rotate: -360 }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            {/* Glowing Brand Icon (Inner Core) */}
            <motion.div 
              className="w-12 h-12 rounded-full bg-[#FFFBF5] flex items-center justify-center shadow-lg z-10"
              animate={{
                boxShadow: [
                  "0 0 10px rgba(46, 90, 68, 0.4)",
                  "0 0 22px rgba(212, 165, 116, 0.7)",
                  "0 0 10px rgba(46, 90, 68, 0.4)"
                ]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Custom SVG logo of "Arus" Wave/Spiral */}
              <svg className="w-7 h-7 text-[#2E5A44]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2Z" strokeOpacity="0.15" />
                <path d="M12 2a10 10 0 0 1 7.54 16.58A8 8 0 0 0 12 6a6 6 0 0 0-4.8 9.6" />
                <path d="M12 6a6 6 0 0 1 4.52 9.95A4 4 0 0 0 12 10a2 2 0 0 0-1.6 3.2" />
              </svg>
            </motion.div>
          </motion.div>

          {/* Steam Elements drifting upwards */}
          <div className="absolute top-0 flex gap-1 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.span
                key={i}
                className="w-[1.5px] h-6 bg-gradient-to-t from-[#E8F5E9]/50 to-transparent rounded-full"
                animate={{
                  y: [-10, -35],
                  x: [0, i % 2 === 0 ? 5 : -5, 0],
                  opacity: [0, 0.8, 0],
                  scaleY: [1, 1.4, 0.8]
                }}
                transition={{
                  duration: 2 + i * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5
                }}
              />
            ))}
          </div>

        </div>

        {/* Text Container with AnimatePresence */}
        <div className="mt-8 text-center px-6 h-12 flex items-center justify-center max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={messageIndex}
              variants={textContainerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex flex-wrap justify-center gap-x-[3px] text-sm uppercase tracking-[0.25em] font-extrabold text-[#E8F5E9] font-sans"
            >
              {(message || messages[messageIndex]).split(" ").map((word, wIdx) => (
                <span key={wIdx} className="inline-block whitespace-nowrap">
                  {word.split("").map((char, cIdx) => (
                    <motion.span
                      key={cIdx}
                      variants={letterVariants}
                      className="inline-block hover:text-[#D4A574] transition-colors duration-200"
                    >
                      {char}
                    </motion.span>
                  ))}
                  {/* Add space after word */}
                  <span className="inline-block">&nbsp;</span>
                </span>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dynamic loading bar */}
        <div className="w-36 h-[2px] bg-[#2E5A44]/20 rounded-full mt-4 overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#2E5A44] via-[#D4A574] to-[#E8F5E9] rounded-full"
            animate={{
              x: ["-100%", "100%"]
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ width: "60%" }}
          />
        </div>

      </div>

      {/* Floating Tea Leaves (Fallen from top) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.svg
            key={i}
            className="absolute text-[#2E5A44]/20 w-6 h-6"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{
              top: `${10 + i * 18}%`,
              left: `${15 + (i * 23) % 70}%`,
            }}
            animate={{
              y: [0, 40, 0],
              rotate: [0, 180, 360],
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <path d="M17 8C8 10 4 17 4 17S12 17 19 11C21 9 22 6 22 6S19 6 17 8Z" />
          </motion.svg>
        ))}
      </div>

      {/* Premium Wave Fluid overlay at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 w-full h-[90px] overflow-hidden pointer-events-none z-10">
        <svg 
          className="relative block w-[200%] h-full" 
          viewBox="0 0 1000 120" 
          preserveAspectRatio="none"
          style={{ width: '200%' }}
        >
          {/* Wave 1 */}
          <motion.path 
            d="M0,60 C150,90 350,30 500,60 C650,90 850,30 1000,60 C1150,90 1350,30 1500,60 L1500,120 L0,120 Z" 
            fill="#2E5A44" 
            fillOpacity="0.1"
            animate={{ x: [-500, 0] }}
            transition={{
              ease: "linear",
              duration: 18,
              repeat: Infinity,
            }}
          />

          {/* Wave 2 */}
          <motion.path 
            d="M0,70 C120,40 280,100 500,70 C620,40 780,100 1000,70 C1120,40 1280,100 1500,70 L1500,120 L0,120 Z" 
            fill="#D4A574" 
            fillOpacity="0.12"
            animate={{ x: [0, -500] }}
            transition={{
              ease: "linear",
              duration: 12,
              repeat: Infinity,
            }}
          />

          {/* Wave 3 */}
          <motion.path 
            d="M0,80 C180,110 320,50 500,80 C680,110 820,50 1000,80 C1180,110 1320,50 1500,80 L1500,120 L0,120 Z" 
            fill="#E8F5E9" 
            fillOpacity="0.15"
            animate={{ x: [-500, 0] }}
            transition={{
              ease: "linear",
              duration: 9,
              repeat: Infinity,
            }}
          />
        </svg>
      </div>

    </div>
  );
}
