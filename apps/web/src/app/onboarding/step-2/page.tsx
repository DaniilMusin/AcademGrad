'use client';

import React, { useState, useEffect } from 'react';
import OnboardingWizard from '@/components/OnboardingWizard';
import { createClient } from '@/lib/supabase';

export default function Step2() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadCurrentPreferences();
  }, []);

  const loadCurrentPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('weak_topics')
          .eq('user_id', user.id)
          .single();
        
        if (preferences?.weak_topics) {
          setSelectedTopics(preferences.weak_topics);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleTopicToggle = async (topic: string) => {
    const newTopics = selectedTopics.includes(topic)
      ? selectedTopics.filter(t => t !== topic)
      : [...selectedTopics, topic];
    
    setSelectedTopics(newTopics);
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: user.id, 
            weak_topics: newTopics,
            onboarding_step: 2
          });
      }
    } catch (error) {
      console.error('Error saving weak topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const topicCategories = [
    {
      category: 'Алгебра',
      topics: [
        'Линейные уравнения',
        'Квадратные уравнения',
        'Логарифмы',
        'Степени и корни',
        'Тригонометрия',
        'Производная'
      ]
    },
    {
      category: 'Геометрия',
      topics: [
        'Планиметрия',
        'Стереометрия',
        'Векторы',
        'Координаты',
        'Площади и объемы'
      ]
    },
    {
      category: 'Анализ',
      topics: [
        'Функции',
        'Графики',
        'Интегралы',
        'Задачи на движение',
        'Экономические задачи'
      ]
    }
  ];

  return (
    <OnboardingWizard currentStep={2}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <p className="text-gray-600">
            Выбери темы, которые вызывают у тебя наибольшие трудности. 
            Мы уделим им особое внимание в персональном плане подготовки.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {topicCategories.map((category) => (
            <div key={category.category} className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">
                    {category.category.slice(0, 2)}
                  </span>
                </div>
                {category.category}
              </h3>
              
              <div className="space-y-2">
                {category.topics.map((topic) => (
                  <div
                    key={topic}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedTopics.includes(topic)
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => handleTopicToggle(topic)}
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                        selectedTopics.includes(topic)
                          ? 'border-red-500 bg-red-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedTopics.includes(topic) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium">{topic}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selectedTopics.length > 0 && (
          <div className="mt-8 p-6 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3 mt-1">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-orange-800 mb-2">
                  Выбрано тем для усиленной подготовки: {selectedTopics.length}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTopics.map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-orange-700 mt-2">
                  Мы увеличим количество заданий по этим темам и добавим дополнительные материалы
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Если сомневаешься, можешь пропустить этот шаг. 
            Мы определим слабые места автоматически по результатам решения задач.
          </p>
        </div>
      </div>
    </OnboardingWizard>
  );
}
