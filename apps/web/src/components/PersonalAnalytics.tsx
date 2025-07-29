'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Award, 
  Brain,
  BookOpen,
  Activity,
  ChevronRight,
  Star,
  Calendar,
  BarChart3
} from 'lucide-react';

interface UserStats {
  total_tasks: number;
  correct_tasks: number;
  accuracy_rate: number;
  average_time_per_task: number;
  study_days: number;
  current_streak: number;
  total_study_time: number;
  favorite_topics: Array<{
    topic: string;
    count: number;
  }>;
  weekly_progress: Array<{
    date: string;
    tasks: number;
    correct: number;
  }>;
  difficulty_distribution: Record<string, number>;
  weak_topics: Array<{
    topic: string;
    accuracy: number;
    total_attempts: number;
  }>;
  level_info: {
    current_level: number;
    experience_points: number;
    next_level_threshold: number;
  };
}

interface Recommendation {
  recommendation_id: string;
  recommendation_type: string;
  title: string;
  description: string;
  action_text: string;
  priority_score: number;
  confidence_score: number;
  reasoning: string;
  related_topics: string[];
  status: string;
}

interface PersonalAnalyticsProps {
  className?: string;
}

export default function PersonalAnalytics({ className = '' }: PersonalAnalyticsProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingRecs, setGeneratingRecs] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    // Debounce для предотвращения множественных запросов
    const timer = setTimeout(() => {
      loadAnalytics();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics', {
        // Кэширование на клиенте
        headers: {
          'Cache-Control': 'max-age=60'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();
      setStats(data.stats);
      setRecommendations(data.recommendations);
      
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Не удалось загрузить аналитику');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    setGeneratingRecs(true);
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_regenerate: true })
      });

      if (response.ok) {
        await loadAnalytics(); // Перезагружаем данные
      }
    } catch (err) {
      console.error('Error generating recommendations:', err);
    } finally {
      setGeneratingRecs(false);
    }
  };

  const handleRecommendationAction = async (recId: string) => {
    try {
      await fetch('/api/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation_id: recId,
          status: 'accepted',
          action: 'acted'
        })
      });
      
      // Обновляем список рекомендаций
      setRecommendations(prev => 
        prev.filter(rec => rec.recommendation_id !== recId)
      );
    } catch (err) {
      console.error('Error updating recommendation:', err);
    }
  };

  const dismissRecommendation = async (recId: string) => {
    try {
      await fetch('/api/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation_id: recId,
          status: 'dismissed'
        })
      });
      
      setRecommendations(prev => 
        prev.filter(rec => rec.recommendation_id !== recId)
      );
    } catch (err) {
      console.error('Error dismissing recommendation:', err);
    }
  };

  if (loading) {
    return (
      <div className={`${className} p-6`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} p-6`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={loadAnalytics}
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const accuracyPercentage = Math.round(stats.accuracy_rate * 100);
  const progressToNextLevel = (stats.level_info.experience_points / stats.level_info.next_level_threshold) * 100;

  return (
    <div className={`${className} space-y-6`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Личная аналитика</h2>
        <button
          onClick={generateRecommendations}
          disabled={generatingRecs}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {generatingRecs ? 'Генерация...' : 'Обновить рекомендации'}
        </button>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {accuracyPercentage}%
              </div>
              <div className="text-sm text-gray-600">Точность</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.correct_tasks} из {stats.total_tasks} задач
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.current_streak}
              </div>
              <div className="text-sm text-gray-600">Дней подряд</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Всего дней: {stats.study_days}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(stats.average_time_per_task)}с
              </div>
              <div className="text-sm text-gray-600">Среднее время</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Всего: {Math.floor(stats.total_study_time / 3600)}ч
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <Award className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.level_info.current_level}
              </div>
              <div className="text-sm text-gray-600">Уровень</div>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressToNextLevel, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.level_info.experience_points} / {stats.level_info.next_level_threshold} XP
            </div>
          </div>
        </div>
      </div>

      {/* Рекомендации ИИ */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <Brain className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Персональные рекомендации
            </h3>
          </div>
          
          <div className="space-y-4">
            {recommendations.slice(0, 3).map((rec) => (
              <div key={rec.recommendation_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <div className="ml-2 flex items-center">
                        {[...Array(Math.round(rec.confidence_score * 5))].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-xs text-gray-500">{rec.reasoning}</p>
                    
                    {rec.related_topics.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {rec.related_topics.map((topic, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => handleRecommendationAction(rec.recommendation_id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      {rec.action_text}
                    </button>
                    <button
                      onClick={() => dismissRecommendation(rec.recommendation_id)}
                      className="px-2 py-1 text-gray-400 hover:text-gray-600 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Слабые темы */}
      {stats.weak_topics.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <TrendingDown className="w-6 h-6 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Темы для улучшения
            </h3>
          </div>
          
          <div className="space-y-3">
            {stats.weak_topics.map((topic, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{topic.topic}</div>
                  <div className="text-sm text-gray-600">
                    {topic.total_attempts} попыток
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-red-600">
                    {Math.round(topic.accuracy * 100)}%
                  </div>
                  <div className="text-xs text-gray-500">точность</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Любимые темы */}
      {stats.favorite_topics.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Любимые темы
            </h3>
          </div>
          
          <div className="space-y-3">
            {stats.favorite_topics.map((topic, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-gray-900">{topic.topic}</div>
                <div className="text-green-600 font-semibold">
                  {topic.count} задач
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Недельный прогресс */}
      {stats.weekly_progress.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Прогресс за неделю
            </h3>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {stats.weekly_progress.map((day, i) => {
              const date = new Date(day.date);
              const accuracy = day.tasks > 0 ? (day.correct / day.tasks) * 100 : 0;
              
              return (
                <div key={i} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">
                    {date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                  </div>
                  <div 
                    className={`h-16 rounded flex flex-col justify-end p-1 ${
                      day.tasks > 0 ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                    style={{ 
                      opacity: day.tasks > 0 ? Math.max(0.3, accuracy / 100) : 0.3 
                    }}
                  >
                    <div className="text-xs text-white font-semibold">
                      {day.tasks > 0 ? day.tasks : ''}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {day.tasks > 0 ? `${Math.round(accuracy)}%` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}