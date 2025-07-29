'use client';

import { useState } from 'react';

export default function WarmDesign() {
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('math');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>({});

  const subjects = [
    { id: 'math', name: 'Математика (профиль)', topics: 18 },
    { id: 'physics', name: 'Физика', topics: 5 },
    { id: 'chemistry', name: 'Химия', topics: 4 }
  ];

  const mathTopics = [
    { 
      id: '1', 
      name: 'Простейшие текстовые задачи', 
      count: 25, 
      difficulty: 1, 
      topic: 'Арифметика',
      subtopics: [
        { id: '1-1', name: 'Решение прямоугольного треугольника', count: 50 },
        { id: '1-2', name: 'Решение равнобедренного треугольника', count: 49 },
        { id: '1-3', name: 'Треугольники общего вида', count: 30 },
        { id: '1-4', name: 'Параллелограммы', count: 35 },
        { id: '1-5', name: 'Трапеция', count: 27 },
        { id: '1-6', name: 'Центральные и вписанные углы', count: 16 },
        { id: '1-7', name: 'Касательная, хорда, секущая', count: 11 },
        { id: '1-8', name: 'Вписанные окружности', count: 25 },
        { id: '1-9', name: 'Описанные окружности', count: 30 }
      ]
    },
    { 
      id: '2', 
      name: 'Чтение графиков и диаграмм', 
      count: 30, 
      difficulty: 2, 
      topic: 'Анализ данных',
      subtopics: [
        { id: '2-1', name: 'Векторы и операции с ними', count: 58 }
      ]
    },
    { 
      id: '3', 
      name: 'Планиметрия', 
      count: 40, 
      difficulty: 2, 
      topic: 'Геометрия',
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
    { 
      id: '4', 
      name: 'Теория вероятностей', 
      count: 35, 
      difficulty: 3, 
      topic: 'Вероятность',
      subtopics: [
        { id: '4-1', name: 'Классическое определение вероятности', count: 60 }
      ]
    },
    { 
      id: '5', 
      name: 'Простейшие уравнения', 
      count: 50, 
      difficulty: 2, 
      topic: 'Алгебра',
      subtopics: [
        { id: '5-1', name: 'Линейные, квадратные, кубические уравнения', count: 9 },
        { id: '5-2', name: 'Рациональные уравнения', count: 10 },
        { id: '5-3', name: 'Иррациональные уравнения', count: 16 },
        { id: '5-4', name: 'Показательные уравнения', count: 18 },
        { id: '5-5', name: 'Логарифмические уравнения', count: 14 },
        { id: '5-6', name: 'Тригонометрические уравнения', count: 3 }
      ]
    },
    { 
      id: '6', 
      name: 'Планиметрия (углы)', 
      count: 45, 
      difficulty: 3, 
      topic: 'Геометрия',
      subtopics: [
        { id: '6-1', name: 'Линейные, квадратные, кубические уравнения', count: 9 },
        { id: '6-2', name: 'Рациональные уравнения', count: 10 },
        { id: '6-3', name: 'Иррациональные уравнения', count: 16 },
        { id: '6-4', name: 'Показательные уравнения', count: 18 },
        { id: '6-5', name: 'Логарифмические уравнения', count: 14 },
        { id: '6-6', name: 'Тригонометрические уравнения', count: 3 }
      ]
    },
    { 
      id: '7', 
      name: 'Производная', 
      count: 40, 
      difficulty: 4, 
      topic: 'Анализ',
      subtopics: [
        { id: '7-1', name: 'Физический смысл производной', count: 6 },
        { id: '7-2', name: 'Геометрический смысл производной, касательная', count: 31 },
        { id: '7-3', name: 'Применение производной к исследованию функций', count: 39 },
        { id: '7-4', name: 'Первообразная', count: 5 }
      ]
    },
    { 
      id: '8', 
      name: 'Стереометрия', 
      count: 35, 
      difficulty: 4, 
      topic: 'Геометрия',
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
    { 
      id: '9', 
      name: 'Вычисления', 
      count: 60, 
      difficulty: 3, 
      topic: 'Алгебра',
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
    { 
      id: '10', 
      name: 'Прикладные задачи', 
      count: 30, 
      difficulty: 3, 
      topic: 'Моделирование',
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
    { 
      id: '11', 
      name: 'Графики функций', 
      count: 25, 
      difficulty: 3, 
      topic: 'Функции',
      subtopics: [
        { id: '11-1', name: 'Линейные функции', count: 5 },
        { id: '11-2', name: 'Параболы', count: 8 },
        { id: '11-3', name: 'Гиперболы', count: 7 },
        { id: '11-4', name: 'Корни', count: 2 },
        { id: '11-5', name: 'Показательные и логарифмические функции', count: 11 },
        { id: '11-6', name: 'Тригонометрические функции', count: 8 },
        { id: '11-7', name: 'Комбинированные задачи', count: 9 }
      ]
    },
    { 
      id: '11a', 
      name: 'Текстовые задачи', 
      count: 45, 
      difficulty: 4, 
      topic: 'Задачи',
      subtopics: [
        { id: '11a-1', name: 'Задачи на проценты, сплавы и смеси', count: 18 },
        { id: '11a-2', name: 'Задачи на движение по прямой', count: 30 },
        { id: '11a-3', name: 'Задачи на движение по окружности', count: 5 },
        { id: '11a-4', name: 'Задачи на движение по воде', count: 15 },
        { id: '11a-5', name: 'Задачи на совместную работу', count: 25 },
        { id: '11a-6', name: 'Задачи на прогрессии', count: 9 }
      ]
    },
    { 
      id: '12', 
      name: 'Исследование функций', 
      count: 40, 
      difficulty: 4, 
      topic: 'Анализ',
      subtopics: [
        { id: '12-1', name: 'Исследование функций без помощи производной', count: 17 },
        { id: '12-2', name: 'Исследование степенных и иррациональных функций', count: 62 },
        { id: '12-3', name: 'Исследование частных', count: 11 },
        { id: '12-4', name: 'Исследование произведений', count: 29 },
        { id: '12-5', name: 'Исследование показательных и логарифмических функций', count: 22 },
        { id: '12-6', name: 'Исследование тригонометрических функций', count: 29 }
      ]
    },
    { 
      id: '13', 
      name: 'Уравнения (сложные)', 
      count: 35, 
      difficulty: 5, 
      topic: 'Алгебра',
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
    { 
      id: '14', 
      name: 'Стереометрия (углы)', 
      count: 30, 
      difficulty: 5, 
      topic: 'Геометрия',
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
    { 
      id: '15', 
      name: 'Неравенства', 
      count: 40, 
      difficulty: 5, 
      topic: 'Алгебра',
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
    { 
      id: '16', 
      name: 'Планиметрия (доказательства)', 
      count: 25, 
      difficulty: 5, 
      topic: 'Геометрия',
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
    { 
      id: '17', 
      name: 'Финансовая математика', 
      count: 20, 
      difficulty: 4, 
      topic: 'Экономика',
      subtopics: [
        { id: '17-1', name: 'Вклады', count: 47 },
        { id: '17-2', name: 'Кредиты', count: 165 },
        { id: '17-3', name: 'Задачи на оптимальный выбор', count: 78 },
        { id: '17-4', name: 'Разные задачи', count: 18 }
      ]
    },
    { 
      id: '18', 
      name: 'Задачи с параметром', 
      count: 15, 
      difficulty: 5, 
      topic: 'Алгебра',
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
    },
    { 
      id: '19', 
      name: 'Числа и их свойства', 
      count: 45, 
      difficulty: 5, 
      topic: 'Теория чисел',
      subtopics: [
        { id: '19-1', name: 'Числа и их свойства', count: 196 },
        { id: '19-2', name: 'Числовые наборы на карточках и досках', count: 66 },
        { id: '19-3', name: 'Последовательности и прогрессии', count: 62 },
        { id: '19-4', name: 'Сюжетные задачи: кино, театр, мотки верёвки', count: 99 }
      ]
    }
  ];

  const getDifficultyStars = (difficulty: number) => {
    return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  };

  const updateCount = (subtopicId: string, delta: number) => {
    setSelectedCounts(prev => ({
      ...prev,
      [subtopicId]: Math.max(0, (prev[subtopicId] || 0) + delta)
    }));
  };

  const getTotalSelected = () => {
    return Object.values(selectedCounts).reduce((sum, count) => sum + count, 0);
  };

  const handleTaskClick = (taskId: string) => {
    const task = mathTopics.find(t => t.id === taskId);
    if (task && task.subtopics.length > 0) {
      setSelectedTask(selectedTask === taskId ? null : taskId);
      if (selectedTask !== taskId) {
        setSelectedCounts({});
      }
    } else {
      // Если у задания нет подтем, сразу переходим к решению
      window.location.href = `/tasks/${taskId}`;
    }
  };

  const handleStartSolving = (taskId: string) => {
    const selectedSubtopics = Object.entries(selectedCounts)
      .filter(([_, count]) => count > 0)
      .map(([subtopicId, count]) => `${subtopicId}:${count}`)
      .join(',');
    
    if (selectedSubtopics) {
      // Перенаправляем на страницу решения с выбранными подтемами
      window.location.href = `/solve?task=${taskId}&subtopics=${selectedSubtopics}`;
    } else {
      // Если ничего не выбрано, показываем случайное задание из этой темы
      window.location.href = `/tasks/${taskId}`;
    }
  };

  // Создаем красивый фон с градиентом и геометрическими элементами
  const backgroundStyle = {
    background: `
      linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%),
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 177, 153, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 218, 195, 0.2) 0%, transparent 50%)
    `,
    backgroundSize: '100% 100%, 800px 800px, 600px 600px, 400px 400px',
    backgroundRepeat: 'no-repeat',
    position: 'relative' as const
  };

  const paperGrainCSS = `
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3CfeColorMatrix in='turbulence' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
  `;

  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif',
      margin: 0,
      padding: 0,
      minHeight: '100vh',
      ...backgroundStyle
    }}>
      {/* Добавляем декоративные геометрические элементы */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '200px',
        height: '200px',
        background: 'rgba(79, 127, 230, 0.1)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '60%',
        right: '10%',
        width: '150px',
        height: '150px',
        background: 'rgba(44, 208, 170, 0.15)',
        borderRadius: '30%',
        filter: 'blur(60px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '15%',
        width: '100px',
        height: '100px',
        background: 'rgba(255, 181, 71, 0.2)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        zIndex: 0
      }} />

      {/* Добавляем overlay для лучшей читаемости */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)
          ${paperGrainCSS}
        `,
        zIndex: 1
      }} />
      
      {/* Основной контент */}
      <div style={{ position: 'relative', zIndex: 2 }}>
      {/* Navigation */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
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
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          </div>
          
          {/* Navigation Links */}
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#4F7FE6',
                  fontWeight: '600',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  transition: 'all 0.3s ease',
                  borderBottom: isSubjectDropdownOpen ? '2px solid #4F7FE6' : '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(79, 127, 230, 0.1)';
                  e.currentTarget.style.borderBottom = '2px solid #4F7FE6';
                }}
                onMouseLeave={(e) => {
                  if (!isSubjectDropdownOpen) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderBottom = '2px solid transparent';
                  }
                }}
              >
                {subjects.find(s => s.id === selectedSubject)?.name || 'Выбери предмет'}
                <span style={{ fontSize: '12px' }}>✨</span>
              </button>
              
              {isSubjectDropdownOpen && (
                <>
                  <div
                    onClick={() => setIsSubjectDropdownOpen(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(34, 42, 53, 0.1)',
                      zIndex: 998
                    }}
                  />
                  
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minWidth: '280px',
                    zIndex: 999,
                    marginTop: '8px',
                    overflow: 'hidden'
                  }}>
                    {subjects.map((subject, index) => (
                      <button
                        key={subject.id}
                        onClick={() => {
                          setSelectedSubject(subject.id);
                          setIsSubjectDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          border: 'none',
                          backgroundColor: selectedSubject === subject.id ? 'rgba(79, 127, 230, 0.1)' : 'transparent',
                          color: selectedSubject === subject.id ? '#4F7FE6' : '#222A35',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s ease',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedSubject !== subject.id) {
                            e.currentTarget.style.backgroundColor = 'rgba(79, 127, 230, 0.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedSubject !== subject.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <span>{subject.name}</span>
                        <span style={{ 
                          fontSize: '12px', 
                          color: '#6b7280',
                          fontFamily: 'Comic Neue, cursive'
                        }}>
                          {subject.topics} тем ✏️
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <a href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>
              Личный кабинет
            </a>
            <a href="/about" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>
              О нас
            </a>
          </div>
        </div>
      </nav>

      {/* Tasks Grid - Now at the top */}
      {selectedSubject === 'math' && (
        <section style={{ padding: '40px 32px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: '700',
              color: '#222A35',
              textAlign: 'center',
              marginBottom: '16px',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              Задания по математике
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#6b7280',
              marginBottom: '40px',
              fontFamily: 'Comic Neue, cursive',
              fontSize: '16px'
            }}>
              Выбери задание и начни свой путь к 100 баллам! ✨
            </p>

            {/* Variants Section */}
            <div style={{
              background: 'linear-gradient(135deg, #4F7FE6 0%, #2CD0AA 100%)',
              borderRadius: '20px',
              padding: '32px',
              marginBottom: '60px',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-30px',
                left: '-30px',
                width: '100px',
                height: '100px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%'
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  textAlign: 'center'
                }}>
                  🎯 Готовые варианты для тренировки
                </h3>
                <p style={{
                  fontSize: '16px',
                  marginBottom: '32px',
                  fontFamily: 'Comic Neue, cursive',
                  textAlign: 'center',
                  opacity: 0.9
                }}>
                  Не знаешь с чего начать? Мы подготовили для тебя специальные варианты!
                </p>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  maxWidth: '800px',
                  margin: '0 auto'
                }}>
                  <button
                    onClick={() => {
                      // Логика для случайного варианта
                      window.location.href = '/solve?variant=random';
                    }}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎲</div>
                    <h4 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}>
                      Случайный вариант
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      opacity: 0.9,
                      margin: 0,
                      fontFamily: 'Comic Neue, cursive'
                    }}>
                      Система сама подберет задания по твоему уровню
                    </p>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Логика для варианта преподавателей
                      window.location.href = '/solve?variant=teacher';
                    }}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>👨‍🏫</div>
                    <h4 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}>
                      Вариант от преподавателей
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      opacity: 0.9,
                      margin: 0,
                      fontFamily: 'Comic Neue, cursive'
                    }}>
                      Специально составлен экспертами в этом месяце
                    </p>
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', 
              gap: '24px' 
            }}>
              {mathTopics.map(topic => (
                <div
                  key={topic.id}
                  onClick={() => handleTaskClick(topic.id)}
                  style={{
                    textDecoration: 'none',
                    display: 'block',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '20px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(20px)',
                    padding: '28px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.15)';
                    e.currentTarget.style.borderColor = '#4F7FE6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(79, 127, 230, 0.1)';
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#222A35',
                      lineHeight: '1.4',
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}>
                      №{topic.id}. {topic.name}
                    </h3>
                    
                    <div style={{
                      backgroundColor: '#2CD0AA',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      flexShrink: 0,
                      marginLeft: '12px',
                      fontFamily: 'Comic Neue, cursive'
                    }}>
                      {getDifficultyStars(topic.difficulty)}
                    </div>
                  </div>
                  
                  {/* Topic Badge */}
                  <div style={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(255, 181, 71, 0.2)',
                    color: '#B45309',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '500',
                    marginBottom: '16px',
                    fontFamily: 'Comic Neue, cursive'
                  }}>
                    {topic.topic}
                  </div>

                  {/* Card Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      fontFamily: 'Manrope, system-ui, sans-serif'
                    }}>
                      {topic.count} заданий
                    </span>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: 'rgba(79, 127, 230, 0.1)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}>
                      <span style={{ fontSize: '14px' }}>{topic.subtopics.length > 0 ? (selectedTask === topic.id ? '▲' : '▼') : '✏️'}</span>
                    </div>
                  </div>

                  {/* Subtopics Section */}
                  {selectedTask === topic.id && topic.subtopics.length > 0 && (
                    <div style={{
                      marginTop: '24px',
                      paddingTop: '24px',
                      borderTop: '1px solid rgba(79, 127, 230, 0.1)'
                    }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#222A35',
                        margin: '0 0 16px 0',
                        fontFamily: 'Inter, system-ui, sans-serif'
                      }}>
                        Выберите подтемы:
                      </h4>
                      
                      {/* Subtopics List */}
                      <div style={{ marginBottom: '20px' }}>
                        {topic.subtopics.map((subtopic, index) => (
                          <div key={subtopic.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 0',
                            borderBottom: index < topic.subtopics.length - 1 ? '1px solid rgba(79, 127, 230, 0.05)' : 'none'
                          }}>
                            <div style={{ flex: 1 }}>
                              <p style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#222A35',
                                margin: '0 0 2px 0',
                                fontFamily: 'Inter, system-ui, sans-serif'
                              }}>
                                {subtopic.name}
                              </p>
                              <p style={{
                                fontSize: '12px',
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
                              gap: '8px'
                            }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCount(subtopic.id, -1);
                                }}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  border: '1px solid #4F7FE6',
                                  backgroundColor: 'white',
                                  color: '#4F7FE6',
                                  cursor: 'pointer',
                                  fontSize: '14px',
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
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#222A35',
                                minWidth: '16px',
                                textAlign: 'center'
                              }}>
                                {selectedCounts[subtopic.id] || 0}
                              </span>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCount(subtopic.id, 1);
                                }}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  border: '1px solid #4F7FE6',
                                  backgroundColor: 'white',
                                  color: '#4F7FE6',
                                  cursor: 'pointer',
                                  fontSize: '14px',
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
                          backgroundColor: 'rgba(79, 127, 230, 0.08)',
                          borderRadius: '12px',
                          padding: '16px',
                          border: '1px solid rgba(79, 127, 230, 0.2)',
                          marginBottom: '16px'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                          }}>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#4F7FE6',
                              fontFamily: 'Inter, system-ui, sans-serif'
                            }}>
                              Выбрано: {getTotalSelected()}
                            </span>
                            <span style={{
                              fontSize: '12px',
                              color: '#4F7FE6',
                              fontFamily: 'Comic Neue, cursive'
                            }}>
                              ⏱️ ~{Math.ceil(getTotalSelected() * 3)} мин
                            </span>
                          </div>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartSolving(topic.id);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px',
                              backgroundColor: '#4F7FE6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
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
                    </div>
                  )}

                  {/* Decorative Element */}
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'rgba(239, 62, 92, 0.1)',
                    borderRadius: '50%',
                    opacity: 0.6
                  }} />
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* Hero Section - Now below tasks */}
      <section style={{ padding: '80px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '80px',
            alignItems: 'center',
            minHeight: '500px'
          }}>
            {/* Left - Illustration Area */}
            <div style={{ position: 'relative' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(79, 127, 230, 0.1) 0%, rgba(44, 208, 170, 0.1) 100%)',
                borderRadius: '32px',
                padding: '60px',
                textAlign: 'center',
                position: 'relative',
                border: '3px solid rgba(79, 127, 230, 0.2)',
                overflow: 'hidden'
              }}>
                {/* Illustration Placeholder */}
                <div style={{
                  fontSize: '120px',
                  marginBottom: '20px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }}>
                  👩‍🎓👨‍🏫
                </div>
                
                {/* Chat Bubble */}
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  right: '40px',
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  padding: '12px 16px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  border: '2px solid #2CD0AA'
                }}>
                  <span style={{ 
                    fontSize: '18px',
                    fontFamily: 'Comic Neue, cursive',
                    color: '#222A35'
                  }}>
                    √x² = |x| 🤔
                  </span>
                </div>

                {/* Doodles */}
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  fontSize: '24px',
                  opacity: 0.6
                }}>📐</div>
                <div style={{
                  position: 'absolute',
                  top: '60px',
                  left: '20px',
                  fontSize: '20px',
                  opacity: 0.6
                }}>🚀</div>
                <div style={{
                  position: 'absolute',
                  bottom: '60px',
                  right: '20px',
                  fontSize: '22px',
                  opacity: 0.6
                }}>☕</div>
              </div>
            </div>

            {/* Right - Content */}
            <div>
              <h1 style={{
                fontSize: '52px',
                fontWeight: '700',
                color: '#222A35',
                marginBottom: '24px',
                lineHeight: '1.1',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}>
                Готовься к ЕГЭ с{' '}
                <span style={{ 
                  color: '#4F7FE6',
                  position: 'relative'
                }}>
                  душой
                  <div style={{
                    position: 'absolute',
                    bottom: '-8px',
                    left: 0,
                    right: 0,
                    height: '6px',
                    backgroundColor: '#FFB547',
                    borderRadius: '3px',
                    opacity: 0.7
                  }} />
                </span>
              </h1>
              
              <p style={{
                fontSize: '20px',
                color: '#6b7280',
                marginBottom: '40px',
                lineHeight: '1.6',
                fontFamily: 'Manrope, system-ui, sans-serif'
              }}>
                50,000+ заданий с ИИ-наставником, который объяснит каждый шаг как добрый учитель ✨
              </p>

              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '32px' }}>
                <input
                  type="text"
                  placeholder="Найди задание... например 'производная'"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '20px 60px 20px 24px',
                    borderRadius: '50px',
                    border: '3px solid rgba(79, 127, 230, 0.2)',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                    outline: 'none',
                    fontFamily: 'Manrope, system-ui, sans-serif',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#4F7FE6';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(79, 127, 230, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(79, 127, 230, 0.2)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.06)';
                  }}
                />
                <button style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#4F7FE6',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.backgroundColor = '#3F6FD6';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.backgroundColor = '#4F7FE6';
                }}>
                  <span style={{ color: 'white', fontSize: '18px' }}>🔍</span>
                </button>
              </div>

              <div style={{
                fontFamily: 'Comic Neue, cursive',
                fontSize: '14px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>💡</span>
                Попробуй: &quot;логарифмы&quot;, &quot;планиметрия&quot;, &quot;№13&quot;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Empty State for Other Subjects */}
      {selectedSubject !== 'math' && (
        <section style={{ padding: '120px 32px' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>🌱</div>
            <h2 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#222A35',
              marginBottom: '16px',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              Скоро здесь появятся задания!
            </h2>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
              border: '2px dashed rgba(79, 127, 230, 0.3)',
              position: 'relative'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>📚</div>
              <p style={{
                fontFamily: 'Comic Neue, cursive',
                fontSize: '18px',
                color: '#4F7FE6',
                margin: 0
              }}>
                Давай сначала решим первое задание по математике!
              </p>
              <div style={{
                position: 'absolute',
                bottom: '-20px',
                right: '40px',
                fontSize: '24px',
                transform: 'rotate(45deg)'
              }}>
                ↗️
              </div>
            </div>
          </div>
        </section>
      )}
      </div> {/* Закрываем основной контент */}
    </div> {/* Закрываем главный div с фоном */}
  );
}