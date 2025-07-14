'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  plan: {
    id: string;
    nickname: string;
    amount: number;
    currency: string;
    interval: 'month' | 'year';
  };
  cancel_at_period_end: boolean;
}

interface StripeCustomerPortalProps {
  customerId: string;
  subscription?: Subscription;
  onSubscriptionUpdate?: (subscription: Subscription) => void;
}

export default function StripeCustomerPortal({
  customerId,
  subscription,
  onSubscriptionUpdate
}: StripeCustomerPortalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createPortalSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          return_url: window.location.href
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      setPortalUrl(url);
      
      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscription.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const updatedSubscription = await response.json();
      onSubscriptionUpdate?.(updatedSubscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const reactivateSubscription = async () => {
    if (!subscription) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/reactivate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscription.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }

      const updatedSubscription = await response.json();
      onSubscriptionUpdate?.(updatedSubscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'canceled':
        return 'text-red-600 bg-red-100';
      case 'past_due':
      case 'unpaid':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активна';
      case 'canceled':
        return 'Отменена';
      case 'past_due':
        return 'Просрочена';
      case 'unpaid':
        return 'Не оплачена';
      case 'incomplete':
        return 'Неполная';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Управление подпиской
        </h2>
        <button
          onClick={createPortalSession}
          disabled={isLoading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Загрузка...' : 'Открыть портал'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {subscription ? (
        <div className="space-y-6">
          {/* Current Subscription Info */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Текущая подписка
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  subscription.status
                )}`}
              >
                {getStatusText(subscription.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Тариф</p>
                <p className="font-medium">
                  {subscription.plan.nickname || `${subscription.plan.interval} plan`}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Стоимость</p>
                <p className="font-medium">
                  {formatAmount(subscription.plan.amount, subscription.plan.currency)} / {subscription.plan.interval === 'month' ? 'месяц' : 'год'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Начало периода</p>
                <p className="font-medium">
                  {formatDate(subscription.current_period_start)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Конец периода</p>
                <p className="font-medium">
                  {formatDate(subscription.current_period_end)}
                </p>
              </div>
            </div>

            {subscription.cancel_at_period_end && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Подписка будет отменена {formatDate(subscription.current_period_end)}
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Быстрые действия
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                <button
                  onClick={cancelSubscription}
                  disabled={isLoading}
                  className="p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="text-red-600 font-medium">Отменить подписку</div>
                  <div className="text-red-500 text-sm mt-1">
                    Отменить подписку в конце текущего периода
                  </div>
                </button>
              )}

              {subscription.cancel_at_period_end && (
                <button
                  onClick={reactivateSubscription}
                  disabled={isLoading}
                  className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="text-green-600 font-medium">Возобновить подписку</div>
                  <div className="text-green-500 text-sm mt-1">
                    Отменить запланированную отмену
                  </div>
                </button>
              )}

              <button
                onClick={createPortalSession}
                disabled={isLoading}
                className="p-4 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors text-left disabled:opacity-50"
              >
                <div className="text-indigo-600 font-medium">Изменить план</div>
                <div className="text-indigo-500 text-sm mt-1">
                  Перейти к управлению подпиской
                </div>
              </button>
            </div>
          </div>

          {/* Billing History Link */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              История платежей
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Просмотрите все ваши счета и загрузите квитанции
            </p>
            <button
              onClick={createPortalSession}
              disabled={isLoading}
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
            >
              Перейти к истории платежей →
            </button>
          </div>
        </div>
      ) : (
        /* No Subscription */
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-gray-400 text-2xl">💳</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Нет активной подписки
          </h3>
          <p className="text-gray-600 mb-6">
            Подпишитесь на один из наших планов, чтобы получить доступ ко всем функциям
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Выбрать план
          </button>
        </div>
      )}
    </div>
  );
}