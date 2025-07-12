'use client';

import React, { useState, useEffect } from 'react';
import OnboardingWizard from '@/components/OnboardingWizard';
import { createClient } from '@/lib/supabase';

export default function Step4() {
  const [telegramUsername, setTelegramUsername] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const supabase = createClient();

  useEffect(() => {
    loadCurrentPreferences();
    checkPushPermission();
  }, []);

  const loadCurrentPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('tg_chat, fcm_token')
          .eq('user_id', user.id)
          .single();
        
        if (preferences) {
          if (preferences.tg_chat) {
            setTelegramUsername(preferences.tg_chat);
            setTelegramConnected(true);
          }
          if (preferences.fcm_token) {
            setPushEnabled(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const checkPushPermission = () => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  };

  const handleTelegramConnect = async () => {
    if (!telegramUsername.startsWith('@')) {
      alert('Telegram username должен начинаться с @');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Call edge function to register telegram user
        const response = await fetch('/api/telegram-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: telegramUsername,
            user_id: user.id
          })
        });

        if (response.ok) {
          await supabase
            .from('user_preferences')
            .upsert({ 
              user_id: user.id, 
              tg_chat: telegramUsername,
              onboarding_step: 4
            });
          setTelegramConnected(true);
        } else {
          throw new Error('Failed to connect Telegram');
        }
      }
    } catch (error) {
      console.error('Error connecting Telegram:', error);
      alert('Ошибка подключения Telegram. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushEnable = async () => {
    if (!('Notification' in window)) {
      alert('Ваш браузер не поддерживает push-уведомления');
      return;
    }

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        // Register service worker and get FCM token
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // This would typically involve Firebase Cloud Messaging
        // For now, we'll just simulate the token
        const mockToken = 'fcm-token-' + Math.random().toString(36).substr(2, 9);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('user_preferences')
            .upsert({ 
              user_id: user.id, 
              fcm_token: mockToken,
              onboarding_step: 4
            });
        }
        
        setPushEnabled(true);
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      alert('Ошибка подключения push-уведомлений');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingWizard currentStep={4}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <p className="text-gray-600">
            Подключи уведомления, чтобы не пропускать занятия и получать 
            персональные рекомендации по подготовке.
          </p>
        </div>

        <div className="space-y-6">
          {/* Telegram Bot */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-1">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Telegram Bot
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  Получай напоминания о занятиях и решай задачи прямо в Telegram
                </p>
                
                {!telegramConnected ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Твой Telegram username
                      </label>
                      <input
                        type="text"
                        value={telegramUsername}
                        onChange={(e) => setTelegramUsername(e.target.value)}
                        placeholder="@username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleTelegramConnect}
                      disabled={isLoading || !telegramUsername}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Подключаем...' : 'Подключить Telegram'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-green-700 font-medium">
                        Подключено: {telegramUsername}
                      </span>
                    </div>
                    <button
                      onClick={() => setTelegramConnected(false)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Изменить
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4 mt-1">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.81 7.81 0 0 1 0-15c2.14 0 4.07.875 5.46 2.29l-1.41 1.41A5.76 5.76 0 0 0 12 4a5.81 5.81 0 0 0 0 11.63V17z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">
                  Push-уведомления
                </h3>
                <p className="text-sm text-purple-700 mb-4">
                  Получай уведомления прямо в браузере, даже когда сайт закрыт
                </p>
                
                {!pushEnabled ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        Что ты будешь получать:
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Напоминания о запланированных занятиях</li>
                        <li>• Уведомления о новых заданиях</li>
                        <li>• Достижения и бейджи</li>
                        <li>• Еженедельные отчеты о прогрессе</li>
                      </ul>
                    </div>
                    
                    <button
                      onClick={handlePushEnable}
                      disabled={isLoading || pushPermission === 'denied'}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Подключаем...' : 
                       pushPermission === 'denied' ? 'Уведомления заблокированы' : 
                       'Разрешить уведомления'}
                    </button>
                    
                    {pushPermission === 'denied' && (
                      <p className="text-sm text-red-600">
                        Уведомления заблокированы. Разрешите их в настройках браузера.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-green-700 font-medium">
                        Push-уведомления активны
                      </span>
                    </div>
                    <button
                      onClick={() => setPushEnabled(false)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Отключить
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          {(telegramConnected || pushEnabled) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-1">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-green-800 mb-2">
                    Уведомления настроены!
                  </h4>
                  <div className="text-sm text-green-700 space-y-1">
                    {telegramConnected && (
                      <p>✓ Telegram бот подключен</p>
                    )}
                    {pushEnabled && (
                      <p>✓ Push-уведомления включены</p>
                    )}
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    Теперь ты не пропустишь ни одного занятия!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Настройки уведомлений можно изменить в любое время в профиле
          </p>
        </div>
      </div>
    </OnboardingWizard>
  );
}
