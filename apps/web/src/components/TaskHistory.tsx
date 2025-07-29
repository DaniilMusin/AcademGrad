'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  TrendingUp,
  Award,
  Eye,
  HelpCircle,
  Activity
} from 'lucide-react';

interface TaskAttempt {
  attempt_id: string;
  task_number: number;
  topic_name: string;
  subtopic_name?: string;
  difficulty_level: number;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
  hints_used: number;
  solution_viewed: boolean;
  attempts_count: number;
  mistake_type?: string;
  confidence_level?: number;
  created_at: string;
}

interface TaskHistoryProps {
  className?: string;
  limit?: number;
  showFilters?: boolean;
}

export default function TaskHistory({ 
  className = '', 
  limit = 50, 
  showFilters = true 
}: TaskHistoryProps) {
  const [attempts, setAttempts] = useState<TaskAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    topic: '',
    difficulty: '',
    correctness: '', // 'correct', 'incorrect', ''
    dateRange: '7' // дни: '7', '30', '90', 'all'
  });

  const supabase = createClient();

  useEffect(() => {
    // Debounce для фильтров
    const timer = setTimeout(() => {
      loadTaskHistory();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [loadTaskHistory]);

  const loadTaskHistory = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('task_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Применяем фильтры
      if (filters.topic) {
        query = query.ilike('topic_name', `%${filters.topic}%`);
      }
      
      if (filters.difficulty) {
        query = query.eq('difficulty_level', parseInt(filters.difficulty));
      }
      
      if (filters.correctness === 'correct') {
        query = query.eq('is_correct', true);
      } else if (filters.correctness === 'incorrect') {
        query = query.eq('is_correct', false);
      }
      
      if (filters.dateRange !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(filters.dateRange));
        query = query.gte('created_at', daysAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setAttempts(data || []);
    } catch (err) {
      console.error('Error loading task history:', err);
      setError('Не удалось загрузить историю решений');
    } finally {
      setLoading(false);
    }
  }, [filters, limit, supabase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTaskHistory();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [loadTaskHistory]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}с`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}м ${remainingSeconds}с`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Вчера';
    if (diffDays <= 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getDifficultyColor = (level: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800', 
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || colors[3];
  };

  const getDifficultyLabel = (level: number) => {
    const labels = {
      1: 'Легкая',
      2: 'Простая',
      3: 'Средняя', 
      4: 'Сложная',
      5: 'Очень сложная'
    };
    return labels[level as keyof typeof labels] || 'Средняя';
  };

  if (loading) {
    return (
      <div className={`${className} p-6`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
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
            onClick={loadTaskHistory}
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">История решений</h2>
        <div className="flex items-center text-sm text-gray-500">
          <Activity className="w-4 h-4 mr-1" />
          {attempts.length} попыток
        </div>
      </div>

      {/* Фильтры */}
      {showFilters && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тема
              </label>
              <input
                type="text"
                value={filters.topic}
                onChange={(e) => setFilters(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="Поиск по теме..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сложность
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Все уровни</option>
                <option value="1">Легкая (1)</option>
                <option value="2">Простая (2)</option>
                <option value="3">Средняя (3)</option>
                <option value="4">Сложная (4)</option>
                <option value="5">Очень сложная (5)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Результат
              </label>
              <select
                value={filters.correctness}
                onChange={(e) => setFilters(prev => ({ ...prev, correctness: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Все результаты</option>
                <option value="correct">Правильные</option>
                <option value="incorrect">Неправильные</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Период
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="7">За неделю</option>
                <option value="30">За месяц</option>
                <option value="90">За 3 месяца</option>
                <option value="all">За все время</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Список попыток */}
      <div className="space-y-3">
        {attempts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Пока нет решений
            </h3>
            <p className="text-gray-500">
              Начните решать задачи, чтобы увидеть историю здесь
            </p>
          </div>
        ) : (
          attempts.map((attempt) => (
            <div 
              key={attempt.attempt_id}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Результат */}
                    {attempt.is_correct ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    
                    {/* Номер задачи */}
                    <span className="font-semibold text-gray-900">
                      №{attempt.task_number}
                    </span>
                    
                    {/* Тема */}
                    <span className="text-gray-600">
                      {attempt.topic_name}
                      {attempt.subtopic_name && (
                        <span className="text-gray-400"> • {attempt.subtopic_name}</span>
                      )}
                    </span>
                    
                    {/* Сложность */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(attempt.difficulty_level)}`}>
                      {getDifficultyLabel(attempt.difficulty_level)}
                    </span>
                  </div>
                  
                  {/* Детали */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatTime(attempt.time_spent_seconds)}
                    </div>
                    
                    {attempt.hints_used > 0 && (
                      <div className="flex items-center">
                        <HelpCircle className="w-4 h-4 mr-1" />
                        {attempt.hints_used} подсказок
                      </div>
                    )}
                    
                    {attempt.solution_viewed && (
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        Решение просмотрено
                      </div>
                    )}
                    
                    {attempt.attempts_count > 1 && (
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {attempt.attempts_count} попыток
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(attempt.created_at)}
                    </div>
                  </div>
                  
                  {/* Ответы */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Ваш ответ: </span>
                      <span className={attempt.is_correct ? 'text-green-600' : 'text-red-600'}>
                        {attempt.user_answer}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Правильный ответ: </span>
                      <span className="text-green-600">
                        {attempt.correct_answer}
                      </span>
                    </div>
                  </div>
                  
                  {/* Тип ошибки */}
                  {!attempt.is_correct && attempt.mistake_type && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium text-gray-700">Тип ошибки: </span>
                      <span className="text-orange-600">{attempt.mistake_type}</span>
                    </div>
                  )}
                </div>
                
                {/* Уровень уверенности */}
                {attempt.confidence_level && (
                  <div className="ml-4 text-center">
                    <div className="text-xs text-gray-500 mb-1">Уверенность</div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Award 
                          key={i} 
                          className={`w-3 h-3 ${
                            i < attempt.confidence_level! 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Загрузить больше */}
      {attempts.length === limit && (
        <div className="text-center">
          <button
            onClick={() => loadTaskHistory()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Загрузить больше
          </button>
        </div>
      )}
    </div>
  );
}