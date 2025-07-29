'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface SubTopic {
  id: string;
  name: string;
  count: number;
}

interface TaskData {
  id: string;
  name: string;
  subtopics: SubTopic[];
}

const taskData: Record<string, TaskData> = {
  '1': {
    id: '1',
    name: 'Простейшие текстовые задачи',
    subtopics: []
  },
  '2': {
    id: '2', 
    name: 'Чтение графиков и диаграмм',
    subtopics: []
  },
  '3': {
    id: '3',
    name: 'Планиметрия',
    subtopics: [
      { id: '3-1', name: 'Решение прямоугольного треугольника', count: 50 },
      { id: '3-2', name: 'Решение равнобедренного треугольника', count: 49 },
      { id: '3-3', name: 'Треугольники общего вида', count: 30 },
      { id: '3-4', name: 'Параллелограммы', count: 35 },
      { id: '3-5', name: 'Трапеция', count: 27 },
      { id: '3-6', name: 'Центральные и вписанные углы', count: 16 },
      { id: '3-7', name: 'Касательная, хорда, секущая', count: 11 },
      { id: '3-8', name: 'Вписанные окружности', count: 25 },
      { id: '3-9', name: 'Описанные окружности', count: 30 }
    ]
  },
  '4': {
    id: '4',
    name: 'Теория вероятностей',
    subtopics: [
      { id: '4-1', name: 'Классическое определение вероятности', count: 60 }
    ]
  },
  '5': {
    id: '5',
    name: 'Простейшие уравнения',
    subtopics: [
      { id: '5-1', name: 'Линейные, квадратные, кубические уравнения', count: 9 },
      { id: '5-2', name: 'Рациональные уравнения', count: 10 },
      { id: '5-3', name: 'Иррациональные уравнения', count: 16 },
      { id: '5-4', name: 'Показательные уравнения', count: 18 },
      { id: '5-5', name: 'Логарифмические уравнения', count: 14 },
      { id: '5-6', name: 'Тригонометрические уравнения', count: 3 }
    ]
  },
  '6': {
    id: '6',
    name: 'Планиметрия (углы)',
    subtopics: []
  },
  '7': {
    id: '7',
    name: 'Производная',
    subtopics: [
      { id: '7-1', name: 'Физический смысл производной', count: 6 },
      { id: '7-2', name: 'Геометрический смысл производной, касательная', count: 31 },
      { id: '7-3', name: 'Применение производной к исследованию функций', count: 39 },
      { id: '7-4', name: 'Первообразная', count: 5 }
    ]
  },
  '8': {
    id: '8',
    name: 'Стереометрия',
    subtopics: [
      { id: '8-1', name: 'Куб', count: 13 },
      { id: '8-2', name: 'Прямоугольный параллелепипед', count: 34 },
      { id: '8-3', name: 'Элементы составных многогранников', count: 15 },
      { id: '8-4', name: 'Площадь поверхности составного многогранника', count: 18 },
      { id: '8-5', name: 'Объем составного многогранника', count: 17 },
      { id: '8-6', name: 'Призма', count: 52 },
      { id: '8-7', name: 'Пирамида', count: 68 },
      { id: '8-8', name: 'Комбинации тел', count: 41 },
      { id: '8-9', name: 'Цилиндр', count: 17 },
      { id: '8-10', name: 'Конус', count: 29 },
      { id: '8-11', name: 'Шар', count: 8 }
    ]
  },
  '9': {
    id: '9',
    name: 'Вычисления',
    subtopics: [
      { id: '9-1', name: 'Преобразования числовых рациональных выражений', count: 6 },
      { id: '9-2', name: 'Преобразования алгебраических выражений и дробей', count: 26 },
      { id: '9-3', name: 'Вычисление значений степенных выражений', count: 20 },
      { id: '9-4', name: 'Действия со степенями', count: 31 },
      { id: '9-5', name: 'Преобразования числовых иррациональных выражений', count: 13 },
      { id: '9-6', name: 'Преобразования буквенных иррациональных выражений', count: 11 },
      { id: '9-7', name: 'Преобразования числовых логарифмических выражений', count: 34 },
      { id: '9-8', name: 'Преобразования буквенных логарифмических выражений', count: 3 },
      { id: '9-9', name: 'Вычисление значений тригонометрических выражений', count: 31 },
      { id: '9-10', name: 'Преобразования числовых тригонометрических выражений', count: 31 },
      { id: '9-11', name: 'Преобразования буквенных тригонометрических выражений', count: 2 }
    ]
  },
  '10': {
    id: '10',
    name: 'Прикладные задачи',
    subtopics: [
      { id: '10-1', name: 'Линейные уравнения и неравенства', count: 2 },
      { id: '10-2', name: 'Квадратные и степенные уравнения и неравенства', count: 18 },
      { id: '10-3', name: 'Рациональные уравнения и неравенства', count: 14 },
      { id: '10-4', name: 'Иррациональные уравнения и неравенства', count: 10 },
      { id: '10-5', name: 'Показательные уравнения и неравенства', count: 7 },
      { id: '10-6', name: 'Логарифмические уравнения и неравенства', count: 4 },
      { id: '10-7', name: 'Тригонометрические уравнения и неравенства', count: 16 },
      { id: '10-8', name: 'Разные задачи', count: 6 }
    ]
  },
  '11': {
    id: '11',
    name: 'Текстовые задачи',
    subtopics: [
      { id: '11-1', name: 'Задачи на проценты, сплавы и смеси', count: 18 },
      { id: '11-2', name: 'Задачи на движение по прямой', count: 30 },
      { id: '11-3', name: 'Задачи на движение по окружности', count: 5 },
      { id: '11-4', name: 'Задачи на движение по воде', count: 15 },
      { id: '11-5', name: 'Задачи на совместную работу', count: 25 },
      { id: '11-6', name: 'Задачи на прогрессии', count: 9 }
    ]
  },
  '12': {
    id: '12',
    name: 'Исследование функций',
    subtopics: [
      { id: '12-1', name: 'Исследование функций без помощи производной', count: 17 },
      { id: '12-2', name: 'Исследование степенных и иррациональных функций', count: 62 },
      { id: '12-3', name: 'Исследование частных', count: 11 },
      { id: '12-4', name: 'Исследование произведений', count: 29 },
      { id: '12-5', name: 'Исследование показательных и логарифмических функций', count: 22 },
      { id: '12-6', name: 'Исследование тригонометрических функций', count: 29 }
    ]
  },
  '13': {
    id: '13',
    name: 'Уравнения (сложные)',
    subtopics: [
      { id: '13-1', name: 'Показательные уравнения', count: 12 },
      { id: '13-2', name: 'Рациональные уравнения', count: 5 },
      { id: '13-3', name: 'Иррациональные уравнения', count: 6 },
      { id: '13-4', name: 'Логарифмические уравнения', count: 10 },
      { id: '13-5', name: 'Тригонометрические уравнения, сводимые к квадратным', count: 65 },
      { id: '13-6', name: 'Тригонометрические уравнения, сводимые к однородным', count: 9 },
      { id: '13-7', name: 'Тригонометрические уравнения, разложение на множители', count: 59 },
      { id: '13-8', name: 'Тригонометрические уравнения, исследование ОДЗ', count: 46 },
      { id: '13-9', name: 'Тригонометрические уравнения, разные задачи', count: 55 },
      { id: '13-10', name: 'Тригонометрия и иррациональности', count: 49 },
      { id: '13-11', name: 'Тригонометрия и логарифмы', count: 36 },
      { id: '13-12', name: 'Тригонометрия и показательные выражения', count: 42 },
      { id: '13-13', name: 'Другие уравнения смешанного типа', count: 9 }
    ]
  },
  '14': {
    id: '14',
    name: 'Стереометрия (углы и расстояния)',
    subtopics: [
      { id: '14-1', name: 'Расстояние между прямыми и плоскостями', count: 45 },
      { id: '14-2', name: 'Расстояние от точки до прямой', count: 26 },
      { id: '14-3', name: 'Расстояние от точки до плоскости', count: 59 },
      { id: '14-4', name: 'Сечения пирамид', count: 74 },
      { id: '14-5', name: 'Сечения призм', count: 35 },
      { id: '14-6', name: 'Сечения параллелепипедов', count: 24 },
      { id: '14-7', name: 'Угол между плоскостями', count: 50 },
      { id: '14-8', name: 'Угол между плоскостями граней многогранника', count: 24 },
      { id: '14-9', name: 'Угол между прямой и плоскостью', count: 26 },
      { id: '14-10', name: 'Угол между скрещивающимися прямыми', count: 27 },
      { id: '14-11', name: 'Объёмы многогранников', count: 52 },
      { id: '14-12', name: 'Сечения круглых тел', count: 3 },
      { id: '14-13', name: 'Круглые тела: цилиндр, конус, шар', count: 33 },
      { id: '14-14', name: 'Комбинации фигур', count: 18 }
    ]
  },
  '15': {
    id: '15',
    name: 'Неравенства',
    subtopics: [
      { id: '15-1', name: 'Неравенства, содержащие радикалы', count: 14 },
      { id: '15-2', name: 'Рациональные неравенства', count: 47 },
      { id: '15-3', name: 'Показательные неравенства', count: 42 },
      { id: '15-4', name: 'Неравенства рациональные относительно показательной функции', count: 58 },
      { id: '15-5', name: 'Логарифмические неравенства первой и второй степени', count: 50 },
      { id: '15-6', name: 'Неравенства рациональные относительно логарифмической функции', count: 35 },
      { id: '15-7', name: 'Неравенства с логарифмами по переменному основанию', count: 62 },
      { id: '15-8', name: 'Неравенства с логарифмами по переменному основанию, применение рационализации', count: 35 },
      { id: '15-9', name: 'Логарифмические неравенства, разные задачи', count: 29 },
      { id: '15-10', name: 'Показательные выражения и иррациональности', count: 14 },
      { id: '15-11', name: 'Логарифмы и показательные выражения', count: 51 },
      { id: '15-12', name: 'Логарифмы и иррациональности', count: 15 },
      { id: '15-13', name: 'Неравенства с тригонометрией', count: 6 },
      { id: '15-14', name: 'Неравенства с модулем', count: 28 },
      { id: '15-15', name: 'Другие неравенства смешанного типа', count: 30 }
    ]
  },
  '16': {
    id: '16',
    name: 'Планиметрия (доказательства)',
    subtopics: [
      { id: '16-1', name: 'Треугольники и их свойства', count: 75 },
      { id: '16-2', name: 'Четырехугольники и их свойства', count: 71 },
      { id: '16-3', name: 'Окружности и системы окружностей', count: 48 },
      { id: '16-4', name: 'Вписанные окружности и треугольники', count: 36 },
      { id: '16-5', name: 'Описанные окружности и треугольники', count: 31 },
      { id: '16-6', name: 'Окружности и треугольники, разные задачи', count: 37 },
      { id: '16-7', name: 'Вписанные окружности и четырехугольники', count: 36 },
      { id: '16-8', name: 'Описанные окружности и четырехугольники', count: 15 },
      { id: '16-9', name: 'Окружности и четырехугольники, разные задачи', count: 31 },
      { id: '16-10', name: 'Разные задачи о многоугольниках', count: 10 }
    ]
  },
  '17': {
    id: '17',
    name: 'Финансовая математика',
    subtopics: [
      { id: '17-1', name: 'Вклады', count: 47 },
      { id: '17-2', name: 'Кредиты', count: 165 },
      { id: '17-3', name: 'Задачи на оптимальный выбор', count: 78 },
      { id: '17-4', name: 'Разные задачи', count: 18 }
    ]
  },
  '18': {
    id: '18',
    name: 'Задачи с параметром',
    subtopics: [
      { id: '18-1', name: 'Уравнения с параметром', count: 39 },
      { id: '18-2', name: 'Уравнения с параметром, содержащие модуль', count: 46 },
      { id: '18-3', name: 'Уравнения с параметром, содержащие радикалы', count: 38 },
      { id: '18-4', name: 'Неравенства с параметром', count: 15 },
      { id: '18-5', name: 'Системы с параметром', count: 76 },
      { id: '18-6', name: 'Расположение корней квадратного трехчлена', count: 17 },
      { id: '18-7', name: 'Использование симметрий', count: 29 },
      { id: '18-8', name: 'Использование монотонности, оценок', count: 40 },
      { id: '18-9', name: 'Аналитическое решение уравнений и неравенств', count: 64 },
      { id: '18-10', name: 'Аналитическое решение систем', count: 32 },
      { id: '18-11', name: 'Координаты (x, a)', count: 15 },
      { id: '18-12', name: 'Уравнение окружности', count: 49 },
      { id: '18-13', name: 'Расстояние между точками', count: 7 },
      { id: '18-14', name: 'Функции, зависящие от параметра', count: 38 }
    ]
  }
};

export default function TaskPage() {
  const params = useParams();
  const taskId = params.id as string;
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>({});
  
  const task = taskData[taskId];
  
  if (!task) {
    return (
      <div style={{ 
        fontFamily: 'system-ui, sans-serif',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#FAFAF7',
        minHeight: '100vh'
      }}>
        <h1>Задание не найдено</h1>
        <Link href="/" style={{ color: '#4F7FE6', textDecoration: 'none' }}>← Вернуться на главную</Link>
      </div>
    );
  }

  const updateCount = (subtopicId: string, delta: number) => {
    setSelectedCounts(prev => ({
      ...prev,
      [subtopicId]: Math.max(0, (prev[subtopicId] || 0) + delta)
    }));
  };

  const getTotalSelected = () => {
    return Object.values(selectedCounts).reduce((sum, count) => sum + count, 0);
  };

  const paperGrainCSS = `
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3CfeColorMatrix in='turbulence' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
  `;

  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif',
      margin: 0,
      padding: 0,
      backgroundColor: '#FAFAF7',
      minHeight: '100vh',
      background: `#FAFAF7 ${paperGrainCSS}`
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '80px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #4F7FE6 0%, #3F6FD6 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)'
              }}>
                <span style={{ color: 'white', fontSize: '20px' }}>🎓</span>
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#2CD0AA',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '10px' }}>💬</span>
                </div>
              </div>
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#222A35',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  AcademGrad
                </h1>
                <p style={{ 
                  margin: 0, 
                  fontSize: '12px', 
                  color: '#6b7280',
                  fontFamily: 'Comic Neue, cursive'
                }}>
                  твой ИИ-наставник
                </p>
              </div>
            </Link>
          </div>
          
          <Link href="/" style={{ 
            color: '#4F7FE6',
            textDecoration: 'none',
            fontWeight: '600',
            padding: '8px 16px',
            borderRadius: '20px',
            transition: 'all 0.3s ease'
          }}>
            ← Назад к заданиям
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          border: '2px solid rgba(79, 127, 230, 0.1)',
          padding: '40px',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#222A35',
            marginBottom: '16px',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            №{task.id}. {task.name}
          </h1>
          
          {task.subtopics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>🌱</div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '16px',
                fontFamily: 'Comic Neue, cursive'
              }}>
                Скоро здесь появятся подтемы!
              </h2>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>
                Пока что этот раздел находится в разработке
              </p>
            </div>
          ) : (
            <>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                marginBottom: '32px',
                fontFamily: 'Manrope, system-ui, sans-serif'
              }}>
                Выберите подтемы и количество заданий для практики ✨
              </p>

              {/* Subtopics List */}
              <div style={{ marginBottom: '32px' }}>
                {task.subtopics.map((subtopic, index) => (
                  <div key={subtopic.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 0',
                    borderBottom: index < task.subtopics.length - 1 ? '1px solid rgba(79, 127, 230, 0.1)' : 'none'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#222A35',
                        margin: '0 0 4px 0',
                        fontFamily: 'Inter, system-ui, sans-serif'
                      }}>
                        {subtopic.name}
                      </h3>
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: 0,
                        fontFamily: 'Comic Neue, cursive'
                      }}>
                        {subtopic.count} шт.
                      </p>
                    </div>
                    
                    {/* Counter Controls */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <button
                        onClick={() => updateCount(subtopic.id, -1)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '2px solid #4F7FE6',
                          backgroundColor: 'white',
                          color: '#4F7FE6',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#4F7FE6';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.color = '#4F7FE6';
                        }}
                      >
                        −
                      </button>
                      
                      <span style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#222A35',
                        minWidth: '24px',
                        textAlign: 'center'
                      }}>
                        {selectedCounts[subtopic.id] || 0}
                      </span>
                      
                      <button
                        onClick={() => updateCount(subtopic.id, 1)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '2px solid #4F7FE6',
                          backgroundColor: 'white',
                          color: '#4F7FE6',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#4F7FE6';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.color = '#4F7FE6';
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              {getTotalSelected() > 0 && (
                <div style={{
                  backgroundColor: 'rgba(79, 127, 230, 0.1)',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '24px',
                  border: '2px solid rgba(79, 127, 230, 0.2)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#4F7FE6',
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}>
                      Выбрано заданий: {getTotalSelected()}
                    </span>
                    <span style={{
                      fontSize: '14px',
                      color: '#4F7FE6',
                      fontFamily: 'Comic Neue, cursive'
                    }}>
                      ⏱️ ~{Math.ceil(getTotalSelected() * 3)} мин
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('taskId', task.id);
                      params.set('subtopics', JSON.stringify(selectedCounts));
                      window.location.href = `/solve?${params.toString()}`;
                    }}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: '#4F7FE6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#3F6FD6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#4F7FE6';
                    }}
                  >
                    🚀 Начать решать
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
