'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';

interface PushNotificationsProps {
  vapidKey?: string;
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

export default function PushNotifications({ vapidKey, firebaseConfig }: PushNotificationsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Check existing subscription
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          setIsSubscribed(!!sub);
          setSubscription(sub);
        });
      });
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    const permission = await Notification.requestPermission();
    setPermission(permission);
    return permission;
  };

  const subscribeToPush = async () => {
    try {
      const permission = await requestPermission();
      
      if (permission !== 'granted') {
        alert('Разрешение на уведомления не предоставлено');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey ? urlBase64ToUint8Array(vapidKey) : undefined,
      });

      setSubscription(pushSubscription);
      setIsSubscribed(true);

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: pushSubscription,
          userAgent: navigator.userAgent,
        }),
      });

      // Show test notification
      registration.showNotification('AcademGrad', {
        body: 'Push-уведомления успешно настроены!',
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        tag: 'welcome',
      });

    } catch (error) {
      console.error('Ошибка подписки на push:', error);
      alert('Ошибка подписки на уведомления');
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove subscription from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });
        
        setSubscription(null);
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Ошибка отписки от push:', error);
      alert('Ошибка отписки от уведомлений');
    }
  };

  const sendTestNotification = async () => {
    try {
      await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Тестовое уведомление',
          body: 'Это тестовое push-уведомление от AcademGrad!',
          icon: '/icon-192.svg',
          url: '/dashboard',
        }),
      });
    } catch (error) {
      console.error('Ошибка отправки тестового уведомления:', error);
    }
  };

  if (!isSupported) {
    return (
      <div className="text-gray-500 text-sm">
        Push-уведомления не поддерживаются вашим браузером
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-blue-600" />
          ) : (
            <BellOff className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <h3 className="font-medium">Push-уведомления</h3>
            <p className="text-sm text-gray-600">
              {isSubscribed 
                ? 'Уведомления включены' 
                : 'Получайте уведомления о новых задачах и достижениях'
              }
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {isSubscribed ? (
            <>
              <button
                onClick={sendTestNotification}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Тест
              </button>
              <button
                onClick={unsubscribeFromPush}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Отключить
              </button>
            </>
          ) : (
            <button
              onClick={subscribeToPush}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Включить
            </button>
          )}
        </div>
      </div>

      {permission === 'denied' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            Уведомления заблокированы. Разрешите уведомления в настройках браузера.
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}