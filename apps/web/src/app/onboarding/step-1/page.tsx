'use client';

import React, { useState, useEffect } from 'react';
import OnboardingWizard from '@/components/OnboardingWizard';
import { createClient } from '@/lib/supabase';

export default function Step1() {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
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
          .select('goal_score')
          .eq('user_id', user.id)
          .single();
        
        if (preferences?.goal_score) {
          setSelectedScore(preferences.goal_score);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleScoreSelect = async (score: number) => {
    setSelectedScore(score);
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: user.id, 
            goal_score: score,
            onboarding_step: 1
          });
      }
    } catch (error) {
      console.error('Error saving goal score:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scoreOptions = [
    {
      score: 70,
      title: '70+ баллов',
      description: 'Хорошая база для поступления',
      color: 'bg-green-500',
      benefit: 'Подходит для большинства вузов'
    },
    {
      score: 80,
      title: '80+ баллов',
      description: 'Высокий уровень подготовки',
      color: 'bg-blue-500',
      benefit: 'Откроет двери в топовые вузы'
    },
    {
      score: 90,
      title: '90+ баллов',
      description: 'Максимальный результат',
      color: 'bg-purple-500',
      benefit: 'Гарантированное поступление в любой вуз'
    }
  ];

  return (
    <OnboardingWizard currentStep={1}>
      <div className="max-w-3xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {scoreOptions.map((option) => (
            <div
              key={option.score}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedScore === option.score
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleScoreSelect(option.score)}
            >
              {selectedScore === option.score && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-lg ${option.color} flex items-center justify-center mb-4`}>
                <span className="text-white font-bold text-lg">{option.score}</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{option.title}</h3>
              <p className="text-gray-600 mb-4">{option.description}</p>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{option.benefit}</p>
              </div>
            </div>
          ))}
        </div>

        {selectedScore && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800">Цель установлена!</h4>
                <p className="text-sm text-blue-700">
                  Мы подберем задания и составим план для достижения {selectedScore}+ баллов
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Не переживай, цель можно изменить в любое время в настройках профиля
          </p>
        </div>
      </div>
    </OnboardingWizard>
  );
}
