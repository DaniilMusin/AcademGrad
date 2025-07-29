'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

interface AnalyticsData {
  performanceByTopic: { [topic: string]: { correct: number; total: number } };
  progressOverTime: { date: string; correct: number; total: number }[];
  difficultyBreakdown: { [difficulty: string]: { correct: number; total: number } };
  weeklyActivity: number[];
  badges: any[];
  timeSpent: number;
  strongTopics: string[];
  weakTopics: string[];
}

// Легкий компонент графика без библиотек
const SimpleBarChart = memo(({ data, label }: { data: { label: string; value: number; color?: string }[]; label: string }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="h-64 p-4">
      <p className="text-sm text-gray-600 mb-4">{label}</p>
      <div className="flex items-end justify-center h-48 space-x-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className={`${item.color || 'bg-blue-500'} rounded-t transition-all duration-500 min-h-1 w-full`}
              style={{ height: `${(item.value / maxValue) * 100}%` }}
              title={`${item.label}: ${item.value}`}
            ></div>
            <span className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left">
              {item.label.length > 8 ? item.label.substring(0, 8) + '...' : item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
SimpleBarChart.displayName = 'SimpleBarChart';

const SimpleLineChart = memo(({ data, labels }: { data: { label: string; values: number[]; color: string }[]; labels: string[] }) => {
  const maxValue = Math.max(...data.flatMap(d => d.values), 1);
  const width = 400;
  const height = 200;
  
  return (
    <div className="h-64 p-4">
      <div className="relative bg-gray-50 rounded" style={{ width, height }}>
        <svg width={width} height={height} className="absolute inset-0">
          {data.map((series, seriesIndex) => {
            const points = series.values.map((value, index) => ({
              x: (index / (labels.length - 1)) * width,
              y: height - (value / maxValue) * height
            }));
            
            const pathData = points.reduce((path, point, index) => {
              return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
            }, '');
            
            return (
              <g key={seriesIndex}>
                <path
                  d={pathData}
                  stroke={series.color}
                  strokeWidth="2"
                  fill="none"
                />
                {points.map((point, index) => (
                  <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill={series.color}
                  />
                ))}
              </g>
            );
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600 px-2">
          {labels.slice(0, 5).map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
      </div>
      <div className="flex space-x-4 mt-2">
        {data.map((series, index) => (
          <div key={index} className="flex items-center text-xs">
            <div className="w-3 h-3 rounded mr-1" style={{ backgroundColor: series.color }}></div>
            {series.label}
          </div>
        ))}
      </div>
    </div>
  );
});
SimpleLineChart.displayName = 'SimpleLineChart';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    performanceByTopic: {},
    progressOverTime: [],
    difficultyBreakdown: {},
    weeklyActivity: [],
    badges: [],
    timeSpent: 0,
    strongTopics: [],
    weakTopics: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  const loadAnalytics = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Необходимо войти в систему");
        return;
      }

      // Определяем временной диапазон
      const now = new Date();
      let dateFilter = '';
      if (timeRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = weekAgo.toISOString();
      } else if (timeRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = monthAgo.toISOString();
      }

      // Загружаем попытки решения задач (оптимизированно)
      let query = supabase
        .from('task_attempts')
        .select('task_number, is_correct, difficulty, created_at, time_spent')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(500); // Ограничиваем для производительности
      
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const [{ data: attempts }, { data: badges }] = await Promise.all([
        query,
        supabase
          .from('user_badges')
          .select('id, name')
          .eq('user_id', user.id)
          .limit(20)
      ]);

      if (attempts) {
        const processedAnalytics = processAnalyticsData(attempts, badges || []);
        setAnalytics(processedAnalytics);
      }

    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const processAnalyticsData = (attempts: any[], badges: any[]): AnalyticsData => {
    // Группируем по темам
    const topicStats: { [topic: string]: { correct: number; total: number } } = {};
    attempts.forEach(attempt => {
      const topic = `Задание ${attempt.task_number}`;
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      topicStats[topic].total++;
      if (attempt.is_correct) {
        topicStats[topic].correct++;
      }
    });

    // Прогресс по времени (упрощенно)
    const progressByDate: { [date: string]: { correct: number; total: number } } = {};
    attempts.forEach(attempt => {
      const date = new Date(attempt.created_at).toDateString();
      if (!progressByDate[date]) {
        progressByDate[date] = { correct: 0, total: 0 };
      }
      progressByDate[date].total++;
      if (attempt.is_correct) {
        progressByDate[date].correct++;
      }
    });

    const progressOverTime = Object.entries(progressByDate).map(([date, stats]) => ({
      date,
      ...stats
    }));

    // Анализ по сложности
    const difficultyStats: { [difficulty: string]: { correct: number; total: number } } = {};
    attempts.forEach(attempt => {
      const diff = attempt.difficulty.toString();
      if (!difficultyStats[diff]) {
        difficultyStats[diff] = { correct: 0, total: 0 };
      }
      difficultyStats[diff].total++;
      if (attempt.is_correct) {
        difficultyStats[diff].correct++;
      }
    });

    // Недельная активность
    const weeklyActivity = Array(7).fill(0);
    const today = new Date();
    attempts.forEach(attempt => {
      const attemptDate = new Date(attempt.created_at);
      const dayDiff = Math.floor((today.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff < 7 && dayDiff >= 0) {
        weeklyActivity[6 - dayDiff]++;
      }
    });

    // Сильные и слабые темы
    const topicPerformance = Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
      total: stats.total
    }));

    const strongTopics = topicPerformance
      .filter(t => t.accuracy >= 0.8 && t.total >= 5)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5)
      .map(t => t.topic);

    const weakTopics = topicPerformance
      .filter(t => t.accuracy < 0.6 && t.total >= 3)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5)
      .map(t => t.topic);

    const timeSpent = attempts.reduce((sum, attempt) => sum + (attempt.time_spent || 180), 0);

    return {
      performanceByTopic: topicStats,
      progressOverTime,
      difficultyBreakdown: difficultyStats,
      weeklyActivity,
      badges,
      timeSpent,
      strongTopics,
      weakTopics
    };
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
          <h2 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const totalAttempts = Object.values(analytics.performanceByTopic).reduce((sum, stats) => sum + stats.total, 0);
  const totalCorrect = Object.values(analytics.performanceByTopic).reduce((sum, stats) => sum + stats.correct, 0);
  const overallAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

  // Данные для графиков
  const topicChartData = Object.entries(analytics.performanceByTopic)
    .slice(0, 8)
    .map(([topic, stats]) => ({
      label: topic.replace('Задание ', ''),
      value: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      color: 'bg-blue-500'
    }));

  const difficultyChartData = Object.entries(analytics.difficultyBreakdown)
    .map(([difficulty, stats]) => ({
      label: `Уровень ${difficulty}`,
      value: Math.round((stats.correct / stats.total) * 100),
      color: 'bg-green-500'
    }));

  const progressChartData = {
    data: [
      {
        label: 'Правильные ответы',
        values: analytics.progressOverTime.slice(-10).map(item => item.correct),
        color: '#22c55e'
      },
      {
        label: 'Всего попыток',
        values: analytics.progressOverTime.slice(-10).map(item => item.total),
        color: '#3b82f6'
      }
    ],
    labels: analytics.progressOverTime.slice(-10).map(item => 
      new Date(item.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
    )
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Аналитика</h1>
              <p className="text-gray-600">Детальный анализ вашего прогресса</p>
            </div>
            
            <div className="flex space-x-2">
              {(['week', 'month', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {range === 'week' ? 'Неделя' : range === 'month' ? 'Месяц' : 'Все время'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Основные метрики */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Общая точность</p>
                <p className="text-2xl font-bold text-gray-900">{overallAccuracy.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Всего решено</p>
                <p className="text-2xl font-bold text-gray-900">{totalCorrect}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Времени потрачено</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(analytics.timeSpent / 60)}ч</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Бейджи</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.badges.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Графики */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Прогресс по времени</h2>
            {analytics.progressOverTime.length > 0 ? (
              <SimpleLineChart data={progressChartData.data} labels={progressChartData.labels} />
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">Недостаточно данных</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Точность по заданиям</h2>
            {topicChartData.length > 0 ? (
              <SimpleBarChart data={topicChartData} label="Процент правильных ответов" />
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">Недостаточно данных</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">По уровню сложности</h2>
            {difficultyChartData.length > 0 ? (
              <SimpleBarChart data={difficultyChartData} label="Процент успеха" />
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-500">Недостаточно данных</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Сильные темы</h2>
            {analytics.strongTopics.length > 0 ? (
              <div className="space-y-2">
                {analytics.strongTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium text-green-800">{topic}</span>
                    <span className="text-xs text-green-600">
                      {(analytics.performanceByTopic[topic].correct / analytics.performanceByTopic[topic].total * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Решите больше задач</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Требуют улучшения</h2>
            {analytics.weakTopics.length > 0 ? (
              <div className="space-y-2">
                {analytics.weakTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm font-medium text-red-800">{topic}</span>
                    <span className="text-xs text-red-600">
                      {(analytics.performanceByTopic[topic].correct / analytics.performanceByTopic[topic].total * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Отличная работа!</p>
            )}
          </div>
        </div>

        {/* Недельная активность */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Активность за неделю</h2>
          <div className="flex space-x-2">
            {analytics.weeklyActivity.map((count, index) => {
              const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
              const intensity = Math.min(count / 10, 1);
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded border border-gray-200"
                    style={{
                      backgroundColor: `rgba(34, 197, 94, ${intensity})`
                    }}
                    title={`${dayNames[index]}: ${count} задач`}
                  ></div>
                  <span className="text-xs text-gray-600 mt-1">{dayNames[index]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}