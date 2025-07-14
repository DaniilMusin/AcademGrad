'use client';

// Firebase Cloud Messaging integration for push notifications
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

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

class PushNotificationService {
  private messaging: Messaging | null = null;
  private isSupported = false;
  private isInitialized = false;

  constructor() {
    this.checkSupport();
  }

  private checkSupport(): void {
    this.isSupported = 
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
  }

  async initialize(config: PushNotificationConfig): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Initialize Firebase if not already done
      if (!getApps().length) {
        initializeApp({
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId
        });
      }

      // Register service worker
      await this.registerServiceWorker();

      // Initialize messaging
      this.messaging = getMessaging();
      this.isInitialized = true;

      // Set up message listener for foreground messages
      this.setupForegroundListener();

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    }
  }

  private setupForegroundListener(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      if (payload.notification) {
        this.showNotification({
          title: payload.notification.title || 'Новое уведомление',
          body: payload.notification.body || '',
          icon: payload.notification.icon || '/icon-192x192.png',
          data: payload.data
        });
      }
    });
  }

  async requestPermission(): Promise<string> {
    if (!this.isSupported) {
      return 'unsupported';
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  async getRegistrationToken(vapidKey: string): Promise<string | null> {
    if (!this.messaging || !this.isInitialized) {
      console.error('Push notifications not initialized');
      return null;
    }

    try {
      const token = await getToken(this.messaging, { vapidKey });
      console.log('FCM registration token:', token);
      return token;
    } catch (error) {
      console.error('Failed to get registration token:', error);
      return null;
    }
  }

  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported || Notification.permission !== 'granted') {
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      tag: payload.tag || 'default',
      data: payload.data,
      actions: payload.actions,
      requireInteraction: true,
      vibrate: [200, 100, 200]
    });
  }

  async subscribeToTopic(token: string, topic: string): Promise<boolean> {
    try {
      const response = await fetch('/api/push-notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          topic
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
      const response = await fetch('/api/push-notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          topic
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