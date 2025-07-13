'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface OnboardingStep {
  id: number
  title: string
  description: string
  completed: boolean
}

interface OnboardingWizardProps {
  className?: string
}

export default function OnboardingWizard({ className }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedGoal, setSelectedGoal] = useState<string>('')
  const [selectedSchedule, setSelectedSchedule] = useState<string>('')

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Выберите предметы',
      description: 'Выберите предметы для изучения и подготовки к экзаменам',
      completed: completedSteps.includes(1)
    },
    {
      id: 2,
      title: 'Уровень подготовки',
      description: 'Определите свой текущий уровень знаний',
      completed: completedSteps.includes(2)
    },
    {
      id: 3,
      title: 'Цели обучения',
      description: 'Установите цели и желаемый результат',
      completed: completedSteps.includes(3)
    },
    {
      id: 4,
      title: 'Расписание',
      description: 'Настройте график обучения',
      completed: completedSteps.includes(4)
    }
  ]

  const progressPercentage = (completedSteps.length / steps.length) * 100

  const handleStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId])
    }
    
    if (stepId < steps.length) {
      setCurrentStep(stepId + 1)
    } else {
      // All steps completed, redirect to dashboard
      router.push('/dashboard')
    }
  }

  const handleStepClick = (stepId: number) => {
    if (stepId <= currentStep) {
      setCurrentStep(stepId)
    }
  }

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    )
  }

  const isStepValid = (stepId: number): boolean => {
    switch (stepId) {
      case 1: return selectedSubjects.length > 0
      case 2: return selectedLevel !== ''
      case 3: return selectedGoal !== ''
      case 4: return selectedSchedule !== ''
      default: return true
    }
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            Добро пожаловать в EGE AI Platform
          </h1>
          <p className="text-gray-600 text-center mb-4">
            Настроим вашу персональную программу подготовки
          </p>
          <div className="flex justify-center mb-4">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Шаг {currentStep} из {steps.length}
            </span>
          </div>
          <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all
                ${step.id === currentStep
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : step.completed
                  ? 'border-green-500 bg-green-50'
                  : step.id < currentStep
                  ? 'border-gray-300 bg-white hover:shadow-md'
                  : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                }
              `}
              onClick={() => handleStepClick(step.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {step.completed ? (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />
                  )}
                  <span className="font-semibold text-sm">{step.title}</span>
                </div>
                <div className="text-blue-500 text-lg">
                  {step.id === 1 ? '📚' : step.id === 2 ? '🎯' : step.id === 3 ? '🧠' : '🏆'}
                </div>
              </div>
              <p className="text-xs text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center space-x-2">
              <span className="text-2xl">
                {currentStep === 1 ? '📚' : currentStep === 2 ? '🎯' : currentStep === 3 ? '🧠' : '🏆'}
              </span>
              <span>{steps[currentStep - 1]?.title}</span>
            </h2>
            <p className="text-gray-600">{steps[currentStep - 1]?.description}</p>
          </div>

          <div className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Выберите предметы для изучения:</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Математика', 'Русский язык', 'Физика', 'Химия', 'Информатика', 'Биология'].map((subject) => (
                    <button
                      key={subject}
                      onClick={() => handleSubjectToggle(subject)}
                      className={`
                        p-3 rounded-lg border-2 text-left transition-all
                        ${selectedSubjects.includes(subject)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2">
                        <span>📚</span>
                        <span>{subject}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Ваш уровень подготовки:</h3>
                <div className="space-y-3">
                  {['Начинающий', 'Базовый', 'Средний', 'Продвинутый'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`
                        w-full p-3 rounded-lg border-2 text-left transition-all
                        ${selectedLevel === level
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🎯</span>
                        <span>{level}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Ваши цели:</h3>
                <div className="space-y-3">
                  {['Сдать на 80+ баллов', 'Поступить в ВУЗ', 'Улучшить знания', 'Подготовиться к олимпиаде'].map((goal) => (
                    <button
                      key={goal}
                      onClick={() => setSelectedGoal(goal)}
                      className={`
                        w-full p-3 rounded-lg border-2 text-left transition-all
                        ${selectedGoal === goal
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🧠</span>
                        <span>{goal}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Расписание занятий:</h3>
                <div className="space-y-3">
                  {['30 минут в день', '1 час в день', '2 часа в день', 'Индивидуально'].map((schedule) => (
                    <button
                      key={schedule}
                      onClick={() => setSelectedSchedule(schedule)}
                      className={`
                        w-full p-3 rounded-lg border-2 text-left transition-all
                        ${selectedSchedule === schedule
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🏆</span>
                        <span>{schedule}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all
                ${currentStep === 1 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
            >
              Назад
            </button>
            <button
              onClick={() => handleStepComplete(currentStep)}
              disabled={!isStepValid(currentStep)}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all flex items-center space-x-2
                ${isStepValid(currentStep)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <span>{currentStep === steps.length ? 'Завершить' : 'Далее'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}