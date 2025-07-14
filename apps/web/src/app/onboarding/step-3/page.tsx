
'use client';

import React, { useState, useEffect } from 'react';
import OnboardingWizard from '@/components/OnboardingWizard';
import { createClient } from '@/lib/supabase';

interface TimeSlot {
  id: string;
  day: string;
  time: string;
  selected: boolean;
}

export default function Step3() {
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleCalendar, setShowGoogleCalendar] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadCurrentSchedule();
  }, []);

  const loadCurrentSchedule = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: events } = await supabase
          .from('user_events')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_draft', true);
        
        if (events) {
          const slots = events.map(event => ({
            id: event.id.toString(),
            day: new Date(event.start_time).toLocaleDateString('ru-RU', { weekday: 'long' }),
            time: new Date(event.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            selected: true
          }));
          setSelectedSlots(slots);
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const handleSlotToggle = async (day: string, time: string) => {
    const slotId = `${day}-${time}`;
    const existingSlot = selectedSlots.find(s => s.id === slotId);
    
    let newSlots;
    if (existingSlot) {
      newSlots = selectedSlots.filter(s => s.id !== slotId);
    } else {
      newSlots = [...selectedSlots, { id: slotId, day, time, selected: true }];
    }
    
    setSelectedSlots(newSlots);
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Clear existing draft events
        await supabase
          .from('user_events')
          .delete()
          .eq('user_id', user.id)
          .eq('is_draft', true);
        
        // Create new draft events
        const events = newSlots.map(slot => {
          const dayIndex = days.indexOf(slot.day);
          const [hours, minutes] = slot.time.split(':').map(Number);
          
          // Get next occurrence of this day
          const now = new Date();
          const startDate = new Date(now);
          startDate.setDate(now.getDate() + (dayIndex - now.getDay() + 7) % 7);
          startDate.setHours(hours, minutes, 0, 0);
          
          const endDate = new Date(startDate);
          endDate.setHours(hours + 1, minutes, 0, 0);
          
          return {
            user_id: user.id,
            title: 'Занятие по подготовке к ЕГЭ',
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            event_type: 'study',
            is_draft: true
          };
        });
        
        if (events.length > 0) {
          await supabase.from('user_events').insert(events);
        }
        
        // Update preferences
        await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: user.id, 
            onboarding_step: 3
          });
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isSlotSelected = (day: string, time: string) => {
    return selectedSlots.some(s => s.day === day && s.time === time);
  };

  const handleGoogleCalendarImport = () => {
    setShowGoogleCalendar(true);
    // This would integrate with Google Calendar API
    // For now, just show a placeholder
  };

  return (
    <OnboardingWizard currentStep={3}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 text-center">
          <p className="text-gray-600">
            Выбери удобное время для занятий. Мы будем отправлять напоминания 
            и подбирать задания к этому времени.
          </p>
        </div>

        {/* Google Calendar Integration */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
              <div>
                <h4 className="font-semibold text-blue-800">Импорт из Google Calendar</h4>
                <p className="text-sm text-blue-700">
                  Автоматически найдем свободное время в вашем календаре
                </p>
              </div>
            </div>
            <button
              onClick={handleGoogleCalendarImport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Подключить
            </button>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-8 gap-0">
            {/* Header */}
            <div className="bg-gray-50 p-3 font-medium text-gray-700 border-b border-gray-200">
              Время
            </div>
            {days.map(day => (
              <div key={day} className="bg-gray-50 p-3 font-medium text-gray-700 border-b border-gray-200 text-center">
                {day.slice(0, 2)}
              </div>
            ))}
            
            {/* Time slots */}
            {timeSlots.map(time => (
              <React.Fragment key={time}>
                <div className="p-3 font-medium text-gray-600 border-b border-gray-200 bg-gray-50">
                  {time}
                </div>
                {days.map(day => (
                  <div
                    key={`${day}-${time}`}
                    className={`p-2 border-b border-gray-200 cursor-pointer transition-all duration-200 ${
                      isSlotSelected(day, time)
                        ? 'bg-green-100 border-green-300'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleSlotToggle(day, time)}
                  >
                    <div className={`w-full h-8 rounded flex items-center justify-center text-sm ${
                      isSlotSelected(day, time)
                        ? 'bg-green-500 text-white'
                        : 'border-2 border-dashed border-gray-300 text-gray-400'
                    }`}>
                      {isSlotSelected(day, time) ? '✓' : '+'}
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Selected slots summary */}
        {selectedSlots.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-1">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-2">
                  Выбрано занятий в неделю: {selectedSlots.length}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedSlots.map(slot => (
                    <div key={slot.id} className="flex items-center text-sm text-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      {slot.day} в {slot.time}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Итого: {selectedSlots.length} часов в неделю
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3 mt-1">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">Рекомендации</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Минимум 3 часа в неделю для эффективной подготовки</li>
                <li>• Лучше заниматься регулярно, чем долго за один раз</li>
                <li>• Утренние часы (9-11) показывают лучшие результаты</li>
                <li>• Не забывайте про перерывы между занятиями</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Расписание можно изменить в любое время в настройках профиля
          </p>
        </div>
      </div>
    </OnboardingWizard>
=======
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
