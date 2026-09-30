import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if dismissed before
    const isDismissed = sessionStorage.getItem('pwa_dismissed');
    if (isDismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also show educational hint on mobile if standalone is not active
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!isStandalone && !isDismissed) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
      }
    } else {
      // Do nothing or user instruction
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-16 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 bg-slate-900/95 text-white p-4 rounded-3xl shadow-2xl backdrop-blur-md border border-slate-700/60 animate-slide-up flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-500/30">
          <Smartphone className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-extrabold text-sm text-amber-300">Cài đặt App Bếp Việt</h4>
          <p className="text-[11px] text-slate-300 line-clamp-1">
            Đặt món nhanh hơn, nhận voucher độc quyền 20k
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstall}
          className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition"
        >
          Cài Đặt
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-xl text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
