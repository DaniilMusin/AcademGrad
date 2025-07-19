'use client';

import React, { useState, useEffect } from 'react';
// Note: Firebase imports are commented out as they require Firebase setup
// import { initializeApp, getApps } from 'firebase/app';
// import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface PushNotificationConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
}

// Temporary Messaging type for compatibility
type Messaging = any;

class PushNotificationService {
  private messaging: Messaging | null = null;
  private isSupported = false;
  private isInitialized = false;

  constructor() {
    this.checkSupport();
  }

  private checkSupport(): void {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async initialize(config: PushNotificationConfig): Promise<boolean> {
    if (!this.isSupported || this.isInitialized) {
      return false;
    }

    try {
      // Firebase initialization would go here
      // const app = initializeApp(config);
      // this.messaging = getMessaging(app);
      
      await this.registerServiceWorker();
      this.setupForegroundListener();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private setupForegroundListener(): void {
    if (!this.messaging) return;

    // Firebase messaging listener would go here
    // onMessage(this.messaging, (payload) => {
    //   console.log('Message received:', payload);
    //   this.showNotification({
    //     title: payload.notification?.title || 'New Message',
    //     body: payload.notification?.body || '',
    //     icon: payload.notification?.icon,
    //     data: payload.data
    //   });
    // });
  }

  async requestPermission(): Promise<string> {
    if (!this.isSupported) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async getRegistrationToken(vapidKey: string): Promise<string | null> {
    if (!this.messaging || !this.isSupported) {
      return null;
    }

    try {
      // Firebase token retrieval would go here
      // const token = await getToken(this.messaging, { vapidKey });
      // return token;
      return 'mock-token-' + Math.random().toString(36).substr(2, 9);
    } catch (error) {
      console.error('Error getting registration token:', error);
      return null;
    }
  }

  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        tag: payload.tag,
        data: payload.data,
        // actions: payload.actions, // Not supported in all browsers
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async subscribeToTopic(token: string, topic: string): Promise<boolean> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          topic,
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to subscribe to topic:', error);
      return false;
    }
  }

  async unsubscribeFromTopic(token: string, topic: string): Promise<boolean> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          topic,
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to unsubscribe from topic:', error);
      return false;
    }
  }

  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) {
      return 'denied';
    }
    return Notification.permission;
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();

// React hook for push notifications
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsSupported(pushNotificationService.isNotificationSupported());
    setPermission(pushNotificationService.getPermissionStatus());
  }, []);

  const initializePushNotifications = async (config: PushNotificationConfig) => {
    setIsLoading(true);
    try {
      const success = await pushNotificationService.initialize(config);
      if (success && permission === 'granted') {
        const fcmToken = await pushNotificationService.getRegistrationToken(config.vapidKey);
        setToken(fcmToken);
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const newPermission = await pushNotificationService.requestPermission();
      setPermission(newPermission as NotificationPermission);
      return newPermission;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    await pushNotificationService.showNotification({
      title: 'Тестовое уведомление',
      body: 'Push-уведомления работают корректно!',
      icon: '/icon-192x192.png',
      tag: 'test'
    });
  };

  return {
    isSupported,
    permission,
    token,
    isLoading,
    initializePushNotifications,
    requestPermission,
    sendTestNotification,
    subscribeToTopic: pushNotificationService.subscribeToTopic.bind(pushNotificationService),
    unsubscribeFromTopic: pushNotificationService.unsubscribeFromTopic.bind(pushNotificationService)
  };
}

// Component for push notification setup
export function PushNotificationSetup({ config }: { config: PushNotificationConfig }) {
  const {
    isSupported,
    permission,
    token,
    isLoading,
    initializePushNotifications,
    requestPermission,
    sendTestNotification
  } = usePushNotifications();

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isSupported && !isInitialized) {
      initializePushNotifications(config).then(setIsInitialized);
    }
  }, [isSupported, isInitialized, config, initializePushNotifications]);

  const handleEnableNotifications = async () => {
    const newPermission = await requestPermission();
    if (newPermission === 'granted') {
      // Re-initialize to get token
      await initializePushNotifications(config);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Уведомления не поддерживаются
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Ваш браузер не поддерживает push-уведомления
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Уведомления заблокированы
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Разрешите уведомления в настройках браузера для получения обновлений
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === 'default') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Включить уведомления
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Получайте уведомления о новых задачах и достижениях
              </p>
            </div>
          </div>
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Загрузка...' : 'Включить'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Уведомления включены
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Вы будете получать push-уведомления
            </p>
            {token && (
              <p className="text-xs text-green-600 mt-1 font-mono">
                Token: {token.substring(0, 20)}...
              </p>
            )}
          </div>
        </div>
        <button
          onClick={sendTestNotification}
          className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
        >
          Тест
        </button>
      </div>
    </div>
  );
}