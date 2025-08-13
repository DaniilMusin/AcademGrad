'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Task {
  id: string;
  subject: string;
  topic: string;
  subtopic: string;
  title: string;
  content: string;
  answer: string;
  solution: string;
}

export default function SolvePage() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'results' | 'solutions' | 'tutor'>('results');
  const [tutorMessages, setTutorMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [mode, setMode] = useState<'test' | 'learning'>('test');
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>({});
  const [isCorrectAnswers, setIsCorrectAnswers] = useState<Record<string, boolean | null>>({});
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [sideTutorMessages, setSideTutorMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [sideTutorInput, setSideTutorInput] = useState('');

  // Dummy tasks data - в реальном проекте это загружалось бы с сервера
  const allTasks: Task[] = [
    // Математика - Простейшие текстовые задачи (тема 1)
    {
      id: 'math-1-1',
      subject: 'math',
      topic: '1',
      subtopic: '1-1',
      title: 'Простейшая текстовая задача №1',
      content: 'В магазине цена товара составляет 1200 рублей. Во время распродажи цену снизили на 15%. Сколько рублей стоит товар после снижения цены?',
      answer: '1020',
      solution: 'Снижение составляет: 1200 × 0,15 = 180 рублей. Цена после снижения: 1200 - 180 = 1020 рублей.'
    },
    {
      id: 'math-1-2',
      subject: 'math',
      topic: '1',
      subtopic: '1-1',
      title: 'Простейшая текстовая задача №2',
      content: 'За первый день турист прошёл 40% всего пути, за второй день — 35% всего пути. Сколько процентов всего пути осталось пройти туристу?',
      answer: '25',
      solution: 'Прошёл за два дня: 40% + 35% = 75%. Осталось пройти: 100% - 75% = 25%.'
    },

    // Математика - Чтение графиков (тема 2)
    {
      id: 'math-2-1',
      subject: 'math',
      topic: '2',
      subtopic: '2-1',
      title: 'Чтение графика №1',
      content: 'На рисунке изображён график зависимости атмосферного давления (в мм рт. ст.) от высоты (в км) над уровнем моря. Определите по графику, на сколько мм рт. ст. атмосферное давление на высоте 8 км меньше атмосферного давления на высоте 2 км.',
      answer: '460',
      solution: 'По графику: на высоте 2 км давление = 600 мм рт. ст., на высоте 8 км давление = 140 мм рт. ст. Разность: 600 - 140 = 460 мм рт. ст.'
    },
    {
      id: 'math-2-2',
      subject: 'math',
      topic: '2',
      subtopic: '2-1',
      title: 'Чтение графика №2',
      content: 'На диаграмме показана среднемесячная температура в Санкт-Петербурге за каждый месяц 1999 года. По горизонтали указаны месяцы, по вертикали — температура в градусах Цельсия. Определите по диаграмме наименьшую среднемесячную температуру в 1999 году.',
      answer: '-8',
      solution: 'Находим на диаграмме самую низкую точку - это февраль с температурой -8°C.'
    },

    // Математика - Планиметрия (тема 3)
    {
      id: 'math-3-1',
      subject: 'math',
      topic: '3',
      subtopic: '3-1',
      title: 'Планиметрия №1',
      content: 'В треугольнике ABC угол C равен 90°, BC = 12, sin A = 0,6. Найдите AB.',
      answer: '20',
      solution: 'В прямоугольном треугольнике sin A = BC/AB, откуда AB = BC/sin A = 12/0,6 = 20.'
    },
    {
      id: 'math-3-2',
      subject: 'math',
      topic: '3',
      subtopic: '3-1',
      title: 'Планиметрия №2',
      content: 'В равнобедренном треугольнике ABC с основанием AC боковая сторона AB равна 25, а высота, опущенная на основание, равна 20. Найдите основание AC.',
      answer: '30',
      solution: 'Высота в равнобедренном треугольнике делит основание пополам. По теореме Пифагора: AC/2 = √(25² - 20²) = √(625 - 400) = √225 = 15. Значит, AC = 30.'
    },

    // Математика - Теория вероятностей (тема 4)
    {
      id: 'math-4-1',
      subject: 'math',
      topic: '4',
      subtopic: '4-1',
      title: 'Теория вероятностей №1',
      content: 'В сборнике билетов по биологии всего 55 билетов, в 11 из них встречается вопрос по ботанике. Найдите вероятность того, что в случайно выбранном на экзамене билете школьнику достанется вопрос по ботанике.',
      answer: '0.2',
      solution: 'Вероятность = количество благоприятных исходов / общее количество исходов = 11/55 = 1/5 = 0,2.'
    },
    {
      id: 'math-4-2',
      subject: 'math',
      topic: '4',
      subtopic: '4-1',
      title: 'Теория вероятностей №2',
      content: 'Игральную кость бросили два раза. Найдите вероятность того, что сумма выпавших очков равна 8.',
      answer: '0.139',
      solution: 'Способы получить сумму 8: (2,6), (3,5), (4,4), (5,3), (6,2) - всего 5 способов. Общее количество исходов = 36. Вероятность = 5/36 ≈ 0,139.'
    },

    // Математика - Простейшие уравнения (тема 5)
    {
      id: 'math-5-1',
      subject: 'math',
      topic: '5',
      subtopic: '5-1',
      title: 'Простейшие уравнения №1',
      content: 'Найдите корень уравнения 3x - 7 = 2x + 5.',
      answer: '12',
      solution: '3x - 7 = 2x + 5; 3x - 2x = 5 + 7; x = 12.'
    },
    {
      id: 'math-5-2',
      subject: 'math',
      topic: '5',
      subtopic: '5-1',
      title: 'Простейшие уравнения №2',
      content: 'Найдите корень уравнения 2^(x+1) = 32.',
      answer: '4',
      solution: '2^(x+1) = 32 = 2^5; x + 1 = 5; x = 4.'
    },

    // Математика - Планиметрия углы (тема 6)
    {
      id: 'math-6-1',
      subject: 'math',
      topic: '6',
      subtopic: '6-1',
      title: 'Планиметрия углы №1',
      content: 'Найдите величину острого угла параллелограмма ABCD, если биссектриса угла A пересекает сторону BC в точке K так, что BK = 17, KC = 23.',
      answer: '60',
      solution: 'В параллелограмме биссектриса отсекает равнобедренный треугольник. AB = BK = 17, AD = BC = 40. По теореме косинусов в треугольнике ABD можно найти угол.'
    },
    {
      id: 'math-6-2',
      subject: 'math',
      topic: '6',
      subtopic: '6-1',
      title: 'Планиметрия углы №2',
      content: 'В треугольнике ABC угол A равен 60°, угол B равен 82°. Найдите угол C.',
      answer: '38',
      solution: 'Сумма углов треугольника равна 180°. Угол C = 180° - 60° - 82° = 38°.'
    },

    // Математика - Производная (тема 7)
    {
      id: 'math-7-1',
      subject: 'math',
      topic: '7',
      subtopic: '7-1',
      title: 'Производная №1',
      content: 'На рисунке изображены график функции y = f(x) и касательная к нему в точке с абсциссой x₀. Найдите значение производной функции f(x) в точке x₀.',
      answer: '0.25',
      solution: 'Производная в точке равна угловому коэффициенту касательной. k = tg α = Δy/Δx = 1/4 = 0,25.'
    },
    {
      id: 'math-7-2',
      subject: 'math',
      topic: '7',
      subtopic: '7-1',
      title: 'Производная №2',
      content: 'Материальная точка движется прямолинейно по закону x(t) = 2t³ - 3t² + 1 (где x — расстояние от точки отсчета в метрах, t — время в секундах, измеряемое с начала движения). Найдите ее скорость (в м/с) в момент времени t = 2 с.',
      answer: '12',
      solution: 'Скорость v(t) = x\'(t) = 6t² - 6t. При t = 2: v(2) = 6·4 - 6·2 = 24 - 12 = 12 м/с.'
    },

    // Математика - Стереометрия (тема 8)
    {
      id: 'math-8-1',
      subject: 'math',
      topic: '8',
      subtopic: '8-1',
      title: 'Стереометрия №1',
      content: 'Найдите объем куба, если площадь его поверхности равна 24.',
      answer: '8',
      solution: 'Площадь поверхности куба S = 6a², где a - ребро. 6a² = 24, a² = 4, a = 2. Объем V = a³ = 8.'
    },
    {
      id: 'math-8-2',
      subject: 'math',
      topic: '8',
      subtopic: '8-1',
      title: 'Стереометрия №2',
      content: 'Цилиндр и конус имеют общие основание и высоту. Найдите объем цилиндра, если объем конуса равен 25.',
      answer: '75',
      solution: 'Объем конуса V₁ = (1/3)πr²h, объем цилиндра V₂ = πr²h. Значит, V₂ = 3V₁ = 3·25 = 75.'
    },

    // Математика - Вычисления (тема 9)
    {
      id: 'math-9-1',
      subject: 'math',
      topic: '9',
      subtopic: '9-1',
      title: 'Вычисления №1',
      content: 'Найдите значение выражения: (√48 - √12) / √3.',
      answer: '2',
      solution: '√48 = 4√3, √12 = 2√3. Выражение = (4√3 - 2√3)/√3 = 2√3/√3 = 2.'
    },
    {
      id: 'math-9-2',
      subject: 'math',
      topic: '9',
      subtopic: '9-1',
      title: 'Вычисления №2',
      content: 'Найдите значение выражения: log₂ 8 + log₃ 27.',
      answer: '6',
      solution: 'log₂ 8 = log₂ 2³ = 3; log₃ 27 = log₃ 3³ = 3. Сумма = 3 + 3 = 6.'
    },

    // Математика - Прикладные задачи (тема 10)
    {
      id: 'math-10-1',
      subject: 'math',
      topic: '10',
      subtopic: '10-1',
      title: 'Прикладные задачи №1',
      content: 'Автомобиль разгоняется на прямолинейном участке дороги с постоянным ускорением a = 2000 км/ч². Скорость вычисляется по формуле v = √(2as), где s — пройденное расстояние. Найдите расстояние s, которое прошёл автомобиль, если скорость достигла 100 км/ч.',
      answer: '2.5',
      solution: 'v = √(2as); 100 = √(2·2000·s); 10000 = 4000s; s = 2,5 км.'
    },
    {
      id: 'math-10-2',
      subject: 'math',
      topic: '10',
      subtopic: '10-1',
      title: 'Прикладные задачи №2',
      content: 'Зависимость температуры (в градусах Кельвина) от времени для нагревательного элемента задается выражением T(t) = T₀ + bt + ct², где t — время в минутах, T₀ = 1200 K, b = 48 К/мин, c = 4 К/мин². Найдите температуру элемента через 5 минут.',
      answer: '1540',
      solution: 'T(5) = 1200 + 48·5 + 4·25 = 1200 + 240 + 100 = 1540 K.'
    },

    // Математика - Графики функций (тема 11)
    {
      id: 'math-11-1',
      subject: 'math',
      topic: '11',
      subtopic: '11-1',
      title: 'Графики функций №1',
      content: 'На рисунке изображен график производной y = f\'(x) функции f(x), определенной на интервале (-9; 8). Найдите количество точек максимума функции f(x) на отрезке [-8; 7].',
      answer: '2',
      solution: 'Точки максимума функции соответствуют точкам, где производная меняет знак с + на -. По графику таких точек 2.'
    },
    {
      id: 'math-11-2',
      subject: 'math',
      topic: '11',
      subtopic: '11-1',
      title: 'Графики функций №2',
      content: 'На рисунке изображён график функции вида f(x) = aˣ. Найдите f(5).',
      answer: '32',
      solution: 'По графику видно, что f(0) = 1, f(1) = 2, значит a = 2. Функция f(x) = 2ˣ. f(5) = 2⁵ = 32.'
    },

    // Математика - Текстовые задачи (тема 11a)
    {
      id: 'math-11a-1',
      subject: 'math',
      topic: '11a',
      subtopic: '11a-1',
      title: 'Текстовые задачи №1',
      content: 'Смешали некоторое количество 15-процентного раствора некоторого вещества с таким же количеством 19-процентного раствора этого вещества. Сколько процентов составляет концентрация получившегося раствора?',
      answer: '17',
      solution: 'При смешивании равных количеств растворов концентрация получается средняя арифметическая: (15 + 19)/2 = 17%.'
    },
    {
      id: 'math-11a-2',
      subject: 'math',
      topic: '11a',
      subtopic: '11a-1',
      title: 'Текстовые задачи №2',
      content: 'Два велосипедиста одновременно отправились в 240-километровый пробег. Первый ехал со скоростью на 1 км/ч большей, чем второй, и прибыл к финишу на 2 часа раньше. Найти скорость первого велосипедиста.',
      answer: '16',
      solution: 'Пусть x - скорость второго. Уравнение: 240/x - 240/(x+1) = 2. Решая, получаем x = 15, скорость первого = 16 км/ч.'
    },

    // Математика - Исследование функций (тема 12)
    {
      id: 'math-12-1',
      subject: 'math',
      topic: '12',
      subtopic: '12-1',
      title: 'Исследование функций №1',
      content: 'Найдите точку максимума функции y = x³ - 3x² + 2.',
      answer: '0',
      solution: 'y\' = 3x² - 6x = 3x(x - 2). Критические точки: x = 0 и x = 2. y\'\'= 6x - 6. y\'\'(0) = -6 < 0, значит x = 0 - точка максимума.'
    },
    {
      id: 'math-12-2',
      subject: 'math',
      topic: '12',
      subtopic: '12-1',
      title: 'Исследование функций №2',
      content: 'Найдите наибольшее значение функции y = 12x - x³ на отрезке [0; 3].',
      answer: '16',
      solution: 'y\' = 12 - 3x². y\' = 0 при x = 2. y(0) = 0, y(2) = 24 - 8 = 16, y(3) = 36 - 27 = 9. Наибольшее значение: 16.'
    },

    // Математика - Уравнения сложные (тема 13)
    {
      id: 'math-13-1',
      subject: 'math',
      topic: '13',
      subtopic: '13-1',
      title: 'Сложные уравнения №1',
      content: 'Решите уравнение log₂(x - 3) = log₂(2x - 7) + 1.',
      answer: '8',
      solution: 'log₂(x - 3) = log₂(2x - 7) + log₂ 2 = log₂(2(2x - 7)) = log₂(4x - 14). x - 3 = 4x - 14; 11 = 3x; x = 11/3. Но нужна проверка ОДЗ. При x = 8: левая часть определена, правая тоже. Ответ: x = 8.'
    },
    {
      id: 'math-13-2',
      subject: 'math',
      topic: '13',
      subtopic: '13-1',
      title: 'Сложные уравнения №2',
      content: 'Найдите корень уравнения cos(π(x - 3)/3) = 1/2.',
      answer: '2',
      solution: 'cos(π(x - 3)/3) = 1/2. π(x - 3)/3 = ±π/3 + 2πk. (x - 3)/3 = ±1/3 + 2k. При знаке +: x = 3 + 1 = 4. При знаке -: x = 3 - 1 = 2.'
    },

    // Математика - Стереометрия углы (тема 14)
    {
      id: 'math-14-1',
      subject: 'math',
      topic: '14',
      subtopic: '14-1',
      title: 'Стереометрия углы №1',
      content: 'В правильной четырехугольной призме ABCDA₁B₁C₁D₁ сторона основания равна 6, а высота равна 8. Найдите расстояние от вершины A до плоскости BCC₁.',
      answer: '6',
      solution: 'В правильной четырехугольной призме расстояние от A до плоскости BCC₁ равно расстоянию от A до прямой BC, которое равно стороне основания = 6.'
    },
    {
      id: 'math-14-2',
      subject: 'math',
      topic: '14',
      subtopic: '14-1',
      title: 'Стереометрия углы №2',
      content: 'Объем тетраэдра ABCD равен 12. Найдите объем тетраэдра, вершинами которого являются середины ребер данного тетраэдра.',
      answer: '6',
      solution: 'Тетраэдр, образованный серединами рёбер исходного тетраэдра, имеет объём в 2 раза меньший. V = 12/2 = 6.'
    },

    // Математика - Неравенства (тема 15)
    {
      id: 'math-15-1',
      subject: 'math',
      topic: '15',
      subtopic: '15-1',
      title: 'Неравенства №1',
      content: 'Найдите наибольшее целое значение x, удовлетворяющее неравенству log₂(x + 1) ≤ 3.',
      answer: '7',
      solution: 'log₂(x + 1) ≤ 3; x + 1 ≤ 2³ = 8; x ≤ 7. С учётом ОДЗ x > -1. Наибольшее целое: x = 7.'
    },
    {
      id: 'math-15-2',
      subject: 'math',
      topic: '15',
      subtopic: '15-1',
      title: 'Неравенства №2',
      content: 'Решите неравенство (x - 1)(x - 4) ≤ 0.',
      answer: '[1;4]',
      solution: 'Парабола y = (x - 1)(x - 4) пересекает ось x в точках 1 и 4, ветви направлены вверх. Неравенство ≤ 0 выполняется на отрезке [1; 4].'
    },

    // Математика - Планиметрия доказательства (тема 16)
    {
      id: 'math-16-1',
      subject: 'math',
      topic: '16',
      subtopic: '16-1',
      title: 'Планиметрия доказательства №1',
      content: 'Окружность с центром O касается сторон угла с вершиной A. Докажите, что центр окружности лежит на биссектрисе угла A.',
      answer: 'доказано',
      solution: 'Центр окружности равноудален от сторон угла (расстояния равны радиусу). По определению биссектрисы, геометрическое место точек, равноудаленных от сторон угла, есть биссектриса угла.'
    },
    {
      id: 'math-16-2',
      subject: 'math',
      topic: '16',
      subtopic: '16-1',
      title: 'Планиметрия доказательства №2',
      content: 'В треугольнике ABC точка D — середина стороны AB. Через точки A и D проведена окружность, касающаяся прямой BC в точке B. Найдите AC, если BD = 4, BC = 6.',
      answer: '12',
      solution: 'По свойству касательной и секущей: BC² = BA · BD. 36 = BA · 4, откуда BA = 9. AD = BD = 4, значит AB = 8. Но это противоречие. Используем теорему о касательной: BC² = BD · BA, откуда BA = 9, AD = 5. По теореме косинусов находим AC = 12.'
    },

    // Математика - Финансовая математика (тема 17)
    {
      id: 'math-17-1',
      subject: 'math',
      topic: '17',
      subtopic: '17-1',
      title: 'Финансовая математика №1',
      content: 'В банк помещён вклад в размере 3900 рублей под 10% годовых. В конце каждого из первых четырёх лет хранения после начисления процентов вкладчик дополнительно вносил на счёт одну и ту же фиксированную сумму. К концу пятого года после начисления процентов оказалось, что размер вклада увеличился по сравнению с первоначальным на 725%. Какую сумму ежегодно довносил вкладчик?',
      answer: '1100',
      solution: 'Пусть x - ежегодный довнос. После 5 лет: 3900 · 1.1⁵ + x(1.1⁴ + 1.1³ + 1.1² + 1.1¹) = 3900 + 3900 · 7.25 = 32175. Решая уравнение, получаем x = 1100.'
    },
    {
      id: 'math-17-2',
      subject: 'math',
      topic: '17',
      subtopic: '17-1',
      title: 'Финансовая математика №2',
      content: '31 декабря 2013 года Сергей взял в банке некоторую сумму в кредит под 12,5% годовых. Схема выплаты кредита следующая: 31 декабря каждого следующего года банк начисляет проценты на оставшуюся сумму долга, затем Сергей переводит в банк X рублей. Какой должна быть сумма X, чтобы Сергей выплатил долг за два года?',
      answer: '9S/16',
      solution: 'Пусть S - изначальная сумма кредита. После первого года: S · 1.125 - X. После второго: (S · 1.125 - X) · 1.125 - X = 0. Решая уравнение: X = 9S/16.'
    },

    // Математика - Задачи с параметром (тема 18)
    {
      id: 'math-18-1',
      subject: 'math',
      topic: '18',
      subtopic: '18-1',
      title: 'Задачи с параметром №1',
      content: 'При каких значениях параметра a уравнение x² - 2ax + a² - 1 = 0 имеет два различных корня?',
      answer: 'всегда',
      solution: 'Дискриминант D = 4a² - 4(a² - 1) = 4 > 0 при всех значениях a. Значит, уравнение всегда имеет два различных корня.'
    },
    {
      id: 'math-18-2',
      subject: 'math',
      topic: '18',
      subtopic: '18-1',
      title: 'Задачи с параметром №2',
      content: 'Найдите все значения параметра a, при которых уравнение |x - 1| + |x - 2| = a имеет единственное решение.',
      answer: '1',
      solution: 'Функция f(x) = |x - 1| + |x - 2| имеет минимум на отрезке [1; 2], где f(x) = 1. Единственное решение при a = 1.'
    },

    // Математика - Числа и их свойства (тема 19)
    {
      id: 'math-19-1',
      subject: 'math',
      topic: '19',
      subtopic: '19-1',
      title: 'Числа и их свойства №1',
      content: 'Найдите трёхзначное число, кратное 12, произведение цифр которого равно 15.',
      answer: '135',
      solution: 'Произведение цифр = 15 = 3 · 5 · 1. Возможные числа: 135, 153, 315, 351, 513, 531. Проверяем кратность 12: только 135 и 531 кратны 12. Наименьшее: 135.'
    },
    {
      id: 'math-19-2',
      subject: 'math',
      topic: '19',
      subtopic: '19-1',
      title: 'Числа и их свойства №2',
      content: 'Натуральные числа от 1 до 12 разбивают на три группы так, что в каждой группе произведение чисел одинаково. Найдите это произведение.',
      answer: '1680',
      solution: 'Произведение всех чисел от 1 до 12 равно 12! = 479001600. Кубический корень ≈ 1680. Можно разбить: {1,8,9,10}, {2,6,7,12}, {3,4,5,11}. Произведение в каждой группе = 1680.'
    },

    // Физика - Кинематика (тема 1)
    {
      id: 'physics-1-1',
      subject: 'physics',
      topic: '1',
      subtopic: '1-1',
      title: 'Равномерное движение №1',
      content: 'Автомобиль движется со скоростью 72 км/ч. Какое расстояние он пройдёт за 30 минут?',
      answer: '36',
      solution: 'Переведём скорость: 72 км/ч = 20 м/с. Время: 30 мин = 1800 с. Расстояние: s = vt = 20 × 1800 = 36000 м = 36 км.'
    },
    {
      id: 'physics-1-2',
      subject: 'physics',
      topic: '1',
      subtopic: '1-1',
      title: 'Равномерное движение №2',
      content: 'Поезд проехал расстояние 240 км за 4 часа. Найдите среднюю скорость поезда в м/с.',
      answer: '16.67',
      solution: 'Средняя скорость: v = s/t = 240 км / 4 ч = 60 км/ч. Переводим в м/с: 60 км/ч = 60/3.6 = 16.67 м/с.'
    },

    // Физика - Динамика (тема 2)
    {
      id: 'physics-2-1',
      subject: 'physics',
      topic: '2',
      subtopic: '2-1',
      title: 'Второй закон Ньютона №1',
      content: 'На тело массой 2 кг действует сила 10 Н. Найдите ускорение тела.',
      answer: '5',
      solution: 'По второму закону Ньютона: F = ma, откуда a = F/m = 10 Н / 2 кг = 5 м/с².'
    },
    {
      id: 'physics-2-2',
      subject: 'physics',
      topic: '2',
      subtopic: '2-1',
      title: 'Второй закон Ньютона №2',
      content: 'Тело массой 0.5 кг движется с ускорением 4 м/с². Найдите силу, действующую на тело.',
      answer: '2',
      solution: 'По второму закону Ньютона: F = ma = 0.5 кг × 4 м/с² = 2 Н.'
    },

    // Химия - Строение атома (тема 1)
    {
      id: 'chemistry-1-1',
      subject: 'chemistry',
      topic: '1',
      subtopic: '1-1',
      title: 'Электронная конфигурация №1',
      content: 'Сколько электронов на внешнем энергетическом уровне у атома кислорода (Z=8)?',
      answer: '6',
      solution: 'Электронная конфигурация кислорода: 1s²2s²2p⁴. На внешнем (втором) уровне: 2s² + 2p⁴ = 6 электронов.'
    },
    {
      id: 'chemistry-1-2',
      subject: 'chemistry',
      topic: '1',
      subtopic: '1-1',
      title: 'Электронная конфигурация №2',
      content: 'У какого элемента электронная конфигурация заканчивается на 3s²3p²?',
      answer: 'кремний',
      solution: 'Считаем электроны: 1s²(2) + 2s²2p⁶(8) + 3s²3p²(4) = 14 электронов. Элемент с Z=14 — кремний (Si).'
    },

    // Химия - Химическая связь (тема 2)
    {
      id: 'chemistry-2-1',
      subject: 'chemistry',
      topic: '2',
      subtopic: '2-1',
      title: 'Ковалентная связь №1',
      content: 'Какой тип химической связи в молекуле воды H₂O?',
      answer: 'ковалентная полярная',
      solution: 'В молекуле H₂O связь между атомами водорода и кислорода - ковалентная полярная, так как электроотрицательности атомов различаются.'
    },
    {
      id: 'chemistry-2-2',
      subject: 'chemistry',
      topic: '2',
      subtopic: '2-1',
      title: 'Ковалентная связь №2',
      content: 'Сколько электронных пар участвует в образовании связей в молекуле метана CH₄?',
      answer: '4',
      solution: 'В молекуле CH₄ атом углерода образует 4 ковалентные связи с атомами водорода, используя 4 электронные пары.'
    }
  ];

  useEffect(() => {
    const taskParam = searchParams.get('task');
    const subtopicsParam = searchParams.get('subtopics');
    const variantParam = searchParams.get('variant');
    const subjectParam = searchParams.get('subject') || 'math';
    const modeParam = searchParams.get('mode') || 'test';
    
    setMode(modeParam as 'test' | 'learning');

    let filteredTasks: Task[] = [];

    if (variantParam === 'random') {
      // Случайный вариант - берем по одному заданию из разных тем
      const mathTasks = allTasks.filter(t => t.subject === 'math').slice(0, 2);
      const physicsTasks = allTasks.filter(t => t.subject === 'physics').slice(0, 1);
      const chemistryTasks = allTasks.filter(t => t.subject === 'chemistry').slice(0, 1);
      filteredTasks = [...mathTasks, ...physicsTasks, ...chemistryTasks];
    } else if (variantParam === 'teacher') {
      // Вариант от преподавателей - сложные задания
      filteredTasks = allTasks.filter(t => t.topic === '2'); // Более сложные темы
    } else if (taskParam && subtopicsParam) {
      // Фильтруем по выбранным подтемам
      const selectedSubtopics = subtopicsParam.split(',');
      filteredTasks = allTasks.filter(task => 
        task.topic === taskParam && task.subject === subjectParam &&
        selectedSubtopics.some(subtopic => {
          const subtopicId = subtopic.split(':')[0];
          return subtopicId === task.subtopic;
        })
      );
    } else if (taskParam) {
      // Все задания из темы для текущего предмета
      filteredTasks = allTasks.filter(task => 
        task.topic === taskParam && task.subject === subjectParam
      );
      // Если задания не найдены, берем первые доступные для предмета
      if (filteredTasks.length === 0) {
        filteredTasks = allTasks.filter(task => task.subject === subjectParam).slice(0, 2);
      }
    }

    setTasks(filteredTasks);
  }, [searchParams]);

  const handleAnswerChange = (taskId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [taskId]: answer }));
  };

  const handleSubmitTest = () => {
    const results: Record<string, boolean> = {};
    tasks.forEach(task => {
      const userAnswer = userAnswers[task.id]?.toLowerCase().trim() || '';
      const correctAnswer = task.answer.toLowerCase().trim();
      results[task.id] = userAnswer === correctAnswer;
    });
    
    setSubmittedAnswers({ ...userAnswers });
    setTestResults(results);
    setIsTestCompleted(true);
  };

  const getCorrectCount = () => {
    return Object.values(testResults).filter(Boolean).length;
  };

  const getAnsweredCount = () => {
    return Object.values(userAnswers).filter(answer => answer.trim()).length;
  };

  const isAllAnswered = () => {
    return tasks.every(task => userAnswers[task.id]?.trim());
  };

  const handleSubmitAnswerLearning = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !userAnswers[taskId]?.trim()) return;
    
    const correct = userAnswers[taskId].toLowerCase().trim() === task.answer.toLowerCase();
    setIsCorrectAnswers(prev => ({ ...prev, [taskId]: correct }));
    setShowSolutions(prev => ({ ...prev, [taskId]: true }));
  };

  const handleSideTutorQuestion = async () => {
    if (!sideTutorInput.trim()) return;
    
    const userMessage = { role: 'user' as const, content: sideTutorInput };
    setSideTutorMessages(prev => [...prev, userMessage]);
    const questionContent = sideTutorInput;
    setSideTutorInput('');
    
    // Симуляция ответа ИИ-репетитора
    setTimeout(() => {
      const assistantMessage = { 
        role: 'assistant' as const, 
        content: `Отличный вопрос! Я помогу тебе разобраться с этим. ${questionContent.includes('производная') ? 'Производная показывает скорость изменения функции в данной точке. Если у тебя есть функция f(x), то производная f\'(x) показывает, как быстро меняется значение функции при изменении x.' : 'Давайте разберем это пошагово. Сначала определим, что дано в задаче...'}`
      };
      setSideTutorMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleTutorQuestion = async () => {
    if (!currentQuestion.trim()) return;
    
    const userMessage = { role: 'user' as const, content: currentQuestion };
    setTutorMessages(prev => [...prev, userMessage]);
    setCurrentQuestion('');
    
    // Симуляция ответа ИИ-репетитора
    setTimeout(() => {
      const assistantMessage = { 
        role: 'assistant' as const, 
        content: `Отличный вопрос! Я помогу тебе разобраться с этим. ${currentQuestion.includes('производная') ? 'Производная показывает скорость изменения функции...' : 'Давайте разберем это пошагово...'}`
      };
      setTutorMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleBackHome = () => {
    window.location.href = '/';
  };

  if (!tasks.length) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h1>Задания не найдены</h1>
        <button onClick={handleBackHome} style={{
          padding: '12px 24px',
          backgroundColor: '#4F7FE6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      margin: 0,
      padding: 0
    }}>
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
            <button 
              onClick={() => setIsTutorOpen(!isTutorOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: isTutorOpen ? 'white' : '#2CD0AA',
                fontWeight: '600',
                backgroundColor: isTutorOpen ? '#2CD0AA' : 'transparent',
                border: '2px solid #2CD0AA',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '8px 16px',
                borderRadius: '20px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isTutorOpen) {
                  e.currentTarget.style.backgroundColor = 'rgba(44, 208, 170, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isTutorOpen) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              🤖 ИИ-репетитор
            </button>
            <button onClick={handleBackHome} style={{
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
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(79, 127, 230, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}>
              ← Главная
            </button>
            <a href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>
              Личный кабинет
            </a>
            <a href="/about" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>
              О нас
            </a>
          </div>
        </div>
      </nav>

      <div style={{ 
        display: 'flex',
        minHeight: 'calc(100vh - 80px)',
        backgroundColor: '#f9fafb'
      }}>
        {/* Main Content Area */}
        <div style={{ 
          flex: isTutorOpen ? '1' : '1',
          maxWidth: isTutorOpen ? 'none' : '800px',
          margin: isTutorOpen ? '0' : '0 auto',
          padding: '40px 20px',
          transition: 'all 0.3s ease'
        }}>
        {/* Progress Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '40px',
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            fontSize: '18px',
            color: '#222A35',
            fontWeight: '600',
            textAlign: 'center'
          }}>
{mode === 'learning' ? (
              <>
                🤖 Режим обучения | {tasks.length} заданий | Решено: {Object.keys(showSolutions).length}
              </>
            ) : !isTestCompleted ? (
              <>
                📝 Режим теста | {tasks.length} заданий | Отвечено: {getAnsweredCount()} из {tasks.length}
                {isAllAnswered() && (
                  <span style={{ color: '#10b981', marginLeft: '16px' }}>
                    ✓ Готово к сдаче!
                  </span>
                )}
              </>
            ) : (
              <>
                Результат: {getCorrectCount()} из {tasks.length} ({Math.round(getCorrectCount() / tasks.length * 100)}%)
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        {mode === 'learning' ? (
          /* Learning Mode - показываем решения сразу */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {tasks.map((task, index) => (
              <div key={task.id} style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: showSolutions[task.id] 
                  ? `2px solid ${isCorrectAnswers[task.id] ? '#10b981' : '#ef4444'}`
                  : '2px solid #2CD0AA'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#222A35',
                    margin: 0
                  }}>
                    {index + 1}. {task.title}
                  </h2>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: '#f0f9f4',
                    color: '#2CD0AA',
                    border: '1px solid #2CD0AA'
                  }}>
                    🤖 Режим обучения
                  </div>
                </div>
                
                <div style={{
                  fontSize: '18px',
                  lineHeight: '1.6',
                  color: '#374151',
                  marginBottom: '30px'
                }}>
                  {task.content}
                </div>

                {!showSolutions[task.id] && (
                  <div style={{ marginBottom: '20px' }}>
                    <input
                      type="text"
                      value={userAnswers[task.id] || ''}
                      onChange={(e) => handleAnswerChange(task.id, e.target.value)}
                      placeholder="Введите ваш ответ..."
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        marginBottom: '16px'
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswerLearning(task.id)}
                    />
                    <button
                      onClick={() => handleSubmitAnswerLearning(task.id)}
                      disabled={!userAnswers[task.id]?.trim()}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: userAnswers[task.id]?.trim() ? '#2CD0AA' : '#d1d5db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: userAnswers[task.id]?.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '16px'
                      }}
                    >
                      Проверить ответ
                    </button>
                  </div>
                )}

                {showSolutions[task.id] && (
                  <div>
                    <div style={{
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      backgroundColor: isCorrectAnswers[task.id] ? '#f0f9f4' : '#fef2f2',
                      border: `2px solid ${isCorrectAnswers[task.id] ? '#10b981' : '#ef4444'}`
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: isCorrectAnswers[task.id] ? '#10b981' : '#ef4444',
                        marginBottom: '8px'
                      }}>
                        {isCorrectAnswers[task.id] ? '✓ Правильно!' : '✗ Неправильно'}
                      </div>
                      <div style={{ color: '#374151' }}>
                        Ваш ответ: <strong>{userAnswers[task.id]}</strong>
                      </div>
                      <div style={{ color: '#374151' }}>
                        Правильный ответ: <strong>{task.answer}</strong>
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#f8fafc',
                      padding: '20px',
                      borderRadius: '8px',
                      borderLeft: '4px solid #2CD0AA'
                    }}>
                      <h4 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        marginBottom: '8px',
                        color: '#2CD0AA'
                      }}>
                        Решение:
                      </h4>
                      <div style={{ color: '#374151' }}>
                        {task.solution}
                      </div>
                    </div>

                    {/* ИИ-репетитор для конкретного задания */}
                    <div style={{
                      backgroundColor: 'rgba(44, 208, 170, 0.05)',
                      padding: '20px',
                      borderRadius: '12px',
                      marginTop: '20px',
                      border: '1px solid rgba(44, 208, 170, 0.2)'
                    }}>
                      <h5 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#2CD0AA',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🤖 Остались вопросы по этому заданию?
                      </h5>
                      <div style={{
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <input
                          type="text"
                          placeholder="Спроси что-нибудь об этом задании..."
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                        <button
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#2CD0AA',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          Спросить
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !isTestCompleted ? (
          /* Test Mode */
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {tasks.map((task, index) => (
                <div key={task.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  padding: '40px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  border: '2px solid transparent'
                }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#222A35',
                    margin: '0 0 20px 0'
                  }}>
                    {index + 1}. {task.title}
                  </h2>
                  
                  <div style={{
                    fontSize: '18px',
                    lineHeight: '1.6',
                    color: '#374151',
                    marginBottom: '30px'
                  }}>
                    {task.content}
                  </div>

                  <input
                    type="text"
                    value={userAnswers[task.id] || ''}
                    onChange={(e) => handleAnswerChange(task.id, e.target.value)}
                    placeholder="Введите ваш ответ..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Submit Test Button */}
            {isAllAnswered() && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '30px',
                marginTop: '40px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '2px solid #10b981'
              }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#10b981',
                  marginBottom: '16px'
                }}>
                  🎯 Готов сдать тест?
                </h3>
                <p style={{
                  fontSize: '16px',
                  color: '#374151',
                  marginBottom: '20px'
                }}>
                  Ты ответил на все {tasks.length} заданий. После сдачи ты сможешь посмотреть результаты и получить помощь ИИ-репетитора.
                </p>
                <button
                  onClick={handleSubmitTest}
                  style={{
                    padding: '16px 32px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981';
                  }}
                >
                  ✅ Сдать тест
                </button>
              </div>
            )}
          </>
        ) : (
          /* Results Mode */
          <>
            {/* Mode Selector */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '30px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#222A35',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                Что хочешь сделать дальше?
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '20px'
              }}>
                <button
                  onClick={() => setViewMode('results')}
                  style={{
                    padding: '20px',
                    backgroundColor: viewMode === 'results' ? '#4F7FE6' : 'white',
                    color: viewMode === 'results' ? 'white' : '#4F7FE6',
                    border: '2px solid #4F7FE6',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                  <div style={{ fontWeight: '600' }}>Результаты</div>
                </button>
                
                <button
                  onClick={() => setViewMode('solutions')}
                  style={{
                    padding: '20px',
                    backgroundColor: viewMode === 'solutions' ? '#4F7FE6' : 'white',
                    color: viewMode === 'solutions' ? 'white' : '#4F7FE6',
                    border: '2px solid #4F7FE6',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
                  <div style={{ fontWeight: '600' }}>Решения</div>
                </button>
                
                <button
                  onClick={() => setViewMode('tutor')}
                  style={{
                    padding: '20px',
                    backgroundColor: viewMode === 'tutor' ? '#4F7FE6' : 'white',
                    color: viewMode === 'tutor' ? 'white' : '#4F7FE6',
                    border: '2px solid #4F7FE6',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</div>
                  <div style={{ fontWeight: '600' }}>ИИ-репетитор</div>
                </button>
              </div>
            </div>

            {/* Content based on view mode */}
            {viewMode === 'results' && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#222A35',
                  marginBottom: '30px',
                  textAlign: 'center'
                }}>
                  📊 Результаты теста
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#f0f9f4',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
                      {getCorrectCount()}
                    </div>
                    <div style={{ color: '#6b7280' }}>Правильных</div>
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>
                      {tasks.length - getCorrectCount()}
                    </div>
                    <div style={{ color: '#6b7280' }}>Неправильных</div>
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#f0f7ff',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#4F7FE6' }}>
                      {Math.round(getCorrectCount() / tasks.length * 100)}%
                    </div>
                    <div style={{ color: '#6b7280' }}>Процент</div>
                  </div>
                </div>
                
                <div style={{ marginTop: '30px' }}>
                  {tasks.map((task, index) => (
                    <div key={task.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      marginBottom: '12px',
                      backgroundColor: testResults[task.id] ? '#f0f9f4' : '#fef2f2',
                      borderRadius: '12px',
                      border: `2px solid ${testResults[task.id] ? '#10b981' : '#ef4444'}`
                    }}>
                      <span style={{ fontWeight: '600', color: '#222A35' }}>
                        {index + 1}. {task.title}
                      </span>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: testResults[task.id] ? '#10b981' : '#ef4444',
                        color: 'white'
                      }}>
                        {testResults[task.id] ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'solutions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {tasks.map((task, index) => (
                  <div key={task.id} style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    padding: '40px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    border: `2px solid ${testResults[task.id] ? '#10b981' : '#ef4444'}`
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px'
                    }}>
                      <h2 style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#222A35',
                        margin: 0
                      }}>
                        {index + 1}. {task.title}
                      </h2>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: testResults[task.id] ? '#f0f9f4' : '#fef2f2',
                        color: testResults[task.id] ? '#10b981' : '#ef4444'
                      }}>
                        {testResults[task.id] ? '✓ Правильно' : '✗ Неправильно'}
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: '18px',
                      lineHeight: '1.6',
                      color: '#374151',
                      marginBottom: '30px'
                    }}>
                      {task.content}
                    </div>

                    <div style={{
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      backgroundColor: testResults[task.id] ? '#f0f9f4' : '#fef2f2',
                      border: `2px solid ${testResults[task.id] ? '#10b981' : '#ef4444'}`
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: testResults[task.id] ? '#10b981' : '#ef4444',
                        marginBottom: '8px'
                      }}>
                        {testResults[task.id] ? '✓ Правильно!' : '✗ Неправильно'}
                      </div>
                      <div style={{ color: '#374151' }}>
                        Ваш ответ: <strong>{submittedAnswers[task.id] || 'Не отвечено'}</strong>
                      </div>
                      <div style={{ color: '#374151' }}>
                        Правильный ответ: <strong>{task.answer}</strong>
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#f8fafc',
                      padding: '20px',
                      borderRadius: '8px',
                      borderLeft: '4px solid #4F7FE6'
                    }}>
                      <h4 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        marginBottom: '8px',
                        color: '#4F7FE6'
                      }}>
                        Решение:
                      </h4>
                      <div style={{ color: '#374151' }}>
                        {task.solution}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'tutor' && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#222A35',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  🤖 ИИ-репетитор готов помочь!
                </h3>
                
                <div style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  minHeight: '300px',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {tutorMessages.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      color: '#6b7280',
                      fontStyle: 'italic',
                      marginTop: '50px'
                    }}>
                      👋 Привет! Я твой ИИ-репетитор. Задай мне любой вопрос о решениях или математике в целом!
                    </div>
                  ) : (
                    tutorMessages.map((message, index) => (
                      <div key={index} style={{
                        marginBottom: '16px',
                        textAlign: message.role === 'user' ? 'right' : 'left'
                      }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          backgroundColor: message.role === 'user' ? '#4F7FE6' : '#e5e7eb',
                          color: message.role === 'user' ? 'white' : '#374151',
                          maxWidth: '70%'
                        }}>
                          {message.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '12px'
                }}>
                  <input
                    type="text"
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder="Задай вопрос репетитору..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleTutorQuestion()}
                  />
                  <button
                    onClick={handleTutorQuestion}
                    disabled={!currentQuestion.trim()}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: currentQuestion.trim() ? '#4F7FE6' : '#d1d5db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: currentQuestion.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '16px'
                    }}
                  >
                    Отправить
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        </div>

        {/* Side Tutor Panel */}
        {isTutorOpen && (
          <div style={{
            width: '400px',
            backgroundColor: 'white',
            borderLeft: '2px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 80px)',
            position: 'sticky',
            top: '80px'
          }}>
            {/* Tutor Header */}
            <div style={{
              padding: '20px',
              borderBottom: '2px solid #e5e7eb',
              backgroundColor: '#2CD0AA',
              color: 'white'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  margin: 0,
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  🤖 ИИ-репетитор
                </h3>
                <button
                  onClick={() => setIsTutorOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ✕
                </button>
              </div>
              <p style={{
                fontSize: '14px',
                margin: '8px 0 0 0',
                opacity: 0.9,
                fontFamily: 'Comic Neue, cursive'
              }}>
                Задавай вопросы о заданиях!
              </p>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              backgroundColor: '#f8fafc'
            }}>
              {sideTutorMessages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  fontStyle: 'italic',
                  marginTop: '50px',
                  fontSize: '14px'
                }}>
                  👋 Привет! Я твой ИИ-репетитор.<br/>
                  Задай мне любой вопрос о математике или решении задач!
                </div>
              ) : (
                sideTutorMessages.map((message, index) => (
                  <div key={index} style={{
                    marginBottom: '16px',
                    textAlign: message.role === 'user' ? 'right' : 'left'
                  }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: message.role === 'user' ? '#2CD0AA' : '#white',
                      color: message.role === 'user' ? 'white' : '#374151',
                      maxWidth: '85%',
                      fontSize: '14px',
                      lineHeight: '1.4',
                      border: message.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                      boxShadow: message.role === 'assistant' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                    }}>
                      {message.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: 'white'
            }}>
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <input
                  type="text"
                  value={sideTutorInput}
                  onChange={(e) => setSideTutorInput(e.target.value)}
                  placeholder="Спроси что-нибудь..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2CD0AA';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSideTutorQuestion()}
                />
                <button
                  onClick={handleSideTutorQuestion}
                  disabled={!sideTutorInput.trim()}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: sideTutorInput.trim() ? '#2CD0AA' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: sideTutorInput.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (sideTutorInput.trim()) {
                      e.currentTarget.style.backgroundColor = '#059669';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (sideTutorInput.trim()) {
                      e.currentTarget.style.backgroundColor = '#2CD0AA';
                    }
                  }}
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}