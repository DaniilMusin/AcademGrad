'use client';

import { useState, useEffect, useCallback } from 'react';

interface OfflineTask {
  id: string;
  title: string;
  subject: string;
  difficulty: number;
  content?: string;
  completed?: boolean;
  cachedAt: string;
}

interface OfflineStats {
  tasksCompleted: number;
  studyTime: number;
  streak: number;
  lastStudyDate: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  level: number;
  experience: number;
}

export function useOfflineData() {
  const [isOnline, setIsOnline] = useState(true);
  const [cachedTasks, setCachedTasks] = useState<OfflineTask[]>([]);
  const [offlineStats, setOfflineStats] = useState<OfflineStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Проверка онлайн статуса
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Загрузка кэшированных данных
  const loadOfflineData = useCallback(() => {
    try {
      // Загружаем задачи
      const tasksData = localStorage.getItem('cached_tasks');
      if (tasksData) {
        setCachedTasks(JSON.parse(tasksData));
      }

      // Загружаем статистику
      const statsData = localStorage.getItem('offline_stats');
      if (statsData) {
        setOfflineStats(JSON.parse(statsData));
      } else {
        const defaultStats: OfflineStats = {
          tasksCompleted: 0,
          studyTime: 0,
          streak: 0,
          lastStudyDate: new Date().toISOString()
        };
        setOfflineStats(defaultStats);
        localStorage.setItem('offline_stats', JSON.stringify(defaultStats));
      }

      // Загружаем профиль пользователя
      const profileData = localStorage.getItem('user_profile');
      if (profileData) {
        setUserProfile(JSON.parse(profileData));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, []);

  // Сохранение задач для офлайн использования
  const cacheTask = useCallback((task: Omit<OfflineTask, 'cachedAt'>) => {
    const taskWithTimestamp: OfflineTask = {
      ...task,
      cachedAt: new Date().toISOString()
    };

    setCachedTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      if (exists) {
        return prev.map(t => t.id === task.id ? taskWithTimestamp : t);
      }
      return [...prev, taskWithTimestamp];
    });

    // Сохраняем в localStorage
    const updatedTasks = cachedTasks.some(t => t.id === task.id)
      ? cachedTasks.map(t => t.id === task.id ? taskWithTimestamp : t)
      : [...cachedTasks, taskWithTimestamp];
    
    localStorage.setItem('cached_tasks', JSON.stringify(updatedTasks));
  }, [cachedTasks]);

  // Пометка задачи как выполненной
  const markTaskCompleted = useCallback((taskId: string) => {
    setCachedTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, completed: true } : task
      )
    );

    // Обновляем статистику
    if (offlineStats) {
      const newStats: OfflineStats = {
        ...offlineStats,
        tasksCompleted: offlineStats.tasksCompleted + 1,
        studyTime: offlineStats.studyTime + 30, // 30 минут за задачу
        lastStudyDate: new Date().toISOString()
      };
      setOfflineStats(newStats);
      localStorage.setItem('offline_stats', JSON.stringify(newStats));
    }

    // Сохраняем обновленные задачи
    const updatedTasks = cachedTasks.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    );
    localStorage.setItem('cached_tasks', JSON.stringify(updatedTasks));
  }, [cachedTasks, offlineStats]);

  // Сохранение профиля пользователя
  const cacheUserProfile = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('user_profile', JSON.stringify(profile));
  }, []);

  // Очистка кэша
  const clearCache = useCallback(() => {
    setCachedTasks([]);
    setOfflineStats(null);
    setUserProfile(null);
    localStorage.removeItem('cached_tasks');
    localStorage.removeItem('offline_stats');
    localStorage.removeItem('user_profile');
  }, []);

  // Получение статистики кэша
  const getCacheStats = useCallback(() => {
    const totalTasks = cachedTasks.length;
    const completedTasks = cachedTasks.filter(t => t.completed).length;
    const cacheSize = JSON.stringify({ cachedTasks, offlineStats, userProfile }).length;
    const oldestTask = cachedTasks.length > 0 
      ? Math.min(...cachedTasks.map(t => new Date(t.cachedAt).getTime()))
      : null;

    return {
      totalTasks,
      completedTasks,
      cacheSize: Math.round(cacheSize / 1024), // в KB
      oldestCacheDate: oldestTask ? new Date(oldestTask) : null
    };
  }, [cachedTasks, offlineStats, userProfile]);

  // Синхронизация с сервером при восстановлении соединения
  const syncWithServer = useCallback(async () => {
    if (!isOnline) return false;

    try {
      // Здесь должна быть логика синхронизации с сервером
      // Например, отправка завершенных задач, обновление статистики и т.д.
      
      const completedTasks = cachedTasks.filter(t => t.completed);
      if (completedTasks.length > 0) {
        // Отправляем завершенные задачи на сервер
        console.log('Syncing completed tasks:', completedTasks);
        // await api.syncCompletedTasks(completedTasks);
      }

      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    }
  }, [isOnline, cachedTasks]);

  // Загрузка данных при инициализации
  useEffect(() => {
    loadOfflineData();
  }, [loadOfflineData]);

  // Автоматическая синхронизация при восстановлении соединения
  useEffect(() => {
    if (isOnline) {
      syncWithServer();
    }
  }, [isOnline, syncWithServer]);

  return {
    isOnline,
    cachedTasks,
    offlineStats,
    userProfile,
    cacheTask,
    markTaskCompleted,
    cacheUserProfile,
    clearCache,
    getCacheStats,
    syncWithServer,
    loadOfflineData
  };
}