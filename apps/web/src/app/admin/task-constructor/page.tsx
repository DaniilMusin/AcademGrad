'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Task {
  id: string;
  topicId: string;
  subtopicId: string;
  title: string;
  statement: string;
  solution: string;
  difficulty: number;
  points: number;
  tags: string[];
}

interface SubTopic {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
  subtopics: SubTopic[];
}

// Функция для автоматического определения баллов по номеру задания ЕГЭ
const getPointsByTopicId = (topicId: string): number => {
  const pointsMap: Record<string, number> = {
    '1': 1,   // Простейшие текстовые задачи
    '2': 1,   // Чтение графиков и диаграмм
    '3': 1,   // Планиметрия
    '4': 1,   // Теория вероятностей
    '5': 1,   // Простейшие уравнения
    '6': 1,   // Планиметрия (углы)
    '7': 1,   // Производная
    '8': 1,   // Стереометрия
    '9': 1,   // Вычисления
    '10': 1,  // Прикладные задачи
    '11': 1,  // Графики функций
    '11a': 2, // Текстовые задачи
    '12': 2,  // Исследование функций
    '13': 2,  // Уравнения (сложные)
    '14': 2,  // Стереометрия (углы и расстояния)
    '15': 2,  // Неравенства
    '16': 3,  // Планиметрия (доказательства)
    '17': 3,  // Финансовая математика
    '18': 4,  // Задачи с параметром
    '19': 4   // Числа и их свойства
  };
  return pointsMap[topicId] || 1;
};

const topics: Topic[] = [
  {
    id: '1',
    name: 'Простейшие текстовые задачи',
    subtopics: [
      { id: '1-1', name: 'Решение прямоугольного треугольника' },
      { id: '1-2', name: 'Решение равнобедренного треугольника' },
      { id: '1-3', name: 'Треугольники общего вида' },
      { id: '1-4', name: 'Параллелограммы' },
      { id: '1-5', name: 'Трапеция' },
      { id: '1-6', name: 'Центральные и вписанные углы' },
      { id: '1-7', name: 'Касательная, хорда, секущая' },
      { id: '1-8', name: 'Вписанные окружности' },
      { id: '1-9', name: 'Описанные окружности' }
    ]
  },
  {
    id: '2',
    name: 'Чтение графиков и диаграмм',
    subtopics: [
      { id: '2-1', name: 'Векторы и операции с ними' }
    ]
  },
  {
    id: '3',
    name: 'Планиметрия',
    subtopics: [
      { id: '3-1', name: 'Решение прямоугольного треугольника' },
      { id: '3-2', name: 'Решение равнобедренного треугольника' },
      { id: '3-3', name: 'Треугольники общего вида' },
      { id: '3-4', name: 'Параллелограммы' },
      { id: '3-5', name: 'Трапеция' },
      { id: '3-6', name: 'Центральные и вписанные углы' },
      { id: '3-7', name: 'Касательная, хорда, секущая' },
      { id: '3-8', name: 'Вписанные окружности' },
      { id: '3-9', name: 'Описанные окружности' }
    ]
  },
  {
    id: '4',
    name: 'Теория вероятностей',
    subtopics: [
      { id: '4-1', name: 'Классическое определение вероятности' }
    ]
  },
  {
    id: '5',
    name: 'Простейшие уравнения',
    subtopics: [
      { id: '5-1', name: 'Линейные, квадратные, кубические уравнения' },
      { id: '5-2', name: 'Рациональные уравнения' },
      { id: '5-3', name: 'Иррациональные уравнения' },
      { id: '5-4', name: 'Показательные уравнения' },
      { id: '5-5', name: 'Логарифмические уравнения' },
      { id: '5-6', name: 'Тригонометрические уравнения' }
    ]
  },
  {
    id: '6',
    name: 'Планиметрия (углы)',
    subtopics: [
      { id: '6-1', name: 'Линейные, квадратные, кубические уравнения' },
      { id: '6-2', name: 'Рациональные уравнения' },
      { id: '6-3', name: 'Иррациональные уравнения' },
      { id: '6-4', name: 'Показательные уравнения' },
      { id: '6-5', name: 'Логарифмические уравнения' },
      { id: '6-6', name: 'Тригонометрические уравнения' }
    ]
  },
  {
    id: '7',
    name: 'Производная',
    subtopics: [
      { id: '7-1', name: 'Физический смысл производной' },
      { id: '7-2', name: 'Геометрический смысл производной, касательная' },
      { id: '7-3', name: 'Применение производной к исследованию функций' },
      { id: '7-4', name: 'Первообразная' }
    ]
  },
  {
    id: '8',
    name: 'Стереометрия',
    subtopics: [
      { id: '8-1', name: 'Куб' },
      { id: '8-2', name: 'Прямоугольный параллелепипед' },
      { id: '8-3', name: 'Элементы составных многогранников' },
      { id: '8-4', name: 'Площадь поверхности составного многогранника' },
      { id: '8-5', name: 'Объем составного многогранника' },
      { id: '8-6', name: 'Призма' },
      { id: '8-7', name: 'Пирамида' },
      { id: '8-8', name: 'Комбинации тел' },
      { id: '8-9', name: 'Цилиндр' },
      { id: '8-10', name: 'Конус' },
      { id: '8-11', name: 'Шар' }
    ]
  },
  {
    id: '9',
    name: 'Вычисления',
    subtopics: [
      { id: '9-1', name: 'Преобразования числовых рациональных выражений' },
      { id: '9-2', name: 'Преобразования алгебраических выражений и дробей' },
      { id: '9-3', name: 'Вычисление значений степенных выражений' },
      { id: '9-4', name: 'Действия со степенями' },
      { id: '9-5', name: 'Преобразования числовых иррациональных выражений' },
      { id: '9-6', name: 'Преобразования буквенных иррациональных выражений' },
      { id: '9-7', name: 'Преобразования числовых логарифмических выражений' },
      { id: '9-8', name: 'Преобразования буквенных логарифмических выражений' },
      { id: '9-9', name: 'Вычисление значений тригонометрических выражений' },
      { id: '9-10', name: 'Преобразования числовых тригонометрических выражений' },
      { id: '9-11', name: 'Преобразования буквенных тригонометрических выражений' }
    ]
  },
  {
    id: '10',
    name: 'Прикладные задачи',
    subtopics: [
      { id: '10-1', name: 'Линейные уравнения и неравенства' },
      { id: '10-2', name: 'Квадратные и степенные уравнения и неравенства' },
      { id: '10-3', name: 'Рациональные уравнения и неравенства' },
      { id: '10-4', name: 'Иррациональные уравнения и неравенства' },
      { id: '10-5', name: 'Показательные уравнения и неравенства' },
      { id: '10-6', name: 'Логарифмические уравнения и неравенства' },
      { id: '10-7', name: 'Тригонометрические уравнения и неравенства' },
      { id: '10-8', name: 'Разные задачи' }
    ]
  },
  {
    id: '11',
    name: 'Графики функций',
    subtopics: [
      { id: '11-1', name: 'Линейные функции' },
      { id: '11-2', name: 'Параболы' },
      { id: '11-3', name: 'Гиперболы' },
      { id: '11-4', name: 'Корни' },
      { id: '11-5', name: 'Показательные и логарифмические функции' },
      { id: '11-6', name: 'Тригонометрические функции' },
      { id: '11-7', name: 'Комбинированные задачи' }
    ]
  },
  {
    id: '11a',
    name: 'Текстовые задачи',
    subtopics: [
      { id: '11a-1', name: 'Задачи на проценты, сплавы и смеси' },
      { id: '11a-2', name: 'Задачи на движение по прямой' },
      { id: '11a-3', name: 'Задачи на движение по окружности' },
      { id: '11a-4', name: 'Задачи на движение по воде' },
      { id: '11a-5', name: 'Задачи на совместную работу' },
      { id: '11a-6', name: 'Задачи на прогрессии' }
    ]
  },
  {
    id: '12',
    name: 'Исследование функций',
    subtopics: [
      { id: '12-1', name: 'Исследование функций без помощи производной' },
      { id: '12-2', name: 'Исследование степенных и иррациональных функций' },
      { id: '12-3', name: 'Исследование частных' },
      { id: '12-4', name: 'Исследование произведений' },
      { id: '12-5', name: 'Исследование показательных и логарифмических функций' },
      { id: '12-6', name: 'Исследование тригонометрических функций' }
    ]
  },
  {
    id: '13',
    name: 'Уравнения (сложные)',
    subtopics: [
      { id: '13-1', name: 'Показательные уравнения' },
      { id: '13-2', name: 'Рациональные уравнения' },
      { id: '13-3', name: 'Иррациональные уравнения' },
      { id: '13-4', name: 'Логарифмические уравнения' },
      { id: '13-5', name: 'Тригонометрические уравнения, сводимые к квадратным' },
      { id: '13-6', name: 'Тригонометрические уравнения, сводимые к однородным' },
      { id: '13-7', name: 'Тригонометрические уравнения, разложение на множители' },
      { id: '13-8', name: 'Тригонометрические уравнения, исследование ОДЗ' },
      { id: '13-9', name: 'Тригонометрические уравнения, разные задачи' },
      { id: '13-10', name: 'Тригонометрия и иррациональности' },
      { id: '13-11', name: 'Тригонометрия и логарифмы' },
      { id: '13-12', name: 'Тригонометрия и показательные выражения' },
      { id: '13-13', name: 'Другие уравнения смешанного типа' }
    ]
  },
  {
    id: '14',
    name: 'Стереометрия (углы и расстояния)',
    subtopics: [
      { id: '14-1', name: 'Расстояние между прямыми и плоскостями' },
      { id: '14-2', name: 'Расстояние от точки до прямой' },
      { id: '14-3', name: 'Расстояние от точки до плоскости' },
      { id: '14-4', name: 'Сечения пирамид' },
      { id: '14-5', name: 'Сечения призм' },
      { id: '14-6', name: 'Сечения параллелепипедов' },
      { id: '14-7', name: 'Угол между плоскостями' },
      { id: '14-8', name: 'Угол между плоскостями граней многогранника' },
      { id: '14-9', name: 'Угол между прямой и плоскостью' },
      { id: '14-10', name: 'Угол между скрещивающимися прямыми' },
      { id: '14-11', name: 'Объёмы многогранников' },
      { id: '14-12', name: 'Сечения круглых тел' },
      { id: '14-13', name: 'Круглые тела: цилиндр, конус, шар' },
      { id: '14-14', name: 'Комбинации фигур' }
    ]
  },
  {
    id: '15',
    name: 'Неравенства',
    subtopics: [
      { id: '15-1', name: 'Неравенства, содержащие радикалы' },
      { id: '15-2', name: 'Рациональные неравенства' },
      { id: '15-3', name: 'Показательные неравенства' },
      { id: '15-4', name: 'Неравенства рациональные относительно показательной функции' },
      { id: '15-5', name: 'Логарифмические неравенства первой и второй степени' },
      { id: '15-6', name: 'Неравенства рациональные относительно логарифмической функции' },
      { id: '15-7', name: 'Неравенства с логарифмами по переменному основанию' },
      { id: '15-8', name: 'Неравенства с логарифмами по переменному основанию, применение рационализации' },
      { id: '15-9', name: 'Логарифмические неравенства, разные задачи' },
      { id: '15-10', name: 'Показательные выражения и иррациональности' },
      { id: '15-11', name: 'Логарифмы и показательные выражения' },
      { id: '15-12', name: 'Логарифмы и иррациональности' },
      { id: '15-13', name: 'Неравенства с тригонометрией' },
      { id: '15-14', name: 'Неравенства с модулем' },
      { id: '15-15', name: 'Другие неравенства смешанного типа' }
    ]
  },
  {
    id: '16',
    name: 'Планиметрия (доказательства)',
    subtopics: [
      { id: '16-1', name: 'Треугольники и их свойства' },
      { id: '16-2', name: 'Четырехугольники и их свойства' },
      { id: '16-3', name: 'Окружности и системы окружностей' },
      { id: '16-4', name: 'Вписанные окружности и треугольники' },
      { id: '16-5', name: 'Описанные окружности и треугольники' },
      { id: '16-6', name: 'Окружности и треугольники, разные задачи' },
      { id: '16-7', name: 'Вписанные окружности и четырехугольники' },
      { id: '16-8', name: 'Описанные окружности и четырехугольники' },
      { id: '16-9', name: 'Окружности и четырехугольники, разные задачи' },
      { id: '16-10', name: 'Разные задачи о многоугольниках' }
    ]
  },
  {
    id: '17',
    name: 'Финансовая математика',
    subtopics: [
      { id: '17-1', name: 'Вклады' },
      { id: '17-2', name: 'Кредиты' },
      { id: '17-3', name: 'Задачи на оптимальный выбор' },
      { id: '17-4', name: 'Разные задачи' }
    ]
  },
  {
    id: '18',
    name: 'Задачи с параметром',
    subtopics: [
      { id: '18-1', name: 'Уравнения с параметром' },
      { id: '18-2', name: 'Уравнения с параметром, содержащие модуль' },
      { id: '18-3', name: 'Уравнения с параметром, содержащие радикалы' },
      { id: '18-4', name: 'Неравенства с параметром' },
      { id: '18-5', name: 'Системы с параметром' },
      { id: '18-6', name: 'Расположение корней квадратного трехчлена' },
      { id: '18-7', name: 'Использование симметрий' },
      { id: '18-8', name: 'Использование монотонности, оценок' },
      { id: '18-9', name: 'Аналитическое решение уравнений и неравенств' },
      { id: '18-10', name: 'Аналитическое решение систем' },
      { id: '18-11', name: 'Координаты (x, a)' },
      { id: '18-12', name: 'Уравнение окружности' },
      { id: '18-13', name: 'Расстояние между точками' },
      { id: '18-14', name: 'Функции, зависящие от параметра' }
    ]
  },
  {
    id: '19',
    name: 'Числа и их свойства',
    subtopics: [
      { id: '19-1', name: 'Числа и их свойства' },
      { id: '19-2', name: 'Числовые наборы на карточках и досках' },
      { id: '19-3', name: 'Последовательности и прогрессии' },
      { id: '19-4', name: 'Сюжетные задачи: кино, театр, мотки верёвки' }
    ]
  }
];

export default function TaskConstructor() {
  const [task, setTask] = useState<Partial<Task>>({
    topicId: '',
    subtopicId: '',
    title: '',
    statement: '',
    solution: '',
    difficulty: 1,
    points: getPointsByTopicId(''),
    tags: []
  });

  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState(false);

  const selectedTopic = topics.find(t => t.id === task.topicId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Здесь будет логика сохранения задания
    console.log('Создание задания:', task);
    alert('Задание создано! (В реальном приложении здесь будет сохранение в базу данных)');
    
    // Сброс формы
    setTask({
      topicId: '',
      subtopicId: '',
      title: '',
      statement: '',
      solution: '',
      difficulty: 1,
      points: getPointsByTopicId(''),
      tags: []
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !task.tags?.includes(tagInput.trim())) {
      setTask(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTask(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
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
                  <span style={{ color: 'white', fontSize: '10px' }}>🔧</span>
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
                  Конструктор заданий
                </h1>
                <p style={{ 
                  margin: 0, 
                  fontSize: '12px', 
                  color: '#6b7280',
                  fontFamily: 'Comic Neue, cursive'
                }}>
                  создание заданий с LaTeX
                </p>
              </div>
            </Link>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              onClick={() => setPreview(!preview)}
              style={{ 
                color: preview ? '#4F7FE6' : '#6b7280',
                textDecoration: 'none',
                fontWeight: '600',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '20px',
                transition: 'all 0.3s ease'
              }}
            >
              {preview ? '📝 Редактор' : '👁️ Предпросмотр'}
            </button>
            <Link href="/" style={{ 
              color: '#6b7280',
              textDecoration: 'none',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '20px',
              transition: 'all 0.3s ease'
            }}>
              ← На главную
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: preview ? '1fr 1fr' : '1fr', gap: '32px' }}>
          
          {/* Form */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            border: '2px solid rgba(79, 127, 230, 0.1)',
            padding: '40px'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#222A35',
              marginBottom: '32px',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              Создать новое задание
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Topic Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#222A35',
                  marginBottom: '8px',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  Тема ЕГЭ
                </label>
                <select
                  value={task.topicId || ''}
                  onChange={(e) => {
                    const newTopicId = e.target.value;
                    setTask(prev => ({ 
                      ...prev, 
                      topicId: newTopicId, 
                      subtopicId: '', 
                      points: getPointsByTopicId(newTopicId) 
                    }));
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid rgba(79, 127, 230, 0.2)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}
                  required
                >
                  <option value="">Выберите тему</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      №{topic.id}. {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtopic Selection */}
              {selectedTopic && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#222A35',
                    marginBottom: '8px',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}>
                    Подтема
                  </label>
                  <select
                    value={task.subtopicId || ''}
                    onChange={(e) => setTask(prev => ({ ...prev, subtopicId: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid rgba(79, 127, 230, 0.2)',
                      borderRadius: '12px',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}
                    required
                  >
                    <option value="">Выберите подтему</option>
                    {selectedTopic.subtopics.map(subtopic => (
                      <option key={subtopic.id} value={subtopic.id}>
                        {subtopic.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#222A35',
                  marginBottom: '8px',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  Название задания
                </label>
                <input
                  type="text"
                  value={task.title || ''}
                  onChange={(e) => setTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Например: Найти площадь треугольника"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid rgba(79, 127, 230, 0.2)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}
                  required
                />
              </div>

              {/* Statement */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#222A35',
                  marginBottom: '8px',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  Условие задачи (LaTeX поддерживается)
                </label>
                <textarea
                  value={task.statement || ''}
                  onChange={(e) => setTask(prev => ({ ...prev, statement: e.target.value }))}
                  placeholder={`Введите условие задачи. Используйте LaTeX для формул:
Например: В треугольнике ABC известно, что $AB = 6$, $BC = 8$, угол $\\angle ABC = 90°$. Найдите площадь треугольника.`}
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid rgba(79, 127, 230, 0.2)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    fontFamily: 'Consolas, Monaco, monospace',
                    resize: 'vertical'
                  }}
                  required
                />
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '8px',
                  fontFamily: 'Comic Neue, cursive'
                }}>
                  💡 Используйте $...$ для inline формул и $$...$$ для блочных формул
                </p>
              </div>

              {/* Solution */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#222A35',
                  marginBottom: '8px',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  Решение (LaTeX поддерживается)
                </label>
                <textarea
                  value={task.solution || ''}
                  onChange={(e) => setTask(prev => ({ ...prev, solution: e.target.value }))}
                  placeholder={`Введите подробное решение:
Например: 
Дано: прямоугольный треугольник ABC, $AB = 6$, $BC = 8$, $\\angle ABC = 90°$

Решение:
Площадь прямоугольного треугольника вычисляется по формуле:
$$S = \\frac{1}{2} \\cdot a \\cdot b$$
где $a$ и $b$ — катеты треугольника.

$$S = \\frac{1}{2} \\cdot AB \\cdot BC = \\frac{1}{2} \\cdot 6 \\cdot 8 = 24$$

Ответ: $S = 24$`}
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid rgba(79, 127, 230, 0.2)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    fontFamily: 'Consolas, Monaco, monospace',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              {/* Difficulty and Points */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#222A35',
                    marginBottom: '8px',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}>
                    Сложность
                  </label>
                  <select
                    value={task.difficulty || 1}
                    onChange={(e) => setTask(prev => ({ ...prev, difficulty: parseInt(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid rgba(79, 127, 230, 0.2)',
                      borderRadius: '12px',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}
                  >
                    <option value={1}>★☆☆☆☆ Легкая</option>
                    <option value={2}>★★☆☆☆ Средняя</option>
                    <option value={3}>★★★☆☆ Выше средней</option>
                    <option value={4}>★★★★☆ Сложная</option>
                    <option value={5}>★★★★★ Очень сложная</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#222A35',
                    marginBottom: '8px',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}>
                    Баллы ЕГЭ {task.topicId && (
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '400',
                        color: '#6b7280',
                        fontFamily: 'Comic Neue, cursive'
                      }}>
                        (автоматически: {getPointsByTopicId(task.topicId || '')})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={task.points || 1}
                    onChange={(e) => setTask(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid rgba(79, 127, 230, 0.2)',
                      borderRadius: '12px',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}
                  />
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '8px',
                    fontFamily: 'Comic Neue, cursive'
                  }}>
                    💡 Баллы автоматически определяются по номеру задания, но можно изменить вручную
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#222A35',
                  marginBottom: '8px',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  Теги
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Введите тег и нажмите Enter"
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '2px solid rgba(79, 127, 230, 0.2)',
                      borderRadius: '12px',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#4F7FE6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}
                  >
                    Добавить
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {task.tags?.map(tag => (
                    <span
                      key={tag}
                      style={{
                        backgroundColor: 'rgba(79, 127, 230, 0.1)',
                        color: '#4F7FE6',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontFamily: 'Inter, system-ui, sans-serif'
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#4F7FE6',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#4F7FE6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
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
                🚀 Создать задание
              </button>
            </form>
          </div>

          {/* Preview */}
          {preview && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
              border: '2px solid rgba(79, 127, 230, 0.1)',
              padding: '40px'
            }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#222A35',
                marginBottom: '24px',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}>
                Предпросмотр задания
              </h3>

              {task.title && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#222A35',
                    marginBottom: '8px',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}>
                    {task.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{
                      backgroundColor: 'rgba(79, 127, 230, 0.1)',
                      color: '#4F7FE6',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}>
                      {'★'.repeat(task.difficulty || 1)}{'☆'.repeat(5 - (task.difficulty || 1))}
                    </span>
                    <span style={{
                      backgroundColor: 'rgba(255, 181, 71, 0.2)',
                      color: '#B45309',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}>
                      {task.points || 1} балл{(task.points || 1) > 1 ? (task.points === 2 || task.points === 3 || task.points === 4 ? 'а' : 'ов') : ''}
                    </span>
                  </div>
                </div>
              )}

              {task.statement && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid rgba(79, 127, 230, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <h5 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#222A35',
                    marginBottom: '12px',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}>
                    Условие:
                  </h5>
                  <div style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#374151',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {task.statement}
                  </div>
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '12px',
                    fontStyle: 'italic',
                    fontFamily: 'Comic Neue, cursive'
                  }}>
                    💡 LaTeX формулы будут отрендерены на сайте
                  </p>
                </div>
              )}

              {task.solution && (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid rgba(79, 127, 230, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <h5 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#222A35',
                    marginBottom: '12px',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}>
                    Решение:
                  </h5>
                  <div style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#374151',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {task.solution}
                  </div>
                </div>
              )}

              {task.tags && task.tags.length > 0 && (
                <div>
                  <h5 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#222A35',
                    marginBottom: '12px',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}>
                    Теги:
                  </h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {task.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          backgroundColor: 'rgba(79, 127, 230, 0.1)',
                          color: '#4F7FE6',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '14px',
                          fontWeight: '500',
                          fontFamily: 'Inter, system-ui, sans-serif'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}