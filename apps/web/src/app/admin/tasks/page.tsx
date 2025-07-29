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
  createdAt: string;
  author: string;
}

// Моковые данные для демонстрации
const mockTasks: Task[] = [
  {
    id: '1',
    topicId: '3',
    subtopicId: '3-1',
    title: 'Площадь прямоугольного треугольника',
    statement: 'В треугольнике ABC известно, что $AB = 6$, $BC = 8$, угол $\\angle ABC = 90°$. Найдите площадь треугольника.',
    solution: 'Дано: прямоугольный треугольник ABC, $AB = 6$, $BC = 8$, $\\angle ABC = 90°$\n\nРешение:\nПлощадь прямоугольного треугольника вычисляется по формуле:\n$$S = \\frac{1}{2} \\cdot a \\cdot b$$\nгде $a$ и $b$ — катеты треугольника.\n\n$$S = \\frac{1}{2} \\cdot AB \\cdot BC = \\frac{1}{2} \\cdot 6 \\cdot 8 = 24$$\n\nОтвет: $S = 24$',
    difficulty: 2,
    points: 1,
    tags: ['планиметрия', 'треугольник', 'площадь'],
    createdAt: '2024-01-15',
    author: 'Admin'
  },
  {
    id: '2',
    topicId: '13',
    subtopicId: '13-1',
    title: 'Показательное уравнение',
    statement: 'Решите уравнение $2^{x+1} = 8^{x-2}$',
    solution: 'Дано: $2^{x+1} = 8^{x-2}$\n\nРешение:\nПриведем к одному основанию. Поскольку $8 = 2^3$:\n$$2^{x+1} = (2^3)^{x-2}$$\n$$2^{x+1} = 2^{3(x-2)}$$\n$$2^{x+1} = 2^{3x-6}$$\n\nПоскольку основания равны:\n$$x+1 = 3x-6$$\n$$1+6 = 3x-x$$\n$$7 = 2x$$\n$$x = 3.5$$\n\nОтвет: $x = 3.5$',
    difficulty: 4,
    points: 2,
    tags: ['уравнения', 'показательные', 'степени'],
    createdAt: '2024-01-14',
    author: 'Admin'
  },
  {
    id: '3',
    topicId: '1',
    subtopicId: '1-4',
    title: 'Площадь параллелограмма',
    statement: 'Площадь параллелограмма равна 24 см². Одна из его сторон равна 6 см. Найдите высоту, проведенную к этой стороне.',
    solution: 'Дано: площадь параллелограмма $S = 24$ см², сторона $a = 6$ см\n\nНайти: высоту $h$\n\nРешение:\nПлощадь параллелограмма вычисляется по формуле:\n$$S = a \\cdot h$$\nгде $a$ — основание, $h$ — высота.\n\nВыразим высоту:\n$$h = \\frac{S}{a} = \\frac{24}{6} = 4$$\n\nОтвет: $h = 4$ см',
    difficulty: 1,
    points: 1,
    tags: ['планиметрия', 'параллелограмм', 'площадь', 'высота'],
    createdAt: '2024-01-13',
    author: 'Admin'
  }
];

const topicNames: Record<string, string> = {
  '1': 'Простейшие текстовые задачи',
  '2': 'Чтение графиков и диаграмм',
  '3': 'Планиметрия',
  '4': 'Теория вероятностей',
  '5': 'Простейшие уравнения',
  '6': 'Планиметрия (углы)',
  '7': 'Производная',
  '8': 'Стереометрия',
  '9': 'Вычисления',
  '10': 'Прикладные задачи',
  '11': 'Графики функций',
  '11a': 'Текстовые задачи',
  '12': 'Исследование функций',
  '13': 'Уравнения (сложные)',
  '14': 'Стереометрия (углы и расстояния)',
  '15': 'Неравенства',
  '16': 'Планиметрия (доказательства)',
  '17': 'Финансовая математика',
  '18': 'Задачи с параметром',
  '19': 'Числа и их свойства'
};

export default function TasksAdmin() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filteredTasks = tasks.filter(task => {
    const matchesTopic = !filterTopic || task.topicId === filterTopic;
    const matchesDifficulty = !filterDifficulty || task.difficulty.toString() === filterDifficulty;
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesTopic && matchesDifficulty && matchesSearch;
  });

  const deleteTask = (taskId: string) => {
    if (confirm('Вы уверены, что хотите удалить это задание?')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    }
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
          maxWidth: '1400px',
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
                <span style={{ color: 'white', fontSize: '20px' }}>📚</span>
              </div>
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#222A35',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  Управление заданиями
                </h1>
                <p style={{ 
                  margin: 0, 
                  fontSize: '12px', 
                  color: '#6b7280',
                  fontFamily: 'Comic Neue, cursive'
                }}>
                  всего заданий: {tasks.length}
                </p>
              </div>
            </Link>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link href="/admin/task-constructor" style={{ 
              backgroundColor: '#4F7FE6',
              color: 'white',
              textDecoration: 'none',
              fontWeight: '600',
              padding: '12px 20px',
              borderRadius: '12px',
              transition: 'all 0.3s ease'
            }}>
              ➕ Создать задание
            </Link>
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
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: selectedTask ? '1fr 1fr' : '1fr', gap: '32px' }}>
          
          {/* Tasks List */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            border: '2px solid rgba(79, 127, 230, 0.1)',
            padding: '32px'
          }}>
            {/* Filters */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#222A35',
                marginBottom: '24px',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}>
                Все задания ({filteredTasks.length})
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <select
                  value={filterTopic}
                  onChange={(e) => setFilterTopic(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid rgba(79, 127, 230, 0.2)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}
                >
                  <option value="">Все темы</option>
                  {Object.entries(topicNames).map(([id, name]) => (
                    <option key={id} value={id}>№{id}. {name}</option>
                  ))}
                </select>

                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid rgba(79, 127, 230, 0.2)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}
                >
                  <option value="">Любая сложность</option>
                  <option value="1">★☆☆☆☆ Легкая</option>
                  <option value="2">★★☆☆☆ Средняя</option>
                  <option value="3">★★★☆☆ Выше средней</option>
                  <option value="4">★★★★☆ Сложная</option>
                  <option value="5">★★★★★ Очень сложная</option>
                </select>

                <input
                  type="text"
                  placeholder="Поиск по названию или тегам..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid rgba(79, 127, 230, 0.2)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}
                />
              </div>
            </div>

            {/* Tasks List */}
            <div style={{ maxHeight: selectedTask ? '600px' : 'none', overflowY: 'auto' }}>
              {filteredTasks.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#6b7280'
                }}>
                  <span style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}>📝</span>
                  <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Заданий не найдено</p>
                  <p style={{ fontSize: '14px' }}>Попробуйте изменить фильтры или создать новое задание</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      border: selectedTask?.id === task.id ? '2px solid #4F7FE6' : '1px solid rgba(79, 127, 230, 0.1)',
                      backgroundColor: selectedTask?.id === task.id ? 'rgba(79, 127, 230, 0.05)' : 'white',
                      marginBottom: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTask?.id !== task.id) {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTask?.id !== task.id) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#222A35',
                        margin: 0,
                        fontFamily: 'Inter, system-ui, sans-serif'
                      }}>
                        {task.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{
                          backgroundColor: 'rgba(79, 127, 230, 0.1)',
                          color: '#4F7FE6',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: '600',
                          fontFamily: 'Inter, system-ui, sans-serif'
                        }}>
                          №{task.topicId}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#DC2626',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontFamily: 'Comic Neue, cursive'
                      }}>
                        {'★'.repeat(task.difficulty)}{'☆'.repeat(5 - task.difficulty)}
                      </span>
                      <span style={{
                        backgroundColor: 'rgba(255, 181, 71, 0.2)',
                        color: '#B45309',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '600',
                        fontFamily: 'Inter, system-ui, sans-serif'
                      }}>
                        {task.points} балл{task.points > 1 ? (task.points === 2 || task.points === 3 || task.points === 4 ? 'а' : 'ов') : ''}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontFamily: 'Inter, system-ui, sans-serif'
                      }}>
                        {task.createdAt}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {task.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          style={{
                            backgroundColor: 'rgba(79, 127, 230, 0.1)',
                            color: '#4F7FE6',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            fontFamily: 'Inter, system-ui, sans-serif'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {task.tags.length > 3 && (
                        <span style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          fontFamily: 'Inter, system-ui, sans-serif'
                        }}>
                          +{task.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Task Detail */}
          {selectedTask && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
              border: '2px solid rgba(79, 127, 230, 0.1)',
              padding: '32px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#222A35',
                  margin: 0,
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {selectedTask.title}
                </h3>
                <button
                  onClick={() => setSelectedTask(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
                <span style={{
                  backgroundColor: 'rgba(79, 127, 230, 0.1)',
                  color: '#4F7FE6',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  №{selectedTask.topicId}. {topicNames[selectedTask.topicId]}
                </span>
                <span style={{
                  backgroundColor: 'rgba(79, 127, 230, 0.1)',
                  color: '#4F7FE6',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {'★'.repeat(selectedTask.difficulty)}{'☆'.repeat(5 - selectedTask.difficulty)}
                </span>
                <span style={{
                  backgroundColor: 'rgba(255, 181, 71, 0.2)',
                  color: '#B45309',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {selectedTask.points} балл{selectedTask.points > 1 ? (selectedTask.points === 2 || selectedTask.points === 3 || selectedTask.points === 4 ? 'а' : 'ов') : ''}
                </span>
              </div>

              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid rgba(79, 127, 230, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#222A35',
                  marginBottom: '12px',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  Условие:
                </h4>
                <div style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#374151',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedTask.statement}
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

              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid rgba(79, 127, 230, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#222A35',
                  marginBottom: '12px',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  Решение:
                </h4>
                <div style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#374151',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedTask.solution}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#222A35',
                  marginBottom: '12px',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  Теги:
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedTask.tags.map(tag => (
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

              <div style={{
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280' }}>
                  <span>Создано: {selectedTask.createdAt}</span>
                  <span>Автор: {selectedTask.author}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}