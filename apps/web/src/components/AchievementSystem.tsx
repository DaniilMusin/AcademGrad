'use client';

import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Trophy, Star, Zap, Target, Calendar, BookOpen } from 'lucide-react';

const supabase = createClient();

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'streak' | 'tasks' | 'accuracy' | 'topic' | 'speed' | 'consistency';
  requirement: number;
  is_unlocked: boolean;
  unlocked_at?: string;
  progress: number;
  max_progress: number;
}

interface UserLevel {
  current_level: number;
  current_xp: number;
  xp_to_next: number;
  level_name: string;
}

const achievementTemplates = [
  {
    id: 'first_solve',
    name: 'Первые шаги',
    description: 'Решите первую задачу',
    icon: '🎯',
    type: 'tasks',
    requirement: 1
  },
  {
    id: 'streak_3',
    name: 'На волне',
    description: 'Решайте задачи 3 дня подряд',
    icon: '🔥',
    type: 'streak',
    requirement: 3
  },
  {
    id: 'streak_7',
    name: 'Неделя успеха',
    description: 'Решайте задачи 7 дней подряд',
    icon: '⚡',
    type: 'streak',
    requirement: 7
  },
  {
    id: 'tasks_10',
    name: 'Десяточка',
    description: 'Решите 10 задач',
    icon: '📚',
    type: 'tasks',
    requirement: 10
  },
  {
    id: 'tasks_50',
    name: 'Полсотни',
    description: 'Решите 50 задач',
    icon: '💪',
    type: 'tasks',
    requirement: 50
  },
  {
    id: 'tasks_100',
    name: 'Сотня',
    description: 'Решите 100 задач',
    icon: '🏆',
    type: 'tasks',
    requirement: 100
  },
  {
    id: 'accuracy_80',
    name: 'Снайпер',
    description: 'Достигните 80% точности (минимум 20 задач)',
    icon: '🎯',
    type: 'accuracy',
    requirement: 80
  },
  {
    id: 'accuracy_90',
    name: 'Мастер',
    description: 'Достигните 90% точности (минимум 50 задач)',
    icon: '⭐',
    type: 'accuracy',
    requirement: 90
  },
  {
    id: 'topic_master',
    name: 'Эксперт темы',
    description: 'Достигните 95% точности в любой теме (минимум 10 задач)',
    icon: '🧠',
    type: 'topic',
    requirement: 95
  },
  {
    id: 'consistency_30',
    name: 'Постоянство',
    description: 'Решайте задачи 30 дней подряд',
    icon: '📅',
    type: 'consistency',
    requirement: 30
  }
];

const levelNames = [
  'Новичок', 'Ученик', 'Практикант', 'Знаток', 'Эксперт',
  'Мастер', 'Гуру', 'Легенда', 'Чемпион', 'Гений'
];

export default function AchievementSystem() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userLevel, setUserLevel] = useState<UserLevel>({
    current_level: 1,
    current_xp: 0,
    xp_to_next: 100,
    level_name: 'Новичок'
  });
  const [loading, setLoading] = useState(true);
  const [showUnlocked, setShowUnlocked] = useState<string | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Загружаем статистику пользователя
      const { data: attempts } = await supabase
        .from('task_attempts')
        .select('*')
        .eq('user_id', user.id);

      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Вычисляем прогресс достижений
      const processedAchievements = calculateAchievementProgress(
        attempts || [],
        userAchievements || []
      );

      // Вычисляем уровень пользователя
      const totalXP = attempts?.reduce((sum: number, attempt: any) => 
        sum + (attempt.is_correct ? 10 * attempt.difficulty : 0), 0) || 0;
      
      const level = calculateUserLevel(totalXP);

      setAchievements(processedAchievements);
      setUserLevel(level);

      // Проверяем новые достижения
      checkNewAchievements(processedAchievements, userAchievements || []);

    } catch (err) {
      console.error('Error loading achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAchievementProgress = (attempts: any[], userAchievements: any[]): Achievement[] => {
    const solvedTasks = attempts.filter(a => a.is_correct).length;
    const totalTasks = attempts.length;
    const accuracy = totalTasks > 0 ? (solvedTasks / totalTasks) * 100 : 0;
    
    // Рассчитываем серию (упрощенная версия)
    const currentStreak = calculateStreak(attempts);

    // Анализ по темам
    const topicStats: { [topic: string]: { correct: number; total: number } } = {};
    attempts.forEach(attempt => {
      const topic = attempt.task_number.toString();
      if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
      topicStats[topic].total++;
      if (attempt.is_correct) topicStats[topic].correct++;
    });

    const bestTopicAccuracy = Math.max(
      ...Object.values(topicStats)
        .filter(stats => stats.total >= 10)
        .map(stats => (stats.correct / stats.total) * 100),
      0
    );

    return achievementTemplates.map(template => {
      const userAchievement = userAchievements.find(ua => ua.achievement_id === template.id);
      let progress = 0;
      let maxProgress = template.requirement;

      switch (template.type) {
        case 'tasks':
          progress = solvedTasks;
          break;
        case 'streak':
          progress = currentStreak;
          break;
        case 'accuracy':
          progress = totalTasks >= 20 ? accuracy : 0;
          maxProgress = template.requirement;
          break;
        case 'topic':
          progress = bestTopicAccuracy;
          break;
        case 'consistency':
          progress = currentStreak; // Упрощение
          break;
      }

      return {
        ...template,
        progress: Math.min(progress, maxProgress),
        max_progress: maxProgress,
        is_unlocked: !!userAchievement,
        unlocked_at: userAchievement?.unlocked_at
      } as Achievement;
    });
  };

  const calculateStreak = (attempts: any[]): number => {
    if (!attempts.length) return 0;
    
    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);
    
    const attemptsByDate = attempts.reduce((acc, attempt) => {
      const date = new Date(attempt.created_at).toDateString();
      if (!acc[date]) acc[date] = { hasCorrect: false };
      if (attempt.is_correct) acc[date].hasCorrect = true;
      return acc;
    }, {});

    while (currentDate >= new Date(attempts[attempts.length - 1]?.created_at || today)) {
      const dateStr = currentDate.toDateString();
      if (attemptsByDate[dateStr]?.hasCorrect) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const calculateUserLevel = (totalXP: number): UserLevel => {
    const xpPerLevel = 100;
    const levelMultiplier = 1.2;
    
    let level = 1;
    let xpForCurrentLevel = 0;
    let xpForNextLevel = xpPerLevel;
    
    while (totalXP >= xpForNextLevel) {
      level++;
      xpForCurrentLevel = xpForNextLevel;
      xpForNextLevel = Math.floor(xpForNextLevel * levelMultiplier);
    }

    const currentXP = totalXP - xpForCurrentLevel;
    const xpToNext = xpForNextLevel - xpForCurrentLevel;
    const levelIndex = Math.min(level - 1, levelNames.length - 1);

    return {
      current_level: level,
      current_xp: currentXP,
      xp_to_next: xpToNext,
      level_name: levelNames[levelIndex]
    };
  };

  const checkNewAchievements = async (achievements: Achievement[], existingAchievements: any[]) => {
    const newAchievements = achievements.filter(achievement => 
      achievement.progress >= achievement.max_progress && 
      !achievement.is_unlocked
    );

    for (const achievement of newAchievements) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) continue;

        // Сохраняем достижение в базу
        await supabase.from('user_achievements').insert({
          user_id: user.id,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString()
        });

        // Создаем уведомление
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: 'Новое достижение!',
          message: `Вы получили достижение "${achievement.name}": ${achievement.description}`,
          type: 'success'
        });

        // Показываем анимацию
        setShowUnlocked(achievement.id);
        setTimeout(() => setShowUnlocked(null), 3000);

      } catch (err) {
        console.error('Error saving achievement:', err);
      }
    }
  };

  const getProgressPercentage = (achievement: Achievement) => {
    return Math.min((achievement.progress / achievement.max_progress) * 100, 100);
  };

  const getLevelProgress = () => {
    return (userLevel.current_xp / userLevel.xp_to_next) * 100;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Уровень пользователя */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Уровень {userLevel.current_level}</h2>
            <p className="text-purple-100">{userLevel.level_name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-purple-100">XP</p>
            <p className="text-xl font-bold">
              {userLevel.current_xp} / {userLevel.xp_to_next}
            </p>
          </div>
        </div>
        
        <div className="w-full bg-purple-400 rounded-full h-3">
          <div
            className="bg-white h-3 rounded-full transition-all duration-500"
            style={{ width: `${getLevelProgress()}%` }}
          ></div>
        </div>
      </div>

      {/* Достижения */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Достижения</h3>
          <div className="text-sm text-gray-600">
            {achievements.filter(a => a.is_unlocked).length} из {achievements.length}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${
                achievement.is_unlocked
                  ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300 shadow-lg'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              } ${showUnlocked === achievement.id ? 'animate-pulse scale-105' : ''}`}
            >
              <div className="flex items-start space-x-3">
                <div className={`text-3xl ${achievement.is_unlocked ? '' : 'grayscale opacity-50'}`}>
                  {achievement.icon}
                </div>
                
                <div className="flex-1">
                  <h4 className={`font-semibold ${
                    achievement.is_unlocked ? 'text-yellow-800' : 'text-gray-700'
                  }`}>
                    {achievement.name}
                  </h4>
                  
                  <p className={`text-sm ${
                    achievement.is_unlocked ? 'text-yellow-700' : 'text-gray-600'
                  }`}>
                    {achievement.description}
                  </p>

                  {/* Прогресс-бар */}
                  <div className="mt-2">
                    <div className={`w-full rounded-full h-2 ${
                      achievement.is_unlocked ? 'bg-yellow-200' : 'bg-gray-200'
                    }`}>
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          achievement.is_unlocked ? 'bg-yellow-500' : 'bg-blue-400'
                        }`}
                        style={{ width: `${getProgressPercentage(achievement)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs mt-1">
                      <span className={achievement.is_unlocked ? 'text-yellow-700' : 'text-gray-500'}>
                        {achievement.progress}/{achievement.max_progress}
                      </span>
                      {achievement.is_unlocked && achievement.unlocked_at && (
                        <span className="text-yellow-600">
                          {new Date(achievement.unlocked_at).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {achievement.is_unlocked && (
                <div className="absolute top-2 right-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Анимация нового достижения */}
      {showUnlocked && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-bounce">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">Новое достижение!</h2>
            <div className="text-4xl mb-2">
              {achievements.find(a => a.id === showUnlocked)?.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {achievements.find(a => a.id === showUnlocked)?.name}
            </h3>
            <p className="text-gray-600">
              {achievements.find(a => a.id === showUnlocked)?.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}