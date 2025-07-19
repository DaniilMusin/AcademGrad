'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ExternalLink, CreditCard, Settings, AlertCircle, Loader2 } from 'lucide-react';

const supabase = createClient();

export default function CustomerPortalPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Пользователь не авторизован');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setError('Ошибка при загрузке подписки');
    }
  };

  const redirectToCustomerPortal = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Пользователь не авторизован');
      }

      const response = await fetch('/api/subscription/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: window.location.origin + '/subscription',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании сессии');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('URL портала не получен');
      }
    } catch (error) {
      console.error('Error redirecting to customer portal:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Управление подпиской
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Управляйте своей подпиской через безопасный портал Stripe
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-red-700 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}

            {subscription && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Текущая подписка
                </h3>
                <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <p><strong>План:</strong> {subscription.plan_name}</p>
                  <p><strong>Статус:</strong> {subscription.status}</p>
                  <p><strong>Следующее списание:</strong> {new Date(subscription.current_period_end).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Что можно сделать в портале клиента:
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CreditCard className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Обновить способ оплаты</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Измените банковскую карту или добавьте новую
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Settings className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Изменить план подписки</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Обновите или отмените свою подписку
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <ExternalLink className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Просмотреть историю платежей</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Скачайте квитанции и просмотрите все транзакции
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <button
                onClick={redirectToCustomerPortal}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Перенаправление...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Открыть портал клиента
                  </>
                )}
              </button>
              
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                Вы будете перенаправлены на защищенную страницу Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}