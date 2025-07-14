"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import ProgressChart from "@/components/ProgressChart";
// Assuming you have a BadgeCarousel component
// import BadgeCarousel from "@/components/BadgeCarousel";

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
  const [stats, setStats] = useState({
    tasksSolved: 0,
    currentStreak: 0, // You might need another query for this
    totalXp: 0, // And this
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Необходимо войти в систему");
        setLoading(false);
        return;
      }

      // Fetch weak topics
      const { data: weakTopicsData, error: weakTopicsError } = await supabase
        .from("weak_topics")
        .select("*")
        .eq("user_id", user.id)
        .order("error_rate", { ascending: false })
        .limit(10);

      if (weakTopicsError) throw weakTopicsError;
      setWeakTopics(weakTopicsData || []);

      // Fetch badges
      const { data: badgesData, error: badgesError } = await supabase
        .from("user_badges")
        .select(`
          given_at,
          badges (id, code, title, icon)
        `)
        .eq("user_id", user.id)
        .order("given_at", { ascending: false });

      if (badgesError) throw badgesError;
      const formattedBadges = badgesData?.map(item => ({
        ...item.badges,
        given_at: item.given_at,
      })) || [];
      setBadges(formattedBadges);

      // Fetch user progress for stats
      const { data: progressData, error: progressError } = await supabase
        .from("user_progress")
        .select("total_xp, current_streak")
        .eq("user_id", user.id)
        .single();
        
      if (progressError) console.error("Could not load user progress stats");

      const totalAttempts = weakTopicsData?.reduce((sum, topic) => sum + topic.attempts_count, 0) || 0;

      setStats({
          tasksSolved: totalAttempts,
          currentStreak: progressData?.current_streak || 0,
          totalXp: progressData?.total_xp || 0
      });


    } catch (err: any) {
      console.error("Error loading dashboard:", err);
      setError("Ошибка загрузки данных: " + err.message);
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
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h2>
            <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Личный кабинет</h1>
          <p className="text-gray-600">Отслеживайте свой прогресс и достижения</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full"><span className="text-2xl">📚</span></div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Tasks Solved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tasksSolved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full"><span className="text-2xl">🔥</span></div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full"><span className="text-2xl">⭐</span></div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total XP</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalXp}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full"><span className="text-2xl">🏆</span></div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Badges</p>
                <p className="text-2xl font-bold text-gray-900">{badges.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weak Topics Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Темы для повторения</h2>
            {weakTopics.length > 0 ? (
              <div>
                <ProgressChart data={weakTopics} />
                <div className="mt-4 text-sm text-gray-600">
                  <p>Показаны темы с наибольшим процентом ошибок за последние 30 дней.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Пока нет данных для анализа. Решите несколько задач!</p>
              </div>
            )}
          </div>

          {/* Badges List */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Достижения</h2>
            {badges.length > 0 ? (
              <div className="space-y-3">
                {badges.slice(0, 5).map((badge) => (
                  <div key={badge.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl">{badge.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{badge.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(badge.given_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                ))}
                {badges.length > 5 && <p className="text-sm text-center text-gray-500 mt-4">...и еще {badges.length - 5}</p>}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-gray-500 text-sm">Пока нет достижений. Решайте задачи, чтобы получить первый бейдж!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}