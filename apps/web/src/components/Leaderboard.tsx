'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  badge_count: number;
  xp_rank: number;
  streak_rank: number;
}

interface LeaderboardProps {
  type?: 'xp' | 'streak';
  limit?: number;
  groupId?: string;
}

export default function Leaderboard({ type = 'xp', limit = 10, groupId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const getCurrentUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      let query;
      
      if (groupId) {
        // Group leaderboard
        query = supabase
          .from('group_leaderboard')
          .select('*')
          .eq('group_id', groupId)
          .order(type === 'xp' ? 'total_xp' : 'current_streak', { ascending: false })
          .limit(limit);
      } else {
        // Global leaderboard
        query = supabase
          .from('leaderboard')
          .select('*')
          .order(type === 'xp' ? 'total_xp' : 'current_streak', { ascending: false })
          .limit(limit);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading leaderboard:', error);
        return;
      }

      setEntries(data || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, type, limit]);

  useEffect(() => {
    loadLeaderboard();
    getCurrentUser();
  }, [type, limit, groupId, loadLeaderboard, getCurrentUser]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getProgressColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-400';
      case 2:
        return 'bg-gray-400';
      case 3:
        return 'bg-orange-400';
      default:
        return 'bg-blue-400';
    }
  };

  const formatEmail = (email: string) => {
    if (email.length <= 20) return email;
    return email.substring(0, 17) + '...';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {type === 'xp' ? '🏆 Лидеры по XP' : '🔥 Лидеры по стрикам'}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.href = '/leaderboard'}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Посмотреть все
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl mb-2 block">📊</span>
          <p>Пока нет данных</p>
          <p className="text-sm">Решайте задачи, чтобы попасть в рейтинг!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = entry.user_id === currentUserId;
            
            return (
              <div
                key={entry.user_id}
                className={`flex items-center p-4 rounded-lg border-2 transition-all duration-200 ${
                  isCurrentUser
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-12 h-12 mr-4">
                  <span className="text-lg font-bold">
                    {getRankIcon(rank)}
                  </span>
                </div>

                {/* User info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${isCurrentUser ? 'text-blue-700' : 'text-gray-800'}`}>
                      {formatEmail(entry.email)}
                    </span>
                    {isCurrentUser && (
                      <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                        Вы
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-600">XP:</span>
                      <span className="font-medium">{entry.total_xp}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-600">Стрик:</span>
                      <span className="font-medium">{entry.current_streak}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-600">Бейджи:</span>
                      <span className="font-medium">{entry.badge_count}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar for main metric */}
                <div className="w-24 ml-4">
                  <div className="text-right text-sm font-bold text-gray-700 mb-1">
                    {type === 'xp' ? entry.total_xp : entry.current_streak}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${getProgressColor(rank)} h-2 rounded-full transition-all duration-300`}
                      style={{
                        width: `${Math.min(100, type === 'xp' 
                          ? (entry.total_xp / Math.max(entries[0]?.total_xp || 1, 1)) * 100
                          : (entry.current_streak / Math.max(entries[0]?.current_streak || 1, 1)) * 100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Обновлено: {new Date().toLocaleString('ru-RU')}</span>
          <span>Всего участников: {entries.length}</span>
        </div>
      </div>
    </div>
  );
}