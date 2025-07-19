'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { CreditCard, Calendar, DollarSign, Settings, ExternalLink } from 'lucide-react';

const supabase = createClient();

interface Subscription {
  id: string;
  status: string;
  current_period_end: string;
  current_period_start: string;
  plan_name: string;
  plan_price: number;
  cancel_at_period_end: boolean;
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Пользователь не авторизован');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Ошибка загрузки подписки');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('User not authenticated');

      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          return_url: window.location.origin + '/subscription',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;

    } catch (err) {
      console.error('Error creating portal session:', err);
      setError('Ошибка создания сессии управления');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    window.location.href = '/dashboard?upgrade=true';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Управление подпиской
            </h1>

            {!subscription ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  У вас нет активной подписки
                </h2>
                <p className="text-gray-600 mb-6">
                  Подпишитесь на премиум план для доступа к расширенным возможностям
                </p>
                <button
                  onClick={handleUpgrade}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Выбрать план
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Текущий план
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      subscription.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {subscription.status === 'active' ? 'Активна' : subscription.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-500">План</p>
                        <p className="font-medium">{subscription.plan_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-500">Цена</p>
                        <p className="font-medium">{subscription.plan_price}₽/месяц</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-500">Следующее списание</p>
                        <p className="font-medium">
                          {new Date(subscription.current_period_end).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {subscription.cancel_at_period_end && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-700">
                        ⚠️ Подписка будет отменена {new Date(subscription.current_period_end).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Действия
                  </h3>
                  
                  <div className="space-y-4">
                    <button
                      onClick={handleManageSubscription}
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Управлять подпиской в Stripe</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    
                    <p className="text-sm text-gray-500">
                      Вы будете перенаправлены в безопасный портал Stripe для управления 
                      способами оплаты, счетами и настройками подписки.
                    </p>
                  </div>
                </div>

                {/* Billing History */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    История платежей
                  </h3>
                  
                  <p className="text-gray-600">
                    Полная история платежей доступна в портале управления Stripe.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}