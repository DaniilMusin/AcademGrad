"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Step1() {
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNext = async () => {
    if (!selectedExam) {
      alert("Пожалуйста, выберите экзамен");
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

      // Сохраняем выбор экзамена в preferences
      const { error } = await supabase.auth.updateUser({
        data: {
          preferences: {
            exam: selectedExam,
            onboarding_step: 2
          }
        }
      });

      if (error) {
        console.error("Error updating user preferences:", error);
        alert("Ошибка сохранения данных");
      } else {
        router.push("/onboarding/step-2");
      }
    } catch (err) {
      console.error("Error in step 1:", err);
      alert("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Добро пожаловать!
          </h1>
          <p className="text-gray-600">
            Шаг 1 из 4: Выберите экзамен для подготовки
          </p>
        </div>

        <div className="space-y-4">
          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              selectedExam === "ege" 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedExam("ege")}
          >
            <div className="flex items-center">
              <input
                type="radio"
                id="ege"
                name="exam"
                value="ege"
                checked={selectedExam === "ege"}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="mr-3"
              />
              <div>
                <label htmlFor="ege" className="font-medium text-gray-900 cursor-pointer">
                  ЕГЭ (11 класс)
                </label>
                <p className="text-sm text-gray-500">
                  Подготовка к Единому государственному экзамену
                </p>
              </div>
            </div>
          </div>

          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              selectedExam === "oge" 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedExam("oge")}
          >
            <div className="flex items-center">
              <input
                type="radio"
                id="oge"
                name="exam"
                value="oge"
                checked={selectedExam === "oge"}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="mr-3"
              />
              <div>
                <label htmlFor="oge" className="font-medium text-gray-900 cursor-pointer">
                  ОГЭ (9 класс)
                </label>
                <p className="text-sm text-gray-500">
                  Подготовка к Основному государственному экзамену
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ← Назад
          </button>
          <button
            onClick={handleNext}
            disabled={loading || !selectedExam}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Сохранение..." : "Далее →"}
          </button>
        </div>

        {/* Индикатор прогресса */}
        <div className="mt-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
