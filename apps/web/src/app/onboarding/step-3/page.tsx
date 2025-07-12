"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const DIFFICULTY_LEVELS = [
  { id: "beginner", name: "Начальный", description: "Только начинаю изучать предмет" },
  { id: "intermediate", name: "Базовый", description: "Знаю основы, но нужна практика" },
  { id: "advanced", name: "Уверенный", description: "Хорошо владею предметом" },
  { id: "expert", name: "Продвинутый", description: "Отлично знаю предмет, нужна только доводка" }
];

export default function Step3() {
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [studyTime, setStudyTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [examDate, setExamDate] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    // Устанавливаем дату экзамена по умолчанию (июнь следующего года)
    const now = new Date();
    const nextYear = now.getFullYear() + (now.getMonth() >= 6 ? 1 : 0);
    setExamDate(`${nextYear}-06-01`);
  }, []);

  const handleNext = async () => {
    if (!selectedLevel || !studyTime || !examDate) {
      alert("Пожалуйста, заполните все поля");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Необходимо войти в систему");
        return;
      }

      // Сохраняем настройки обучения в preferences
      const { error } = await supabase.auth.updateUser({
        data: {
          preferences: {
            ...user.user_metadata.preferences,
            level: selectedLevel,
            study_time: studyTime,
            exam_date: examDate,
            onboarding_step: 4
          }
        }
      });

      if (error) {
        console.error("Error updating user preferences:", error);
        alert("Ошибка сохранения данных");
      } else {
        router.push("/onboarding/step-4");
      }
    } catch (err) {
      console.error("Error in step 3:", err);
      alert("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Оцените ваш уровень
          </h1>
          <p className="text-gray-600">
            Шаг 3 из 4: Расскажите о своих знаниях и планах
          </p>
        </div>

        <div className="space-y-6">
          {/* Уровень знаний */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Ваш текущий уровень знаний:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DIFFICULTY_LEVELS.map((level) => (
                <div
                  key={level.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedLevel === level.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedLevel(level.id)}
                >
                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      id={level.id}
                      name="level"
                      value={level.id}
                      checked={selectedLevel === level.id}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="mr-3"
                    />
                    <label htmlFor={level.id} className="font-medium text-gray-900 cursor-pointer">
                      {level.name}
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    {level.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Время на подготовку */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Сколько времени готовы уделять занятиям ежедневно?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "30", label: "30 мин" },
                { value: "60", label: "1 час" },
                { value: "90", label: "1.5 часа" },
                { value: "120", label: "2 часа" }
              ].map((time) => (
                <div
                  key={time.value}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors text-center ${
                    studyTime === time.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setStudyTime(time.value)}
                >
                  <input
                    type="radio"
                    id={time.value}
                    name="study_time"
                    value={time.value}
                    checked={studyTime === time.value}
                    onChange={(e) => setStudyTime(e.target.value)}
                    className="sr-only"
                  />
                  <label htmlFor={time.value} className="font-medium text-gray-900 cursor-pointer">
                    {time.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Дата экзамена */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Когда планируете сдавать экзамен?
            </h3>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => router.push("/onboarding/step-2")}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ← Назад
          </button>
          <button
            onClick={handleNext}
            disabled={loading || !selectedLevel || !studyTime || !examDate}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Сохранение..." : "Далее →"}
          </button>
        </div>

        {/* Индикатор прогресса */}
        <div className="mt-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
