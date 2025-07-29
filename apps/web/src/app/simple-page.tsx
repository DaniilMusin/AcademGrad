'use client';

import { useState } from 'react';

export default function SimplePage() {
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('math');

  const subjects = [
    { id: 'math', name: 'Математика (профиль)', topics: 18 },
    { id: 'physics', name: 'Физика', topics: 5 },
    { id: 'chemistry', name: 'Химия', topics: 4 }
  ];

  const mathTopics = [
    { id: '1', name: 'Простейшие текстовые задачи', count: 25, difficulty: 'easy' },
    { id: '2', name: 'Чтение графиков и диаграмм', count: 30, difficulty: 'easy' },
    { id: '3', name: 'Планиметрия (базовая)', count: 40, difficulty: 'easy' },
    { id: '4', name: 'Теория вероятностей', count: 35, difficulty: 'easy' },
    { id: '5', name: 'Простейшие уравнения', count: 50, difficulty: 'easy' },
    { id: '6', name: 'Планиметрия (углы и длины)', count: 45, difficulty: 'easy' },
    { id: '7', name: 'Производная и первообразная', count: 40, difficulty: 'easy' },
    { id: '8', name: 'Стереометрия', count: 35, difficulty: 'easy' },
    { id: '9', name: 'Вычисления и преобразования', count: 60, difficulty: 'medium' },
    { id: '10', name: 'Прикладные задачи', count: 30, difficulty: 'medium' },
    { id: '11', name: 'Текстовые задачи', count: 45, difficulty: 'medium' },
    { id: '12', name: 'Исследование функций', count: 40, difficulty: 'medium' },
    { id: '13', name: 'Уравнения (сложные)', count: 35, difficulty: 'hard' },
    { id: '14', name: 'Стереометрия (углы и расстояния)', count: 30, difficulty: 'hard' },
    { id: '15', name: 'Неравенства', count: 40, difficulty: 'hard' },
    { id: '16', name: 'Планиметрия (доказательства)', count: 25, difficulty: 'hard' },
    { id: '17', name: 'Финансовая математика', count: 20, difficulty: 'hard' },
    { id: '18', name: 'Задачи с параметром', count: 15, difficulty: 'hard' }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { backgroundColor: '#dcfce7', color: '#166534' };
      case 'medium': return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'hard': return { backgroundColor: '#fee2e2', color: '#991b1b' };
      default: return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Базовый';
      case 'medium': return 'Средний';
      case 'hard': return 'Высокий';
      default: return 'Неизвестно';
    }
  };

  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif',
      margin: 0,
      padding: 0,
      backgroundColor: '#f6f8ff',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10
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
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#005AE0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,90,224,0.3)'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>А</span>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                Академград
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                Школа подготовки к ЕГЭ
              </p>
            </div>
          </div>
          
          <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            {/* Subject Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#005AE0',
                  fontWeight: '500',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {subjects.find(s => s.id === selectedSubject)?.name || 'Выберите предмет'}
                <span style={{ fontSize: '12px' }}>{isSubjectDropdownOpen ? '▲' : '▼'}</span>
              </button>
              
              {/* Dropdown Menu */}
              {isSubjectDropdownOpen && (
                <>
                  {/* Overlay */}
                  <div
                    onClick={() => setIsSubjectDropdownOpen(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      zIndex: 998
                    }}
                  />
                  
                  {/* Dropdown Content */}
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    border: '1px solid #e5e7eb',
                    minWidth: '250px',
                    zIndex: 999,
                    marginTop: '8px'
                  }}>
                    {subjects.map(subject => (
                      <button
                        key={subject.id}
                        onClick={() => {
                          setSelectedSubject(subject.id);
                          setIsSubjectDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          backgroundColor: selectedSubject === subject.id ? '#f0f9ff' : 'transparent',
                          color: selectedSubject === subject.id ? '#005AE0' : '#374151',
                          cursor: 'pointer',
                          textAlign: 'left',
                          borderRadius: subject.id === subjects[0].id ? '8px 8px 0 0' : 
                                      subject.id === subjects[subjects.length - 1].id ? '0 0 8px 8px' : '0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedSubject !== subject.id) {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedSubject !== subject.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <span>{subject.name}</span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{subject.topics} тем</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <a href="/courses" style={{ color: '#6b7280', textDecoration: 'none' }}>
              Курсы
            </a>
            <a href="/teachers" style={{ color: '#6b7280', textDecoration: 'none' }}>
              Преподаватели
            </a>
            <a href="/about" style={{ color: '#6b7280', textDecoration: 'none' }}>
              О школе
            </a>
            <button style={{
              backgroundColor: '#005AE0',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Личный кабинет
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        backgroundColor: '#f6f8ff',
        padding: '80px 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 32px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '64px',
          alignItems: 'center'
        }}>
          {/* Left Content */}
          <div>
            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: '0 0 24px 0',
              lineHeight: '1.1'
            }}>
              Банк заданий для любых уроков — в один клик
            </h1>
            <p style={{
              fontSize: '20px',
              color: '#6b7280',
              margin: '0 0 32px 0',
              lineHeight: '1.6'
            }}>
              50,000 готовых материалов + онлайн-курсы для углубления темы
            </p>
            <button style={{
              backgroundColor: '#005AE0',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              🔍 Найти задание
            </button>
          </div>

          {/* Right Visual */}
          <div style={{ position: 'relative' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              padding: '32px',
              border: '1px solid #e5e7eb'
            }}>
              {/* File Folder Icon */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '32px'
              }}>
                <div style={{
                  width: '128px',
                  height: '128px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '64px' }}>📁</span>
                </div>
              </div>
              
              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#005AE0', marginBottom: '8px' }}>
                    50,000+
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Готовых заданий</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#005AE0', marginBottom: '8px' }}>
                    18
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Предметов ЕГЭ</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#005AE0', marginBottom: '8px' }}>
                    100+
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Онлайн-курсов</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#005AE0', marginBottom: '8px' }}>
                    24/7
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Доступ к материалам</div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div style={{
              position: 'absolute',
              top: '-16px',
              right: '-16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Материалы обновляются</span>
              </div>
            </div>
            
            <div style={{
              position: 'absolute',
              bottom: '-16px',
              left: '-16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#005AE0' }}>⭐</span>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Проверено экспертами</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Math Topics Section - Always Visible by Default */}
      {selectedSubject === 'math' && (
        <section style={{ padding: '64px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: '48px'
            }}>
              Задания по математике (профиль)
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
              {mathTopics.map(topic => {
                const difficultyStyle = getDifficultyColor(topic.difficulty);
                return (
                  <a
                    key={topic.id}
                    href={`/tasks/${topic.id}`}
                    style={{
                      textDecoration: 'none',
                      display: 'block',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb',
                      padding: '24px',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        lineHeight: '1.4'
                      }}>
                        №{topic.id}. {topic.name}
                      </h3>
                      <span style={{
                        ...difficultyStyle,
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500',
                        flexShrink: 0,
                        marginLeft: '12px'
                      }}>
                        {getDifficultyText(topic.difficulty)}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        {topic.count} заданий
                      </span>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: '#f0f9ff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ color: '#005AE0', fontSize: '16px' }}>→</span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Physics Topics Section */}
      {selectedSubject === 'physics' && (
        <section style={{ padding: '64px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: '48px'
            }}>
              Задания по физике
            </h2>
            <div style={{ textAlign: 'center', color: '#6b7280' }}>
              <p>Задания по физике скоро будут добавлены</p>
            </div>
          </div>
        </section>
      )}

      {/* Chemistry Topics Section */}
      {selectedSubject === 'chemistry' && (
        <section style={{ padding: '64px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: '48px'
            }}>
              Задания по химии
            </h2>
            <div style={{ textAlign: 'center', color: '#6b7280' }}>
              <p>Задания по химии скоро будут добавлены</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}