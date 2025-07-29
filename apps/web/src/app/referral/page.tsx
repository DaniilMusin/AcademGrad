'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Share2, Copy, Gift, Users, Trophy, ExternalLink } from 'lucide-react';

const supabase = createClient();

interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_earned: number;
  pending_reward: number;
  referral_code: string;
}

interface ReferralUser {
  id: string;
  email: string;
  created_at: string;
  status: 'pending' | 'active' | 'premium';
  reward_earned: number;
}

export default function Referral() {
  const [stats, setStats] = useState<ReferralStats>({
    total_referrals: 0,
    active_referrals: 0,
    total_earned: 0,
    pending_reward: 0,
    referral_code: ''
  });
  const [referrals, setReferrals] = useState<ReferralUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Генерируем или получаем реферальный код
      let referralCode = await generateReferralCode(user.id);
      
      // Загружаем статистику рефералов
      const { data: referralData } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_user_id,
          status,
          reward_earned,
          created_at,
          user_profiles!referred_user_id (
            email
          )
        `)
        .eq('referrer_user_id', user.id);

      const totalReferrals = referralData?.length || 0;
      const activeReferrals = referralData?.filter(r => r.status === 'active' || r.status === 'premium').length || 0;
      const totalEarned = referralData?.reduce((sum, r) => sum + (r.reward_earned || 0), 0) || 0;
      const pendingReward = referralData?.filter(r => r.status === 'pending').length * 100 || 0; // 100 рублей за каждого

      setStats({
        total_referrals: totalReferrals,
        active_referrals: activeReferrals,
        total_earned: totalEarned,
        pending_reward: pendingReward,
        referral_code: referralCode
      });

      const processedReferrals = referralData?.map(r => ({
        id: r.id,
        email: r.user_profiles?.email || 'Неизвестно',
        created_at: r.created_at,
        status: r.status as 'pending' | 'active' | 'premium',
        reward_earned: r.reward_earned || 0
      })) || [];

      setReferrals(processedReferrals);

    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateReferralCode = async (userId: string): Promise<string> => {
    // Проверяем, есть ли уже код
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('referral_code')
      .eq('user_id', userId)
      .single();

    if (existingProfile?.referral_code) {
      return existingProfile.referral_code;
    }

    // Генерируем новый код
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Сохраняем в профиль
    await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        referral_code: code
      });

    return code;
  };

  const copyReferralLink = async () => {
    const referralLink = `${window.location.origin}/?ref=${stats.referral_code}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareReferralLink = async () => {
    const referralLink = `${window.location.origin}/?ref=${stats.referral_code}`;
    const shareText = 'Присоединяйся к AcademGrad - лучшей платформе для подготовки к ЕГЭ! Получи бонусы по моей ссылке.';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AcademGrad - Подготовка к ЕГЭ',
          text: shareText,
          url: referralLink,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback для браузеров без Web Share API
      copyReferralLink();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Ожидает</span>;
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Активен</span>;
      case 'premium':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Премиум</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Неизвестно</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Реферальная программа</h1>
          <p className="text-gray-600">
            Приглашайте друзей и получайте бонусы за каждого активного пользователя!
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Всего приглашений</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_referrals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Активные рефералы</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_referrals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Заработано</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_earned}₽</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Gift className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">К начислению</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_reward}₽</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Реферальная ссылка */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ваша реферальная ссылка</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm text-gray-600 mb-1">Реферальный код:</p>
                    <p className="font-mono text-lg font-bold text-blue-600">{stats.referral_code}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={copyReferralLink}
                      className={`p-2 rounded-lg transition-colors ${
                        copySuccess 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                      title="Копировать ссылку"
                    >
                      {copySuccess ? '✓' : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={shareReferralLink}
                      className={`p-2 rounded-lg transition-colors ${
                        shareSuccess 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                      }`}
                      title="Поделиться"
                    >
                      {shareSuccess ? '✓' : <Share2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                <p>Полная ссылка: <code className="bg-gray-100 px-2 py-1 rounded">
                  {`${window.location.origin}/?ref=${stats.referral_code}`}
                </code></p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={copyReferralLink}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copySuccess ? 'Скопировано!' : 'Копировать ссылку'}
                </button>
                <button
                  onClick={shareReferralLink}
                  className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {shareSuccess ? 'Отправлено!' : 'Поделиться'}
                </button>
              </div>
            </div>

            {/* Список рефералов */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ваши рефералы</h2>
              
              {referrals.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Пока никто не зарегистрировался по вашей ссылке</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Поделитесь ссылкой с друзьями, чтобы начать зарабатывать!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{referral.email}</p>
                          <p className="text-sm text-gray-600">
                            Присоединился {new Date(referral.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {getStatusBadge(referral.status)}
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{referral.reward_earned}₽</p>
                          <p className="text-xs text-gray-500">заработано</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Условия программы */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Как это работает?</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Поделитесь ссылкой</p>
                    <p className="text-xs text-gray-600">Отправьте реферальную ссылку друзьям</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Друг регистрируется</p>
                    <p className="text-xs text-gray-600">По вашей ссылке создает аккаунт</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Получите бонус</p>
                    <p className="text-xs text-gray-600">За активного пользователя - 100₽</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Награды</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-800">Регистрация</p>
                    <p className="text-xs text-green-600">Друг создал аккаунт</p>
                  </div>
                  <span className="font-bold text-green-700">50₽</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Активность</p>
                    <p className="text-xs text-blue-600">Решил 10+ задач</p>
                  </div>
                  <span className="font-bold text-blue-700">100₽</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-purple-800">Подписка</p>
                    <p className="text-xs text-purple-600">Оформил премиум</p>
                  </div>
                  <span className="font-bold text-purple-700">500₽</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Вывод средств</h3>
              <p className="text-sm text-gray-600 mb-4">
                Минимальная сумма для вывода: 500₽
              </p>
              <button
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  stats.total_earned >= 500 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                disabled={stats.total_earned < 500}
              >
                {stats.total_earned >= 500 ? 'Вывести средства' : `Еще ${500 - stats.total_earned}₽ до вывода`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
