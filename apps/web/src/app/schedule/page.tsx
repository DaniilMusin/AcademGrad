"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import Calendar from "@/components/Calendar";

const supabase = createClient();

interface ScheduleEvent {
  title: string;
  start: string;
  end: string;
  url?: string;
  priority: number;
  reason: string;
}

export default function Schedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Необходимо войти в систему");
        return;
      }

      // Загружаем расписание из представления schedule_view
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("schedule_view")
        .select("*")
        .eq("user_id", user.id)
        .order("priority", { ascending: false })
        .order("next_review", { ascending: true });

      if (scheduleError) {
        console.error("Error loading schedule:", scheduleError);
        setError("Ошибка загрузки расписания");
      } else {
        // Преобразуем данные в формат событий для календаря
        const formattedEvents: ScheduleEvent[] = scheduleData?.map((item: any) => ({
          title: `${item.topic} (${item.difficulty} ⭐)`,
          start: item.next_review,
          end: new Date(new Date(item.next_review).getTime() + 30 * 60 * 1000).toISOString(), // 30 минут
          priority: item.priority,
          reason: item.reason
        })) || [];
        
        setEvents(formattedEvents);
      }

    } catch (err) {
      console.error("Error loading schedule:", err);
      setError("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const getReasonDescription = (reason: string) => {
    switch (reason) {
      case "weak_topic":
        return "Слабая тема";
      case "spaced_repetition":
        return "Интервальное повторение";
      case "difficulty_ramp":
        return "Повышение сложности";
      default:
        return reason;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5:
        return "text-red-600 bg-red-50";
      case 4:
        return "text-orange-600 bg-orange-50";
      case 3:
        return "text-yellow-600 bg-yellow-50";
      case 2:
        return "text-blue-600 bg-blue-50";
      case 1:
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
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

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Расписание занятий
        </h1>
        <p className="text-gray-600">
          Персональное расписание для повторения слабых тем
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Календарь */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Предстоящие занятия
            </h2>
            {events.length > 0 ? (
              <Calendar events={events} />
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-gray-500">
                  Нет запланированных занятий. Решите несколько задач, чтобы система 
                  составила для вас персональное расписание.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Приоритеты */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Приоритеты
            </h2>
            
            <div className="space-y-3">
              {events.slice(0, 5).map((event, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg ${getPriorityColor(event.priority)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{event.title}</h3>
                    <span className="text-xs font-bold">
                      {event.priority}
                    </span>
                  </div>
                  <p className="text-sm">
                    {getReasonDescription(event.reason)}
                  </p>
                  <p className="text-xs mt-1">
                    {new Date(event.start).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>

            {events.length > 5 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  И ещё {events.length - 5} занятий...
                </p>
              </div>
            )}
          </div>

          {/* Легенда приоритетов */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Уровни приоритета
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>5 - Критически важно</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>4 - Высокий приоритет</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>3 - Средний приоритет</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>2 - Низкий приоритет</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span>1 - Минимальный</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
