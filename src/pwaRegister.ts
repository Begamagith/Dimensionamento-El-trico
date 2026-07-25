import { useState, useEffect, useCallback } from 'react';

let swRegistration: ServiceWorkerRegistration | null = null;

// Register Service Worker in production/development browser environments
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      try {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            swRegistration = reg;
            console.log('[PWA] ServiceWorker registrado:', reg.scope);

            // Check if there's already a waiting worker
            if (reg.waiting) {
              window.dispatchEvent(new CustomEvent('pwa-update-available'));
            }

            // Listen for new workers installing
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] Nova versão instalada e pronta para ativação!');
                    window.dispatchEvent(new CustomEvent('pwa-update-available'));
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.log('[PWA] ServiceWorker registration skipped in current frame context:', err);
          });

        // Auto reload when controller changes (new ServiceWorker activated)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            console.log('[PWA] Controller alterado! Recarregando aplicação para nova versão...');
            window.location.reload();
          }
        });
      } catch (e) {
        console.log('[PWA] ServiceWorker safe catch:', e);
      }
    });
  }
}

// Interface for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [lastCheckMessage, setLastCheckMessage] = useState<string | null>(null);

  const applyUpdate = useCallback(() => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      window.location.reload();
    } else {
      window.location.reload();
    }
  }, []);

  const checkForUpdate = useCallback(async () => {
    setIsCheckingUpdate(true);
    setLastCheckMessage(null);

    if (swRegistration) {
      try {
        await swRegistration.update();
        if (swRegistration.waiting) {
          setUpdateAvailable(true);
          setLastCheckMessage('Nova versão disponível!');
        } else {
          setLastCheckMessage('Seu app já está na versão mais recente!');
        }
      } catch (e) {
        setLastCheckMessage('Não foi possível verificar atualizações no momento.');
      }
    } else {
      setLastCheckMessage('Seu app está atualizado.');
    }

    setTimeout(() => {
      setIsCheckingUpdate(false);
    }, 800);
  }, []);

  useEffect(() => {
    // Check if app is already running in standalone (PWA) mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Try locking screen orientation to portrait on Android / mobile devices
    if (typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
      try {
        (screen.orientation.lock as (orientation: string) => Promise<void>)('portrait').catch(() => {
          // Silent catch: Chrome Android requires user gesture or PWA standalone mode
        });
      } catch (e) {
        // Ignore unsupported environments
      }
    }

    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[PWA] Aplicativo instalado no dispositivo!');
    };

    const handleOnline = () => {
      setIsOnline(true);
      if (swRegistration) swRegistration.update();
    };

    const handleOffline = () => setIsOnline(false);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && swRegistration) {
        swRegistration.update();
      }
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodically check for ServiceWorker updates every 60 seconds
    const intervalId = setInterval(() => {
      if (navigator.onLine && swRegistration) {
        swRegistration.update();
      }
    }, 60000);

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    updateAvailable,
    isCheckingUpdate,
    lastCheckMessage,
    triggerInstall,
    applyUpdate,
    checkForUpdate,
  };
}
