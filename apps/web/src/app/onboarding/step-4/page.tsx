"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface UserPreferences {
  exam: string;
  subjects: string[];
  level: string;
  study_time: string;
  exam_date: string;
}

export default function Step4() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUserPreferences = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.user_metadata?.preferences) {
        setPreferences(user.user_metadata.preferences);
      }
    };

    loadUserPreferences();
  }, []);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Необходимо войти в систему");
        return;
      }

      // Завершаем onboarding и сохраняем финальные настройки
      const { error } = await supabase.auth.updateUser({
        data: {
          preferences: {
            ...user.user_metadata.preferences,
            notifications,
            daily_reminders: dailyReminders,
            onboarding_completed: true,
            onboarding_step: 5
          }
        }
      });

      if (error) {
        console.error("Error completing onboarding:", error);
        alert("Ошибка сохранения данных");
      } else {
        // Перенаправляем на главную страницу
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Error in step 4:", err);
      alert("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (!preferences) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Всё готово! 🎉
          </h1>
          <p className="text-gray-600">
            Шаг 4 из 4: Проверьте настройки и завершите регистрацию
          </p>
        </div>

        {/* Сводка настроек */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Ваши настройки:
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Экзамен:</span>
              <span className="font-medium">{preferences.exam.toUpperCase()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Предметы:</span>
              <span className="font-medium">{preferences.subjects.length} предмета</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Уровень:</span>
              <span className="font-medium capitalize">{preferences.level}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Время в день:</span>
              <span className="font-medium">{preferences.study_time} мин</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Дата экзамена:</span>
              <span className="font-medium">
                {new Date(preferences.exam_date).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </div>
        </div>

        {/* Настройки уведомлений */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-medium text-gray-900">
            Уведомления:
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Push-уведомления</h4>
              <p className="text-sm text-gray-600">
                Получать уведомления о новых задачах и достижениях
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-5 h-5 text-blue-600"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Ежедневные напоминания</h4>
              <p className="text-sm text-gray-600">
                Напоминания о занятиях в выбранное время
              </p>
            </div>
            <input
              type="checkbox"
              checked={dailyReminders}
              onChange={(e) => setDailyReminders(e.target.checked)}
              className="w-5 h-5 text-blue-600"
            />
          </div>
        </div>

        {/* Что дальше */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Что дальше?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Система составит персональный план обучения</li>
            <li>• Вы получите рекомендации по слабым темам</li>
            <li>• Начнете получать ежедневные задачи</li>
            <li>• Сможете отслеживать прогресс в личном кабинете</li>
          </ul>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => router.push("/onboarding/step-3")}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ← Назад
          </button>
          <button
            onClick={handleFinish}
            disabled={loading}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Настройка..." : "Начать обучение! 🚀"}
          </button>
        </div>

        {/* Индикатор прогресса */}
        <div className="mt-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
