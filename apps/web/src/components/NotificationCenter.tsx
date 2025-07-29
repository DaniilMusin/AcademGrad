'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Bell, X, Check, AlertCircle, Info, CheckCircle, Settings } from 'lucide-react';
import SimplePushService from '@/lib/push-service-wrapper';

const supabase = createClient();

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
  is_read: boolean;
  action_url?: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushService] = useState(() => new SimplePushService());
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const initializePushService = useCallback(async () => {
    try {
      const initialized = await pushService.init();
      if (initialized) {
        const subscribed = await pushService.isSubscribed();
        setIsPushEnabled(subscribed);
      }
    } catch (error) {
      console.warn('Push service not available:', error);
    }
  }, [pushService]);

  useEffect(() => {
    loadNotifications();
    initializePushService();
    
    // Подписываемся на новые уведомления
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload: any) => {
        const newNotification = payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Показываем push уведомление через service worker
        pushService.showNotification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico',
          tag: newNotification.id,
          data: { notificationId: newNotification.id, actionUrl: newNotification.action_url }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications, initializePushService, pushService]);


  const loadNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Загружаем только необходимые поля для производительности
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, type, created_at, is_read, action_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10); // Уменьшили лимит для быстрой загрузки

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n: any) => !n.is_read).length || 0);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map((n: any) => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const togglePushNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isPushEnabled) {
        const success = await pushService.unsubscribe(user.id);
        if (success) {
          setIsPushEnabled(false);
        }
      } else {
        const success = await pushService.subscribe(user.id);
        if (success) {
          setIsPushEnabled(true);
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
    }
  };

  const requestNotificationPermission = async () => {
    const permission = await pushService.requestPermission();
    return permission === 'granted';
  };

  return (
    <div className="relative">
      {/* Кнопка уведомлений */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            requestNotificationPermission();
          }
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Панель уведомлений */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Уведомления</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Настройки уведомлений"
                >
                  <Settings className="w-5 h-5" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    Прочитать все
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Настройки уведомлений */}
          {showSettings && (
            <div className="border-b border-gray-200 p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">Настройки уведомлений</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-700">Push-уведомления</span>
                  </div>
                  <button
                    onClick={togglePushNotifications}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPushEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isPushEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <p className="text-xs text-gray-500">
                  {isPushEnabled 
                    ? 'Вы будете получать уведомления даже когда сайт закрыт'
                    : 'Включите, чтобы получать уведомления в браузере'
                  }
                </p>
              </div>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Нет уведомлений</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          
                          <div className="flex items-center space-x-1">
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Отметить как прочитанное"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-gray-400 hover:text-red-600"
                              title="Удалить"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.created_at).toLocaleString('ru-RU')}
                        </p>
                        
                        {notification.action_url && (
                          <a
                            href={notification.action_url}
                            className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800"
                            onClick={() => {
                              if (!notification.is_read) {
                                markAsRead(notification.id);
                              }
                              setIsOpen(false);
                            }}
                          >
                            Перейти →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}