'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ShieldCheck, X } from 'lucide-react';

export function PermissionPrompt() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the prompt
    const hasSeenPrompt = localStorage.getItem('has_seen_permission_prompt');
    if (!hasSeenPrompt) {
      // Delay slightly to not overwhelm on the very first paint
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('has_seen_permission_prompt', 'true');
    setIsOpen(false);
  };

  const handleAllow = () => {
    // Request location permission natively
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // Success
          handleClose();
        },
        () => {
          // Error or Denied
          handleClose();
        }
      );
    } else {
      // Geolocation not supported
      handleClose();
    }
    
    // Optionally also request notification permission if supported
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden z-10 p-6 pt-8 flex flex-col"
          >
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-5 bg-brand-100">
               <ShieldCheck className="h-8 w-8 text-brand-600" />
            </div>
            
            <h2 className="text-2xl font-bold font-heading text-center text-foreground mb-3">
              Izin Akses Aplikasi
            </h2>
            <p className="text-center text-muted-foreground text-sm mb-6 leading-relaxed px-2">
              Untuk memberikan pengalaman terbaik, Arus memerlukan beberapa izin dari perangkat Anda:
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="bg-white p-2 rounded-lg shadow-sm mt-0.5">
                  <MapPin className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-1">Lokasi</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Membantu kami menemukan alamat pengiriman dengan akurat dan menyarankan layanan terdekat.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full mt-auto">
              <button
                onClick={handleAllow}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 font-bold text-sm text-white rounded-xl bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
              >
                Izinkan Akses
              </button>
              <button
                onClick={handleClose}
                className="w-full px-4 py-3.5 font-medium text-sm text-muted-foreground hover:bg-gray-50 rounded-xl transition-colors"
              >
                Nanti Saja
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
