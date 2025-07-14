'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                            (window.navigator as any).standalone ||
                            document.referrer.includes('android-app://');
    setIsStandalone(isStandaloneMode);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Don't show immediately, wait a bit for user engagement
      setTimeout(() => {
        const hasShownPrompt = localStorage.getItem('pwa-install-prompt-shown');
        if (!hasShownPrompt && !isStandaloneMode) {
          setShowPrompt(true);
        }
      }, 30000); // Show after 30 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show custom prompt after some engagement
    if (iOS && !isStandaloneMode) {
      const hasShownIOSPrompt = localStorage.getItem('pwa-ios-prompt-shown');
      if (!hasShownIOSPrompt) {
        setTimeout(() => setShowPrompt(true), 45000); // Show after 45 seconds on iOS
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // iOS fallback - show instructions
      setShowPrompt(true);
      return;
    }

    setShowPrompt(false);
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA install accepted');
    } else {
      console.log('PWA install dismissed');
    }

    setDeferredPrompt(null);
    localStorage.setItem('pwa-install-prompt-shown', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(isIOS ? 'pwa-ios-prompt-shown' : 'pwa-install-prompt-shown', 'true');
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={20} />
        </button>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Установить AcademGrad
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Установите приложение для быстрого доступа к задачам ЕГЭ, работы офлайн и получения уведомлений.
            </p>

            {isIOS ? (
              <div className="space-y-2 mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Для установки на iOS:
                </p>
                <ol className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                  <li>1. Нажмите кнопку "Поделиться" <span className="inline-block">📤</span></li>
                  <li>2. Выберите "На экран «Домой»"</li>
                  <li>3. Нажмите "Добавить"</li>
                </ol>
              </div>
            ) : (
              <div className="flex items-center space-x-2 mb-4">
                <Download className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Доступна быстрая установка
                </span>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isIOS ? 'Показать инструкции' : 'Установить'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Позже
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}