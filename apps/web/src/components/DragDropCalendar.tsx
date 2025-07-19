'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, BookOpen } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'task' | 'lesson' | 'exam';
  color?: string;
  description?: string;
}

interface DragDropCalendarProps {
  events: CalendarEvent[];
  onEventMove: (eventId: string, newStart: Date, newEnd: Date) => void;
  onEventAdd: (event: Omit<CalendarEvent, 'id'>) => void;
  onEventEdit: (eventId: string, event: Partial<CalendarEvent>) => void;
  onEventDelete: (eventId: string) => void;
}

export default function DragDropCalendar({
  events,
  onEventMove,
  onEventAdd,
  onEventEdit,
  onEventDelete
}: DragDropCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState<{ day: Date; hour: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.start, day));
  };

  const getEventStyle = (event: CalendarEvent) => {
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();
    
    const top = ((startHour + startMinute / 60) / 24) * 100;
    const height = (((endHour + endMinute / 60) - (startHour + startMinute / 60)) / 24) * 100;
    
    const colors = {
      task: 'bg-blue-500',
      lesson: 'bg-green-500',
      exam: 'bg-red-500'
    };

    return {
      top: `${top}%`,
      height: `${Math.max(height, 4)}%`,
      backgroundColor: event.color || colors[event.type],
    };
  };

  const handleMouseDown = (event: CalendarEvent, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggedEvent(event);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedEvent || !calendarRef.current) return;

    const calendarRect = calendarRef.current.getBoundingClientRect();
    const x = e.clientX - calendarRect.left;
    const y = e.clientY - calendarRect.top;

    // Calculate which day and hour the mouse is over
    const dayWidth = calendarRect.width / 7;
    const dayIndex = Math.floor(x / dayWidth);
    const hourHeight = calendarRect.height / 24;
    const hour = Math.floor(y / hourHeight);

    if (dayIndex >= 0 && dayIndex < 7 && hour >= 0 && hour < 24) {
      setDropTarget({
        day: weekDays[dayIndex],
        hour: hour,
      });
    } else {
      setDropTarget(null);
    }
  }, [draggedEvent, weekDays]);

  const handleMouseUp = useCallback(() => {
    if (draggedEvent && dropTarget) {
      const duration = draggedEvent.end.getTime() - draggedEvent.start.getTime();
      const newStart = new Date(dropTarget.day);
      newStart.setHours(dropTarget.hour, 0, 0, 0);
      const newEnd = new Date(newStart.getTime() + duration);
      
      onEventMove(draggedEvent.id, newStart, newEnd);
    }

    setDraggedEvent(null);
    setDropTarget(null);
    setDragOffset({ x: 0, y: 0 });
  }, [draggedEvent, dropTarget, onEventMove]);

  const handleCellDoubleClick = (day: Date, hour: number) => {
    const newEvent: Omit<CalendarEvent, 'id'> = {
      title: 'Новая задача',
      start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0),
      end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour + 1, 0),
      type: 'task',
      description: '',
    };
    
    onEventAdd(newEvent);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggedEvent) {
        handleMouseMove(e as any);
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggedEvent) {
        handleMouseUp();
      }
    };

    if (draggedEvent) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedEvent, handleMouseMove, handleMouseUp]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Календарь занятий
        </h2>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-lg font-medium">
            {format(weekStart, 'dd MMMM', { locale: ru })} - {format(addDays(weekStart, 6), 'dd MMMM yyyy', { locale: ru })}
          </span>
          
          <button
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div 
        ref={calendarRef}
        className="relative border border-gray-200 rounded-lg overflow-hidden"
        style={{ height: '600px' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {weekDays.map((day, index) => (
            <div key={index} className="p-3 text-center font-medium">
              <div className="text-sm text-gray-600">
                {format(day, 'EEE', { locale: ru })}
              </div>
              <div className="text-lg font-semibold">
                {format(day, 'dd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="relative" style={{ height: '100%' }}>
          {/* Hour lines */}
          {hours.map(hour => (
            <div
              key={hour}
              className="absolute w-full border-t border-gray-100"
              style={{ top: `${(hour / 24) * 100}%`, height: `${100 / 24}%` }}
            >
              <div className="absolute left-2 top-0 text-xs text-gray-500 bg-white px-1">
                {hour.toString().padStart(2, '0')}:00
              </div>
            </div>
          ))}

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className="absolute border-l border-gray-200"
              style={{
                left: `${(dayIndex / 7) * 100}%`,
                width: `${100 / 7}%`,
                height: '100%'
              }}
            >
              {/* Hour cells */}
              {hours.map(hour => (
                <div
                  key={hour}
                  className={`absolute w-full cursor-pointer hover:bg-blue-50 ${
                    dropTarget && 
                    isSameDay(dropTarget.day, day) && 
                    dropTarget.hour === hour
                      ? 'bg-blue-100 border-2 border-blue-400'
                      : ''
                  }`}
                  style={{
                    top: `${(hour / 24) * 100}%`,
                    height: `${100 / 24}%`
                  }}
                  onDoubleClick={() => handleCellDoubleClick(day, hour)}
                />
              ))}

              {/* Events */}
              {getEventsForDay(day).map(event => (
                <div
                  key={event.id}
                  className={`absolute left-1 right-1 rounded px-2 py-1 text-white text-xs cursor-move hover:opacity-80 ${
                    draggedEvent?.id === event.id ? 'opacity-50' : ''
                  }`}
                  style={getEventStyle(event)}
                  onMouseDown={(e) => handleMouseDown(event, e)}
                  onClick={(e) => handleEventClick(event, e)}
                  title={event.description}
                >
                  <div className="font-medium truncate">{event.title}</div>
                  <div className="text-xs opacity-75">
                    {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">Задачи</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">Занятия</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-600">Экзамены</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Как использовать:</p>
            <ul className="space-y-1">
              <li>• Перетаскивайте события для изменения времени</li>
              <li>• Двойной клик по ячейке для создания нового события</li>
              <li>• Клик по событию для редактирования</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Редактировать событие</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={selectedEvent.title}
                  onChange={(e) => setSelectedEvent({
                    ...selectedEvent,
                    title: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип
                </label>
                <select
                  value={selectedEvent.type}
                  onChange={(e) => setSelectedEvent({
                    ...selectedEvent,
                    type: e.target.value as CalendarEvent['type']
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="task">Задача</option>
                  <option value="lesson">Занятие</option>
                  <option value="exam">Экзамен</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={selectedEvent.description || ''}
                  onChange={(e) => setSelectedEvent({
                    ...selectedEvent,
                    description: e.target.value
                  })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  onEventEdit(selectedEvent.id, selectedEvent);
                  setShowEventModal(false);
                  setSelectedEvent(null);
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Сохранить
              </button>
              <button
                onClick={() => {
                  onEventDelete(selectedEvent.id);
                  setShowEventModal(false);
                  setSelectedEvent(null);
                }}
                className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
              >
                Удалить
              </button>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setSelectedEvent(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}