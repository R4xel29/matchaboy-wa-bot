'use client';

import { motion, AnimatePresence } from 'framer-motion';

export interface EasterEggConfig {
  enabled: boolean;
  discount: number;
  quota: number;
  hasClaimed: boolean;
}

interface EasterEggOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  config: EasterEggConfig | null;
  onClaim: () => void;
  isClaiming: boolean;
}

export function EasterEggOverlay({ isOpen, onClose, config, onClaim, isClaiming }: EasterEggOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-hidden flex flex-col items-center justify-between text-white px-6 py-12"
          style={{ 
            backgroundImage: "url('/banners/night_header_bg.png')", 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }}
        >
          {/* Ambient glows & active stars overlay */}
          <div className="absolute inset-0 bg-[#0B0D19]/40 backdrop-blur-[2px] z-0" />

          {/* Pulsing galaxy light */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-500/15 rounded-full blur-[64px] animate-pulse" />
          <div className="absolute bottom-1/4 left-1/3 w-60 h-60 bg-purple-500/10 rounded-full blur-[64px] animate-pulse duration-1000" />

          {/* Twinkling overlay stars */}
          <div className="absolute inset-0 opacity-80 z-0 pointer-events-none select-none">
            <div className="absolute top-1/4 left-[15%] w-2 h-2 bg-yellow-100 rounded-full animate-ping" />
            <div className="absolute top-1/3 left-[75%] w-2.5 h-2.5 bg-yellow-200 rounded-full animate-pulse" />
            <div className="absolute top-2/3 left-[25%] w-2 h-2 bg-white rounded-full animate-ping duration-700" />
            <div className="absolute top-[80%] left-[80%] w-2.5 h-2.5 bg-indigo-200 rounded-full animate-pulse duration-1000" />
          </div>

          {/* Top Close Bar */}
          <div className="w-full flex justify-end relative z-10">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl font-bold shadow-md"
            >
              ✕
            </motion.button>
          </div>

          {/* Main Content Card (Spring Fade-In) */}
          <motion.div 
            initial={{ scale: 0.85, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/15 rounded-3xl p-8 text-center relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6"
          >
            <div className="w-16 h-16 bg-gradient-to-tr from-yellow-300 to-amber-500 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-lg animate-bounce">
              🌌
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-yellow-300 font-extrabold uppercase tracking-[0.25em] px-2.5 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                Secret Easter Egg
              </span>
              <h3 className="font-heading text-2xl font-black tracking-tight text-white mt-1">
                Misteri Langit Bimasakti!
              </h3>
              <p className="text-xs text-indigo-100 leading-relaxed px-2">
                Wah! Kamu sangat jeli! Kamu baru saja menemukan rahasia langit malam **Arum Seduh** yang menakjubkan.
              </p>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-3">
              <p className="text-[11px] text-[#A69F94] font-medium uppercase tracking-[0.1em]">
                Hadiah Spesial Untukmu
              </p>
              <div className="bg-gradient-to-r from-amber-500/15 via-yellow-400/5 to-amber-500/15 border border-yellow-300/30 rounded-2xl py-4 px-2">
                <p className="text-[10px] text-yellow-300 font-black tracking-widest uppercase">Secret Voucher Discount</p>
                <p className="text-3xl font-extrabold text-yellow-300 mt-1">
                  Rp {(config?.discount || 15000).toLocaleString('id-ID')}
                </p>
                <p className="text-[9px] text-[#A69F94] mt-1">Berlaku untuk 1 kali pembelian di kasir/checkout</p>
              </div>
            </div>

            {config?.hasClaimed ? (
              <div className="w-full py-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs tracking-wide">
                ✓ Voucher Rahasia Sudah Diklaim!
              </div>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClaim}
                disabled={isClaiming}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-sm tracking-wide shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isClaiming ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengklaim...
                  </>
                ) : (
                  'Klaim Voucher Rahasia ☕'
                )}
              </motion.button>
            )}
          </motion.div>

          {/* Bottom text */}
          <p className="text-[10px] text-white/40 tracking-wider font-semibold z-10 select-none">
            DITENAGAI OLEH ARUM SEDUH LOYALTY SYSTEM
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
