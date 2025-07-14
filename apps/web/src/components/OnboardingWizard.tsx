'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface OnboardingWizardProps {
  currentStep: number;
  children: React.ReactNode;
}

export default function OnboardingWizard({ currentStep, children }: OnboardingWizardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const steps = [
    { number: 1, title: 'Твоя цель', description: 'Выбери целевой балл' },
    { number: 2, title: 'Слабые темы', description: 'Отметь сложные разделы' },
    { number: 3, title: 'Расписание', description: 'Настрой время занятий' },
    { number: 4, title: 'Уведомления', description: 'Подключи Telegram и Push' }
  ];

  const progressPercentage = (currentStep / steps.length) * 100;

  const navigateToStep = async (step: number) => {
    if (step < 1 || step > steps.length) return;
    
    setIsLoading(true);
    
    // Update current step in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: user.id, 
            onboarding_step: step 
          });
      }
    } catch (error) {
      console.error('Error updating step:', error);
    }
    
    router.push(`/onboarding/step-${step}`);
    setIsLoading(false);
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      navigateToStep(currentStep + 1);
    } else {
      // Complete onboarding
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      navigateToStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_preferences')
          .update({ 
            completed_at: new Date().toISOString(),
            onboarding_step: 4
          })
          .eq('user_id', user.id);
        
        // Initialize user progress
        await supabase
          .from('user_progress')
          .upsert({ 
            user_id: user.id,
            total_xp: 0,
            current_streak: 0,
            longest_streak: 0,
            last_activity: new Date().toISOString()
          });
      }
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Настройка профиля</h1>
            <span className="text-sm text-gray-600">
              {currentStep} из {steps.length}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <div 
                key={step.number}
                className={`flex flex-col items-center cursor-pointer transition-all duration-200 ${
                  step.number <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}
                onClick={() => navigateToStep(step.number)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all duration-200 ${
                  step.number <= currentStep 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {step.number}
                </div>
                <span className="text-xs mt-1 text-center max-w-16">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {steps[currentStep - 1]?.title}
            </h2>
            <p className="text-gray-600">
              {steps[currentStep - 1]?.description}
            </p>
          </div>

          {children}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || isLoading}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              currentStep === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Назад
          </button>

          <button
            onClick={nextStep}
            disabled={isLoading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Загрузка...
              </span>
            ) : (
              currentStep === steps.length ? 'Завершить' : 'Далее'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}