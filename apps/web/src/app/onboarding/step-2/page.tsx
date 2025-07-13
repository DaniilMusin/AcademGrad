"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const SUBJECTS = {
  ege: [
    { id: "mathematics", name: "Математика (профиль)", required: true },
    { id: "russian", name: "Русский язык", required: true },
    { id: "physics", name: "Физика", required: false },
    { id: "chemistry", name: "Химия", required: false },
    { id: "biology", name: "Биология", required: false },
    { id: "history", name: "История", required: false },
    { id: "social", name: "Обществознание", required: false },
    { id: "english", name: "Английский язык", required: false },
    { id: "informatics", name: "Информатика", required: false }
  ],
  oge: [
    { id: "mathematics", name: "Математика", required: true },
    { id: "russian", name: "Русский язык", required: true },
    { id: "physics", name: "Физика", required: false },
    { id: "chemistry", name: "Химия", required: false },
    { id: "biology", name: "Биология", required: false },
    { id: "history", name: "История", required: false },
    { id: "social", name: "Обществознание", required: false },
    { id: "english", name: "Английский язык", required: false },
    { id: "informatics", name: "Информатика", required: false }
  ]
};

export default function Step2() {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [examType, setExamType] = useState<"ege" | "oge">("ege");
  const router = useRouter();

  useEffect(() => {
    // Получаем выбранный экзамен из предыдущего шага
    const loadUserPreferences = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.user_metadata?.preferences?.exam) {
        setExamType(user.user_metadata.preferences.exam);
        
        // Автоматически выбираем обязательные предметы
        const requiredSubjects = SUBJECTS[user.user_metadata.preferences.exam]
          .filter(subject => subject.required)
          .map(subject => subject.id);
        setSelectedSubjects(requiredSubjects);
      }
    };

    loadUserPreferences();
  }, []);

  const handleSubjectToggle = (subjectId: string) => {
    const subject = SUBJECTS[examType].find(s => s.id === subjectId);
    if (subject?.required) return; // Нельзя убрать обязательные предметы

    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleNext = async () => {
    if (selectedSubjects.length < 2) {
      alert("Выберите хотя бы 2 предмета для подготовки");
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

      // Сохраняем выбор предметов в preferences
      const { error } = await supabase.auth.updateUser({
        data: {
          preferences: {
            ...user.user_metadata.preferences,
            subjects: selectedSubjects,
            onboarding_step: 3
          }
        }
      });

      if (error) {
        console.error("Error updating user preferences:", error);
        alert("Ошибка сохранения данных");
      } else {
        router.push("/onboarding/step-3");
      }
    } catch (err) {
      console.error("Error in step 2:", err);
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
            Выберите предметы
          </h1>
          <p className="text-gray-600">
            Шаг 2 из 4: Выберите предметы для подготовки к {examType.toUpperCase()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SUBJECTS[examType].map((subject) => (
            <div
              key={subject.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedSubjects.includes(subject.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              } ${subject.required ? "opacity-100" : ""}`}
              onClick={() => handleSubjectToggle(subject.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={subject.id}
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={() => handleSubjectToggle(subject.id)}
                    disabled={subject.required}
                    className="mr-3"
                  />
                  <label htmlFor={subject.id} className="font-medium text-gray-900 cursor-pointer">
                    {subject.name}
                  </label>
                </div>
                {subject.required && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Обязательно
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => router.push("/onboarding/step-1")}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ← Назад
          </button>
          <button
            onClick={handleNext}
            disabled={loading || selectedSubjects.length < 2}
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
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          Выбрано предметов: {selectedSubjects.length}
        </div>
      </div>
    </div>
  );
}
