"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import ProgressChart from "@/components/ProgressChart";

interface WeakTopic {
  topic: string;
  error_rate: number;
  attempts_count: number;
  last_attempt: string;
}

interface Badge {
  id: number;
  code: string;
  title: string;
  icon: string;
  given_at: string;
}

export default function Dashboard() {
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const supabase = createClient();
      
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Необходимо войти в систему");
        return;
      }

      // Загружаем слабые темы
      const { data: weakTopicsData, error: weakTopicsError } = await supabase
        .from("weak_topics")
        .select("*")
        .eq("user_id", user.id)
        .order("error_rate", { ascending: false })
        .limit(10);

      if (weakTopicsError) {
        console.error("Error loading weak topics:", weakTopicsError);
      } else {
        setWeakTopics(weakTopicsData || []);
      }

      // Загружаем бейджи пользователя
      const { data: badgesData, error: badgesError } = await supabase
        .from("user_badges")
        .select(`
          given_at,
          badges (
            id,
            code,
            title,
            icon
          )
        `)
        .eq("user_id", user.id)
        .order("given_at", { ascending: false });

      if (badgesError) {
        console.error("Error loading badges:", badgesError);
      } else {
        const formattedBadges = badgesData?.map(item => ({
          ...item.badges,
          given_at: item.given_at
        })) || [];
        setBadges(formattedBadges);
      }

    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Личный кабинет
        </h1>
        <p className="text-gray-600">
          Отслеживайте свой прогресс и достижения
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Слабые темы */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Темы для повторения
            </h2>
            {weakTopics.length > 0 ? (
              <div>
                <ProgressChart data={weakTopics} />
                <div className="mt-4 text-sm text-gray-600">
                  <p>Показаны темы с наибольшим процентом ошибок за последние 30 дней</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Пока нет данных для анализа. Решите несколько задач, чтобы увидеть статистику.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Бейджи */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Достижения
            </h2>
            {badges.length > 0 ? (
              <div className="space-y-3">
                {badges.map((badge, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="text-2xl">{badge.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{badge.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(badge.given_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-gray-500 text-sm">
                  Пока нет достижений. Решайте задачи, чтобы получить первый бейдж!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Быстрая статистика */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Всего решено задач</h3>
          <p className="text-2xl font-bold text-blue-600">
            {weakTopics.reduce((sum, topic) => sum + topic.attempts_count, 0)}
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Изученных тем</h3>
          <p className="text-2xl font-bold text-green-600">
            {weakTopics.length}
          </p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">Получено бейджей</h3>
          <p className="text-2xl font-bold text-purple-600">
            {badges.length}
          </p>
        </div>
      </div>
    </div>
  );
}
