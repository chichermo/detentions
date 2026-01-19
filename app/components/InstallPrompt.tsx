'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Verificar si ya está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="glass border border-indigo-500/50 rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Download className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-100 mb-1">Installeer de App</h3>
            <p className="text-sm text-slate-400 mb-3">
              Installeer Nablijven op je apparaat voor snellere toegang en offline gebruik.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="btn-primary text-sm px-4 py-2"
              >
                Installeren
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="btn-ghost text-sm px-4 py-2"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="p-1 text-slate-400 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
