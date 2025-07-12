'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface TaskRecommendation {
  task_id: number;
  exam: string;
  topic: string;
  subtopic: string | null;
  difficulty: number;
  statement_md: string;
  priority_score: number;
  recommendation_reason: string;
  priority_bucket: string;
}

interface TaskRecommendationsProps {
  limit?: number;
}

export default function TaskRecommendations({ limit = 10 }: TaskRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<TaskRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskRecommendation | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadRecommendations();
  }, [limit]);

  const loadRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('get_personalized_recommendations', {
          p_user_id: user.id,
          p_limit: limit
        });

      if (error) {
        console.error('Error loading recommendations:', error);
        return;
      }

      setRecommendations(data || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (bucket: string) => {
    switch (bucket) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'due_soon':
        return 'border-orange-500 bg-orange-50';
      case 'scheduled':
        return 'border-blue-500 bg-blue-50';
      case 'weak_topic':
        return 'border-purple-500 bg-purple-50';
      case 'new_task':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getPriorityIcon = (bucket: string) => {
    switch (bucket) {
      case 'urgent':
        return '🚨';
      case 'due_soon':
        return '⏰';
      case 'scheduled':
        return '📅';
      case 'weak_topic':
        return '💪';
      case 'new_task':
        return '✨';
      default:
        return '📝';
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return '⭐'.repeat(difficulty);
  };

  const handleTaskClick = (task: TaskRecommendation) => {
    // Navigate to task page
    window.location.href = `/tasks/${task.task_id}`;
  };

  const handleTaskPreview = (task: TaskRecommendation) => {
    setSelectedTask(task);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
          🎯 Рекомендуемые задачи
        </h2>
        <button
          onClick={loadRecommendations}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          Обновить
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl mb-2 block">📚</span>
          <p>Нет рекомендаций</p>
          <p className="text-sm">
            Начните решать задачи, чтобы получить персонализированные рекомендации!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((task) => (
            <div
              key={task.task_id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${getPriorityColor(task.priority_bucket)}`}
              onClick={() => handleTaskClick(task)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getPriorityIcon(task.priority_bucket)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {task.topic} {task.subtopic && ` - ${task.subtopic}`}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{task.exam.toUpperCase()}</span>
                      <span>•</span>
                      <span>{getDifficultyStars(task.difficulty)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Приоритет: {Math.round(task.priority_score)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskPreview(task);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Предпросмотр
                  </button>
                </div>
              </div>

              <div className="bg-white bg-opacity-50 rounded-md p-3 mb-3">
                <p className="text-sm text-gray-700 line-clamp-2">
                  {task.statement_md.length > 100 
                    ? task.statement_md.substring(0, 100) + '...'
                    : task.statement_md
                  }
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {task.recommendation_reason}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add to favorites or skip functionality
                    }}
                    className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                  >
                    Пропустить
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskClick(task);
                    }}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Решить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Preview Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedTask.topic} {selectedTask.subtopic && ` - ${selectedTask.subtopic}`}
                </h3>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                  <span>{selectedTask.exam.toUpperCase()}</span>
                  <span>•</span>
                  <span>Сложность: {getDifficultyStars(selectedTask.difficulty)}</span>
                  <span>•</span>
                  <span>Приоритет: {Math.round(selectedTask.priority_score)}</span>
                </div>
                <p className="text-sm text-blue-600 mb-4">
                  {selectedTask.recommendation_reason}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Условие задачи:</h4>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {selectedTask.statement_md}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Закрыть
                </button>
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    handleTaskClick(selectedTask);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Решить задачу
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}