'use client';

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { LazyPersonalAnalytics, LazyTaskHistory } from '@/components/LazyAnalytics';
import AuthModal from '@/components/AuthModal';

const ProgressChart = lazy(() => import('@/components/ProgressChart'));

const supabase = createClient();

interface UserStats {
  tasksSolved: number;
  currentStreak: number;
  totalXP: number;
  badges: number;
  totalBadges: number;
  weeklyProgress: number[];
  recentActivity: {
    topic: string;
    score: number;
    date: string;
  }[];
}

interface UpcomingSession {
  id: string;
  topic: string;
  difficulty: number;
  next_review: string;
  priority: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<UserStats>({
    tasksSolved: 0,
    currentStreak: 0,
    totalXP: 0,
    badges: 0,
    totalBadges: 4,
    weeklyProgress: [],
    recentActivity: []
  });
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      setUser(user);

      // Оптимизированная загрузка данных - только необходимые поля и лимиты
      const [
        { data: attempts, error: attemptsError },
        { data: schedule, error: scheduleError },
        { data: badges, error: badgesError }
      ] = await Promise.all([
        supabase
          .from('task_attempts')
          .select('task_number, is_correct, difficulty, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50), // Еще больше ограничили для быстродействия
        supabase
          .from('schedule_view')
          .select('topic, difficulty, next_review, priority')
          .eq('user_id', user.id)
          .order('priority', { ascending: false })
          .limit(3),
        supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', user.id)
          .limit(10) // Ограничили количество бейджей
      ]);

      if (attemptsError || scheduleError || badgesError) {
        console.error('Database errors:', { attemptsError, scheduleError, badgesError });
        setError('Ошибка загрузки данных из базы');
        return;
      }

      if (!attempts) return;

      // Вычисления статистики
      const solvedTasks = attempts.filter((a: any) => a.is_correct).length;
      const streak = calculateStreak(attempts);
      const xp = attempts.reduce((sum: number, a: any) => sum + (a.is_correct ? 10 * a.difficulty : 0), 0);
      const weeklyData = calculateWeeklyProgress(attempts);
      const recentActivity = attempts.slice(0, 5).map((a: any) => ({
        topic: `Задание ${a.task_number}`,
        score: a.is_correct ? 100 : 0,
        date: a.created_at
      }));

      setStats({
        tasksSolved: solvedTasks,
        currentStreak: streak,
        totalXP: xp,
        badges: badges?.length || 0,
        totalBadges: 4,
        weeklyProgress: weeklyData,
        recentActivity: recentActivity
      });

      setUpcomingSessions(schedule || []);

    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = useCallback((attempts: any[]) => {
    if (!attempts.length) return 0;
    
    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);
    
    const attemptsByDate = attempts.reduce((acc, attempt) => {
      const date = new Date(attempt.created_at).toDateString();
      if (!acc[date] || acc[date].score < (attempt.is_correct ? 100 : 0)) {
        acc[date] = { score: attempt.is_correct ? 100 : 0 };
      }
      return acc;
    }, {});

    while (currentDate >= new Date(attempts[attempts.length - 1]?.created_at || today)) {
      const dateStr = currentDate.toDateString();
      if (attemptsByDate[dateStr] && attemptsByDate[dateStr].score > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, []);

  const calculateWeeklyProgress = useCallback((attempts: any[]) => {
    const weekData = Array(7).fill(0);
    const today = new Date();
    
    attempts.forEach(attempt => {
      const attemptDate = new Date(attempt.created_at);
      const dayDiff = Math.floor((today.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff < 7 && dayDiff >= 0) {
        weekData[6 - dayDiff] += attempt.is_correct ? 1 : 0;
      }
    });
    
    return weekData;
  }, []);

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5: return 'bg-red-100 text-red-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal onSuccess={loadDashboardData} />;
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Отслеживайте свой прогресс и достижения</p>
        </div>

        {/* Персональная аналитика */}
        <LazyPersonalAnalytics className="mb-8" />

        {/* Статистические карточки */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="text-2xl">📚</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Решено задач</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tasksSolved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Текущая серия</p>
                <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Всего XP</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalXP}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Бейджи</p>
                <p className="text-2xl font-bold text-gray-900">{stats.badges}/{stats.totalBadges}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* График прогресса */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Прогресс за неделю</h2>
            <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded"></div>}>
              <ProgressChart data={stats.weeklyProgress} />
            </Suspense>
          </div>

          {/* Ближайшие занятия */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ближайшие занятия</h2>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm">{session.topic}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(session.priority)}`}>
                        {session.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {new Date(session.next_review).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Решите несколько задач для составления расписания</p>
            )}
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/tasks/1" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left block">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📚</span>
                <div>
                  <p className="font-medium text-gray-900">Начать обучение</p>
                  <p className="text-sm text-gray-600">Продолжить изучение</p>
                </div>
              </div>
            </Link>
            
            <Link href="/schedule" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left block">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📅</span>
                <div>
                  <p className="font-medium text-gray-900">Посмотреть расписание</p>
                  <p className="text-sm text-gray-600">Проверить план обучения</p>
                </div>
              </div>
            </Link>
            
            <Link href="/analytics" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left block">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <p className="font-medium text-gray-900">Посмотреть аналитику</p>
                  <p className="text-sm text-gray-600">Отследить результаты</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* История решений */}
        <LazyTaskHistory className="mb-8" limit={10} showFilters={false} />

        {/* Дополнительные быстрые действия */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ещё возможности</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/achievements" className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-left block">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🏆</span>
                <div>
                  <p className="font-medium text-gray-900">Достижения</p>
                  <p className="text-sm text-gray-600">Просмотр наград и прогресса</p>
                </div>
              </div>
            </Link>
            
            <Link href="/subscription" className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors text-left block">
              <div className="flex items-center">
                <span className="text-2xl mr-3">💎</span>
                <div>
                  <p className="font-medium text-gray-900">Подписка</p>
                  <p className="text-sm text-gray-600">Управление подпиской</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Недавняя активность */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Недавняя активность</h2>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{activity.topic}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(activity.date).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    activity.score === 100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {activity.score}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Пока нет активности</p>
          )}
        </div>
      </div>
    </div>
  );
}
