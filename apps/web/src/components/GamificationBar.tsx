'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Trophy, Flame, Target, Star, Zap } from 'lucide-react';

interface Badge {
  id: number;
  code: string;
  title: string;
  icon: string;
}

interface UserProgress {
  total_xp: number;
  current_streak: number;
  longest_streak: number;
}

interface GamificationBarProps {
  userId?: string;
}

interface BadgeItem {
  badge_id: number;
  badges: Badge;
}

export default function GamificationBar({ userId }: GamificationBarProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBadges, setShowBadges] = useState(false);
  const supabase = createClient();

  const loadUserProgress = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (targetUserId) {
        const { data, error } = await supabase
          .from('user_progress')
          .select('total_xp, current_streak, longest_streak')
          .eq('user_id', targetUserId)
          .single();
        
        if (data) {
          setProgress(data);
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  const loadUserBadges = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (targetUserId) {
        const { data, error } = await supabase
          .from('user_badges')
          .select(`
            badge_id,
            badges (
              id,
              code,
              title,
              icon
            )
          `)
          .eq('user_id', targetUserId)
          .order('given_at', { ascending: false });
        
        if (data) {
          setBadges(data.map((item: any) => item.badges));
        }
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  }, [supabase, userId]);

  useEffect(() => {
    loadUserProgress();
    loadUserBadges();
  }, [userId, loadUserProgress, loadUserBadges]);

  const getXpProgress = () => {
    if (!progress) return 0;
    const level = Math.floor(progress.total_xp / 100);
    const currentLevelXp = progress.total_xp - (level * 100);
    return currentLevelXp;
  };

  const getCurrentLevel = () => {
    if (!progress) return 1;
    return Math.floor(progress.total_xp / 100) + 1;
  };

  const getXpToNextLevel = () => {
    return 100 - getXpProgress();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg shadow-lg p-4 text-white">
      <div className="flex items-center justify-between">
        {/* Level and XP */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold">{getCurrentLevel()}</span>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-black">✨</span>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold">Уровень {getCurrentLevel()}</span>
              <span className="text-sm opacity-80">
                {progress?.total_xp || 0} XP
              </span>
            </div>
            
            <div className="w-32 bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getXpProgress()}%` }}
              />
            </div>
            
            <div className="text-xs opacity-80 mt-1">
              {getXpToNextLevel()} XP до следующего уровня
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <span className="text-2xl">🔥</span>
              <span className="text-xl font-bold">{progress?.current_streak || 0}</span>
            </div>
            <div className="text-xs opacity-80">Стрик</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <span className="text-2xl">🏆</span>
              <span className="text-xl font-bold">{progress?.longest_streak || 0}</span>
            </div>
            <div className="text-xs opacity-80">Рекорд</div>
          </div>
        </div>

        {/* Badges */}
        <div className="relative">
          <button
            onClick={() => setShowBadges(!showBadges)}
            className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-full px-3 py-2 hover:bg-opacity-30 transition-all duration-200"
          >
            <span className="text-sm font-medium">
              {badges.length} {badges.length === 1 ? 'бейдж' : 'бейджей'}
            </span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${showBadges ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showBadges && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Ваши достижения</h3>
                
                {badges.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-2 block">🎯</span>
                    <p>Пока нет бейджей</p>
                    <p className="text-sm">Решайте задачи, чтобы получить первые достижения!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-2xl mb-1">{badge.icon}</span>
                        <span className="text-xs text-center text-gray-700 font-medium">
                          {badge.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Прогресс до новых бейджей:</span>
                    <span className="font-medium">
                      {Math.round((badges.length / 15) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((badges.length / 15) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}