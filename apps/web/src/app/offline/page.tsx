'use client';

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Book, TrendingUp, Home, Calendar, Trophy, Search, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface CachedTask {
  id: string;
  title: string;
  subject: string;
  difficulty: number;
  completed?: boolean;
}

interface OfflineStats {
  tasksCompleted: number;
  studyTime: number;
  streak: number;
  lastStudyDate: string;
}

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [cachedTasks, setCachedTasks] = useState<CachedTask[]>([]);
  const [offlineStats, setOfflineStats] = useState<OfflineStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Проверяем статус подключения
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Загружаем кэшированные данные
    const loadOfflineData = () => {
      try {
        // Загружаем задачи из localStorage
        const tasksData = localStorage.getItem('cached_tasks');
        if (tasksData) {
          setCachedTasks(JSON.parse(tasksData));
        }

        // Загружаем статистику
        const statsData = localStorage.getItem('offline_stats');
        if (statsData) {
          setOfflineStats(JSON.parse(statsData));
        } else {
          // Создаем базовую статистику если её нет
          const defaultStats: OfflineStats = {
            tasksCompleted: 0,
            studyTime: 0,
            streak: 0,
            lastStudyDate: new Date().toISOString()
          };
          setOfflineStats(defaultStats);
          localStorage.setItem('offline_stats', JSON.stringify(defaultStats));
        }
      } catch (error) {
        console.error('Error loading offline data:', error);
      }
    };

    updateOnlineStatus();
    loadOfflineData();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleRefresh = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  const markTaskCompleted = (taskId: string) => {
    const updatedTasks = cachedTasks.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    );
    setCachedTasks(updatedTasks);
    localStorage.setItem('cached_tasks', JSON.stringify(updatedTasks));

    // Обновляем статистику
    if (offlineStats) {
      const newStats = {
        ...offlineStats,
        tasksCompleted: offlineStats.tasksCompleted + 1,
        studyTime: offlineStats.studyTime + 30, // Предполагаем 30 минут на задачу
        lastStudyDate: new Date().toISOString()
      };
      setOfflineStats(newStats);
      localStorage.setItem('offline_stats', JSON.stringify(newStats));
    }
  };

  const filteredTasks = cachedTasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                AcademGrad
              </Link>
              <div className="ml-3 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded-full">
                Офлайн
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isOnline 
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span>{isOnline ? 'Онлайн' : 'Офлайн'}</span>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={!isOnline}
                className={`p-2 rounded-lg transition-colors ${
                  isOnline
                    ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900'
                    : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
                title="Обновить"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Connection Status */}
        <div className="mb-8 text-center">
          <div className="mx-auto w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Вы работаете офлайн
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {isOnline 
              ? 'Подключение восстановлено! Нажмите "Обновить" для возврата к полной версии.'
              : 'Проверьте подключение к интернету. Вы можете продолжить работу с сохраненными данными.'
            }
          </p>

          {isOnline && (
            <button
              onClick={handleRefresh}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Вернуться к сайту
            </button>
          )}
        </div>

        {/* Quick Navigation */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Быстрая навигация
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Home, label: 'Главная', href: '/' },
              { icon: Book, label: 'Задачи', href: '/tasks' },
              { icon: Calendar, label: 'Расписание', href: '/schedule' },
              { icon: Trophy, label: 'Достижения', href: '/achievements' }
            ].map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-center group"
                >
                  <IconComponent className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Offline Statistics */}
        {offlineStats && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Статистика обучения
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {offlineStats.tasksCompleted}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Задач решено
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.floor(offlineStats.studyTime / 60)}ч
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Время изучения
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {offlineStats.streak}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Дней подряд
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cached Tasks */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Сохраненные задачи ({cachedTasks.length})
            </h2>
            
            {cachedTasks.length > 0 && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск задач..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {filteredTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    task.completed
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium mb-1 ${
                        task.completed 
                          ? 'text-green-800 dark:text-green-300 line-through' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {task.title}
                      </h3>
                      
                      <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                        <span>{task.subject}</span>
                        <span>•</span>
                        <span>Сложность: {task.difficulty}/5</span>
                      </div>
                    </div>

                    {!task.completed && (
                      <button
                        onClick={() => markTaskCompleted(task.id)}
                        className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Решено
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Book className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Нет сохраненных задач
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {searchQuery 
                  ? 'По вашему запросу ничего не найдено'
                  : 'Подключитесь к интернету, чтобы загрузить задачи для офлайн-работы'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Сбросить поиск
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-300 mb-3">
            Советы для работы офлайн
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <li>• Проверьте Wi-Fi соединение или мобильные данные</li>
            <li>• Некоторые функции сохраняются локально и работают без интернета</li>
            <li>• Ваш прогресс будет синхронизирован при восстановлении связи</li>
            <li>• Решенные офлайн задачи засчитаются в общую статистику</li>
          </ul>
        </div>
      </div>
    </div>
  );
}