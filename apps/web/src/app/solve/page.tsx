'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import TaskChat from '@/components/TaskChat';

const supabase = createClient();

interface Task {
  id: string;
  task_number: number;
  subtopic_id: string;
  difficulty: number;
  question: string;
  answer: string;
  solution: string;
  hint?: string;
}

interface SolveSession {
  tasks: Task[];
  currentIndex: number;
  selectedTasks: { [subtopicId: string]: number };
  totalTasks: number;
  sessionId: string;
  startedAt: Date;
}

export default function SolvePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<SolveSession | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskStartTime, setTaskStartTime] = useState<Date>(new Date());
  const [sessionStats, setSessionStats] = useState({
    correctCount: 0,
    totalCount: 0,
    averageTime: 0
  });

  useEffect(() => {
    initializeSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Необходимо войти в систему");
        return;
      }

      // Получаем параметры из URL
      const taskId = searchParams.get('taskId');
      const selectedSubtopics = searchParams.get('subtopics');
      
      if (!taskId || !selectedSubtopics) {
        setError("Неверные параметры сессии");
        return;
      }

      const subtopics = JSON.parse(selectedSubtopics);
      
      // Загружаем задачи для выбранных подтем
      const taskPromises = Object.entries(subtopics).map(async ([subtopicId, count]) => {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('task_number', parseInt(taskId))
          .eq('subtopic_id', subtopicId)
          .order('difficulty')
          .limit(count as number);
        
        return tasks || [];
      });

      const taskArrays = await Promise.all(taskPromises);
      const allTasks = taskArrays.flat().sort(() => Math.random() - 0.5); // Перемешиваем задачи

      // Создаем новую сессию в базе данных
      const sessionId = crypto.randomUUID();
      const startedAt = new Date();
      
      const { error: sessionError } = await supabase
        .from('study_sessions')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          session_type: 'practice',
          tasks_planned: allTasks.length,
          target_topics: Object.keys(subtopics),
          status: 'active'
        });

      if (sessionError) {
        console.error('Error creating study session:', sessionError);
      }

      setSession({
        tasks: allTasks,
        currentIndex: 0,
        selectedTasks: subtopics,
        totalTasks: allTasks.length,
        sessionId,
        startedAt
      });

      setTaskStartTime(new Date());

    } catch (err) {
      console.error('Error initializing session:', err);
      setError('Ошибка загрузки задач');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!session || !userAnswer.trim()) return;

    const currentTask = session.tasks[session.currentIndex];
    const correct = normalizeAnswer(userAnswer) === normalizeAnswer(currentTask.answer);
    const timeSpent = Math.floor((new Date().getTime() - taskStartTime.getTime()) / 1000);
    
    setIsCorrect(correct);
    setIsAnswerSubmitted(true);

    // Обновляем статистику сессии
    setSessionStats(prev => ({
      correctCount: prev.correctCount + (correct ? 1 : 0),
      totalCount: prev.totalCount + 1,
      averageTime: Math.floor(((prev.averageTime * prev.totalCount) + timeSpent) / (prev.totalCount + 1))
    }));

    // Сохраняем детальную попытку в базе данных
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Определяем тип ошибки если ответ неверный
        let mistakeType = null;
        if (!correct) {
          // Простая эвристика для определения типа ошибки
          if (userAnswer.length < 2) {
            mistakeType = 'attention';
          } else if (isNaN(Number(userAnswer)) && !isNaN(Number(currentTask.answer))) {
            mistakeType = 'method';
          } else {
            mistakeType = 'calculation';
          }
        }

        // Используем новый API endpoint для сохранения попытки
        const attemptData = {
          task_id: currentTask.id,
          task_number: currentTask.task_number,
          topic_name: getTopicName(currentTask.task_number),
          subtopic_name: currentTask.subtopic_id,
          difficulty_level: currentTask.difficulty,
          user_answer: userAnswer,
          correct_answer: currentTask.answer,
          is_correct: correct,
          time_spent_seconds: timeSpent,
          hints_used: showHint ? 1 : 0,
          solution_viewed: showSolution,
          mistake_type: mistakeType,
          session_id: session.sessionId,
          confidence_level: correct ? 4 : 2, // Простая эвристика
          device_type: 'web'
        };

        const response = await fetch('/api/attempt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(attemptData)
        });

        const result = await response.json();
        
        if (!response.ok) {
          console.error('Failed to save attempt:', result.error);
        } else {
          console.log(`Task ${currentTask.task_number} saved successfully: ${result.saved_to}, gained ${result.experience_gained} XP`);
        }

        console.log(`Task ${currentTask.task_number} completed: ${correct ? 'correct' : 'incorrect'} in ${timeSpent}s`);
      }
    } catch (err) {
      console.error('Error saving attempt:', err);
    }
  };

  // Вспомогательная функция для получения названия темы по номеру задания
  const getTopicName = (taskNumber: number): string => {
    const topicMap: Record<number, string> = {
      1: 'Простейшие текстовые задачи',
      2: 'Чтение графиков и диаграмм',
      3: 'Планиметрия',
      4: 'Теория вероятностей',
      5: 'Простейшие уравнения',
      6: 'Планиметрия (углы)',
      7: 'Производная',
      8: 'Стереометрия',
      9: 'Вычисления',
      10: 'Прикладные задачи',
      11: 'Текстовые задачи',
      12: 'Исследование функций',
      13: 'Уравнения (сложные)',
      14: 'Стереометрия (углы и расстояния)',
      15: 'Неравенства',
      16: 'Планиметрия (доказательства)',
      17: 'Финансовая математика',
      18: 'Задачи с параметром'
    };
    return topicMap[taskNumber] || 'Неизвестная тема';
  };

  const normalizeAnswer = (answer: string) => {
    return answer.toLowerCase().trim().replace(/\s+/g, '');
  };

  const nextTask = async () => {
    if (!session) return;

    if (session.currentIndex + 1 < session.tasks.length) {
      // Переходим к следующей задаче
      setSession({
        ...session,
        currentIndex: session.currentIndex + 1
      });
      setUserAnswer('');
      setShowSolution(false);
      setShowHint(false);
      setIsAnswerSubmitted(false);
      setIsCorrect(false);
      setTaskStartTime(new Date()); // Сбрасываем таймер для новой задачи
    } else {
      // Завершаем сессию
      await completeSession();
      router.push('/dashboard?session=completed');
    }
  };

  const completeSession = async () => {
    if (!session) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const actualDuration = Math.floor((new Date().getTime() - session.startedAt.getTime()) / 1000 / 60);
      
      // Обновляем статус сессии
      await supabase
        .from('study_sessions')
        .update({
          status: 'completed',
          tasks_completed: sessionStats.totalCount,
          tasks_correct: sessionStats.correctCount,
          actual_duration_minutes: actualDuration,
          average_time_per_task: sessionStats.averageTime,
          completion_percentage: (sessionStats.totalCount / session.totalTasks) * 100,
          completed_at: new Date().toISOString()
        })
        .eq('session_id', session.sessionId);

      console.log(`Session completed: ${sessionStats.correctCount}/${sessionStats.totalCount} correct, ${actualDuration} minutes`);
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const showHintHandler = () => {
    setShowHint(true);
  };

  const showSolutionHandler = () => {
    setShowSolution(true);
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
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Вернуться к Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!session || session.tasks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Нет задач</h2>
          <p className="text-gray-600 mb-4">Не найдено задач для решения</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Вернуться к Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentTask = session.tasks[session.currentIndex];
  const progress = ((session.currentIndex + 1) / session.totalTasks) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - Основная задача */}
          <div className="lg:col-span-2">
            {/* Прогресс-бар */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Задача {session.currentIndex + 1} из {session.totalTasks}</span>
                <span>{Math.round(progress)}% завершено</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Основная карточка задачи */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Задание №{currentTask.task_number}
              </h1>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Сложность: {currentTask.difficulty}
                </span>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <ReactMarkdown>
                {currentTask.question}
              </ReactMarkdown>
            </div>
          </div>

          {/* Поле для ответа */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ваш ответ:
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={isAnswerSubmitted}
                placeholder="Введите ответ..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isAnswerSubmitted) {
                    submitAnswer();
                  }
                }}
              />
              {!isAnswerSubmitted && (
                <button
                  onClick={submitAnswer}
                  disabled={!userAnswer.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Проверить
                </button>
              )}
            </div>
          </div>

          {/* Результат проверки */}
          {isAnswerSubmitted && (
            <div className={`p-4 rounded-lg mb-6 ${
              isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                <span className={`text-2xl mr-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {isCorrect ? '✅' : '❌'}
                </span>
                <h3 className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect ? 'Правильно!' : 'Неправильно'}
                </h3>
              </div>
              {!isCorrect && (
                <p className="text-red-700 text-sm">
                  Правильный ответ: <strong>{currentTask.answer}</strong>
                </p>
              )}
            </div>
          )}

          {/* Кнопки помощи */}
          <div className="flex space-x-4 mb-6">
            {currentTask.hint && !showHint && !isAnswerSubmitted && (
              <button
                onClick={showHintHandler}
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
              >
                💡 Показать подсказку
              </button>
            )}
            
            {!showSolution && (isAnswerSubmitted || showHint) && (
              <button
                onClick={showSolutionHandler}
                className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200"
              >
                📖 Показать решение
              </button>
            )}
          </div>

          {/* Подсказка */}
          {showHint && currentTask.hint && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-yellow-800 mb-2">💡 Подсказка:</h4>
              <div className="prose prose-sm max-w-none text-yellow-700">
                <ReactMarkdown>
                  {currentTask.hint}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Решение */}
          {showSolution && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-purple-800 mb-2">📖 Решение:</h4>
              <div className="prose prose-sm max-w-none text-purple-700">
                <ReactMarkdown>
                  {currentTask.solution}
                </ReactMarkdown>
              </div>
            </div>
          )}

              {/* Кнопка "Далее" */}
              {isAnswerSubmitted && (
                <div className="flex justify-center">
                  <button
                    onClick={nextTask}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    {session.currentIndex + 1 < session.tasks.length ? 'Следующая задача' : 'Завершить сессию'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка - Чат с ассистентом */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 h-[calc(100vh-4rem)]">
              <TaskChat 
                taskId={currentTask.id}
                taskTitle={`Задание №${currentTask.task_number}`}
                taskStatement={currentTask.question}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}