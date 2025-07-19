'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface UseAddToHomeScreenReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  promptInstall: () => Promise<boolean>;
  dismissPrompt: () => void;
  showIOSInstructions: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;
}

export function useAddToHomeScreen(): UseAddToHomeScreenReturn {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Detect if app is already installed
  const isStandalone = 
    typeof window !== 'undefined' && 
    (window.matchMedia('(display-mode: standalone)').matches || 
     (window.navigator as any)?.standalone === true);

  // Detect iOS
  const isIOS = 
    typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    // Check if app is already installed
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const beforeInstallEvent = e as BeforeInstallPromptEvent;
      setInstallPromptEvent(beforeInstallEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPromptEvent(null);
      console.log('PWA was installed');
    };

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if PWA install criteria are met
    if (isIOS && !isStandalone) {
      // For iOS, we show custom instructions since beforeinstallprompt doesn't work
      const hasPromptedBefore = localStorage.getItem('ios-install-prompted');
      if (!hasPromptedBefore) {
        setTimeout(() => {
          setShowIOSInstructions(true);
        }, 3000); // Show after 3 seconds
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isIOS, isStandalone]);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPromptEvent) {
      // For iOS, show custom instructions
      if (isIOS && !isStandalone) {
        setShowIOSInstructions(true);
        return false;
      }
      return false;
    }

    try {
      await installPromptEvent.prompt();
      const choiceResult = await installPromptEvent.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstallable(false);
        setInstallPromptEvent(null);
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }, [installPromptEvent, isIOS, isStandalone]);

  const dismissPrompt = useCallback(() => {
    setShowIOSInstructions(false);
    if (isIOS) {
      localStorage.setItem('ios-install-prompted', 'true');
    }
  }, [isIOS]);

  return {
    isInstallable: isInstallable || (isIOS && !isStandalone && !isInstalled),
    isInstalled,
    isIOS,
    isStandalone,
    promptInstall,
    dismissPrompt,
    showIOSInstructions,
    installPromptEvent
  };
}

// Component for PWA install prompt
export function PWAInstallPrompt() {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    promptInstall,
    dismissPrompt,
    showIOSInstructions
  } = useAddToHomeScreen();

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show prompt after user has been on the site for a while
    const timer = setTimeout(() => {
      if (isInstallable && !isInstalled) {
        setIsVisible(true);
      }
    }, 10000); // Show after 10 seconds

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success || !isIOS) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    dismissPrompt();
    // Don't show again for 24 hours
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't show if recently dismissed
  const recentlyDismissed = () => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      return (now - dismissedTime) < dayInMs;
    }
    return false;
  };

  if (!isVisible || isInstalled || recentlyDismissed()) {
    return null;
  }

  return (
    <>
      {/* Standard PWA prompt */}
      {!isIOS && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📱</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">
                Установить приложение
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Добавьте наше приложение на главный экран для быстрого доступа
              </p>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Установить
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-gray-600 text-sm hover:text-gray-800 transition-colors"
                >
                  Позже
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* iOS instructions modal */}
      {isIOS && showIOSInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">📱</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Установить приложение
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Добавьте это приложение на главный экран iPhone для лучшего опыта
              </p>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 text-sm">1</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Нажмите кнопку &quot;Поделиться&quot; <span className="inline-block">📤</span> внизу экрана
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 text-sm">2</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Прокрутите вниз и выберите &quot;На экран «Домой»&quot; <span className="inline-block">➕</span>
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 text-sm">3</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Нажмите &quot;Добавить&quot; в правом верхнем углу
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="w-full mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}