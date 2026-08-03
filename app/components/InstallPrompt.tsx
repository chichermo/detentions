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
    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed === '1') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const dismiss = () => {
    setShowPrompt(false);
    try {
      sessionStorage.setItem('pwa-install-dismissed', '1');
    } catch {
      /* ignore */
    }
  };

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
    <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-96 z-[55] animate-slide-up">
      <div className="glass border border-[var(--border-strong)] rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg shrink-0" style={{ background: 'var(--accent-muted)' }}>
            <Download className="h-5 w-5" style={{ color: '#f0c078' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-primary mb-1">Installeer de App</h3>
            <p className="text-sm text-muted mb-3">
              Installeer Nablijven op je apparaat voor snellere toegang en offline gebruik.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleInstall}
                className="btn-primary text-sm px-4 py-2"
              >
                Installeren
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="btn-ghost text-sm px-4 py-2"
              >
                Later
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="p-1 text-muted hover:text-primary shrink-0"
            aria-label="Sluiten"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
