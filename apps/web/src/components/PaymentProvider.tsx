'use client';

import { useState } from 'react';
import { CreditCard, Globe, DollarSign } from 'lucide-react';

interface PaymentProviderProps {
  onProviderSelect: (provider: 'stripe' | 'yookassa') => void;
  selectedProvider?: 'stripe' | 'yookassa';
}

export default function PaymentProvider({ onProviderSelect, selectedProvider }: PaymentProviderProps) {
  const [selected, setSelected] = useState<'stripe' | 'yookassa'>(selectedProvider || 'stripe');

  const handleSelect = (provider: 'stripe' | 'yookassa') => {
    setSelected(provider);
    onProviderSelect(provider);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Выберите способ оплаты
      </h3>
      
      <div className="space-y-3">
        {/* Stripe */}
        <div
          onClick={() => handleSelect('stripe')}
          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
            selected === 'stripe'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              selected === 'stripe'
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
            }`}>
              {selected === 'stripe' && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Stripe</span>
                <Globe className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Международные карты: Visa, Mastercard, American Express
              </p>
            </div>
          </div>
        </div>

        {/* YooKassa */}
        <div
          onClick={() => handleSelect('yookassa')}
          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
            selected === 'yookassa'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              selected === 'yookassa'
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
            }`}>
              {selected === 'yookassa' && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="font-medium">ЮKassa</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Рекомендуем
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Российские карты: МИР, Visa, Mastercard, СБП, кошельки
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-4">
        <p>
          🔒 Все платежи защищены и проходят через сертифицированные платежные системы.
          Мы не храним данные ваших банковских карт.
        </p>
      </div>
    </div>
  );
}