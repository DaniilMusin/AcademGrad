'use client';

import { useState, useRef, useCallback } from 'react';
import { format, startOfWeek, addDays, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  description?: string;
  type: 'lesson' | 'homework' | 'exam' | 'break';
}

interface DragData {
  eventId: string;
  startTime: Date;
  offset: { x: number; y: number };
}

interface DraggableCalendarProps {
  events: CalendarEvent[];
  onEventUpdate: (eventId: string, newStart: Date, newEnd: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  weekStartDate?: Date;
  timeSlotHeight?: number;
  startHour?: number;
  endHour?: number;
}

const eventColors = {
  lesson: 'bg-blue-500 border-blue-600',
  homework: 'bg-green-500 border-green-600',
  exam: 'bg-red-500 border-red-600',
  break: 'bg-gray-400 border-gray-500'
};

export default function DraggableCalendar({
  events,
  onEventUpdate,
  onEventClick,
  weekStartDate = startOfWeek(new Date(), { locale: ru }),
  timeSlotHeight = 60,
  startHour = 8,
  endHour = 20
}: DraggableCalendarProps) {
  const [dragData, setDragData] = useState<DragData | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const getEventStyle = (event: CalendarEvent, dayStart: Date) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
    const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
    const dayStartMinutes = startHour * 60;
    
    const top = ((startMinutes - dayStartMinutes) / 60) * timeSlotHeight;
    const height = ((endMinutes - startMinutes) / 60) * timeSlotHeight;
    
    return {
      top: `${Math.max(0, top)}px`,
      height: `${Math.max(20, height)}px`,
      position: 'absolute' as const,
      left: '4px',
      right: '4px',
      zIndex: draggedEvent?.id === event.id ? 50 : 10
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, event: CalendarEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    setDragData({
      eventId: event.id,
      startTime: new Date(event.start),
      offset
    });
    setDraggedEvent(event);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragData || !calendarRef.current) return;
    
    const calendarRect = calendarRef.current.getBoundingClientRect();
    const dayWidth = calendarRect.width / 7;
    
    // Calculate which day column we're over
    const relativeX = e.clientX - calendarRect.left;
    const dayIndex = Math.floor(relativeX / dayWidth);
    
    if (dayIndex >= 0 && dayIndex < 7) {
      const targetDay = days[dayIndex];
      
      // Calculate time based on Y position
      const relativeY = e.clientY - calendarRect.top - dragData.offset.y;
      const headerHeight = 60; // Approximate header height
      const timeY = relativeY - headerHeight;
      
      const hoursFromTop = timeY / timeSlotHeight;
      const newHour = Math.max(startHour, Math.min(endHour - 1, startHour + hoursFromTop));
      const minutes = Math.round((newHour % 1) * 60 / 15) * 15; // Snap to 15-minute intervals
      
      const newStart = new Date(targetDay);
      newStart.setHours(Math.floor(newHour), minutes, 0, 0);
      
      // Update dragged event position
      if (draggedEvent) {
        const duration = new Date(draggedEvent.end).getTime() - new Date(draggedEvent.start).getTime();
        const newEnd = new Date(newStart.getTime() + duration);
        
        setDraggedEvent({
          ...draggedEvent,
          start: newStart,
          end: newEnd
        });
      }
    }
  }, [dragData, draggedEvent, days, startHour, endHour, timeSlotHeight]);

  const handleMouseUp = useCallback(() => {
    if (dragData && draggedEvent) {
      // Find original event
      const originalEvent = events.find(e => e.id === dragData.eventId);
      if (originalEvent) {
        const duration = new Date(originalEvent.end).getTime() - new Date(originalEvent.start).getTime();
        const newEnd = new Date(draggedEvent.start.getTime() + duration);
        
        onEventUpdate(dragData.eventId, draggedEvent.start, newEnd);
      }
    }
    
    setDragData(null);
    setDraggedEvent(null);
  }, [dragData, draggedEvent, events, onEventUpdate]);

  // Add global mouse event listeners
  React.useEffect(() => {
    if (dragData) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragData, handleMouseMove, handleMouseUp]);

  const getEventsForDay = (day: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.start), day)
    );
  };

  const timeToPosition = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = startHour * 60;
    return ((totalMinutes - startMinutes) / 60) * timeSlotHeight;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
        <h2 className="text-xl font-semibold">
          Расписание на неделю
        </h2>
        <p className="text-sm opacity-90">
          {format(weekStartDate, 'dd MMMM', { locale: ru })} - {format(addDays(weekStartDate, 6), 'dd MMMM yyyy', { locale: ru })}
        </p>
      </div>

      {/* Calendar Grid */}
      <div ref={calendarRef} className="relative overflow-auto max-h-[600px]">
        {/* Days Header */}
        <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
          <div className="p-3 text-sm font-medium text-gray-500">Время</div>
          {days.map((day, index) => (
            <div key={index} className="p-3 text-center border-l border-gray-200">
              <div className="text-sm font-medium text-gray-900">
                {format(day, 'EEEE', { locale: ru })}
              </div>
              <div className="text-lg font-bold text-gray-900">
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="grid grid-cols-8">
          {/* Time Column */}
          <div className="border-r border-gray-200">
            {hours.map((hour) => (
              <div
                key={hour}
                className="border-b border-gray-100 flex items-center justify-center text-sm text-gray-500"
                style={{ height: `${timeSlotHeight}px` }}
              >
                {format(new Date().setHours(hour, 0), 'HH:mm')}
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="border-r border-gray-200 relative">
              {/* Time Slots */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  style={{ height: `${timeSlotHeight}px` }}
                />
              ))}

              {/* Events */}
              {getEventsForDay(day).map((event) => {
                // Use dragged event if this event is being dragged
                const displayEvent = draggedEvent?.id === event.id ? draggedEvent : event;
                
                return (
                  <div
                    key={event.id}
                    className={`
                      ${eventColors[event.type]} 
                      text-white text-xs p-2 rounded cursor-move border-l-4 
                      hover:shadow-lg transition-all duration-200
                      ${draggedEvent?.id === event.id ? 'opacity-80 transform scale-105' : ''}
                      select-none
                    `}
                    style={getEventStyle(displayEvent, day)}
                    onMouseDown={(e) => handleMouseDown(e, event)}
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="font-semibold truncate">{event.title}</div>
                    <div className="opacity-90">
                      {format(new Date(displayEvent.start), 'HH:mm')} - {format(new Date(displayEvent.end), 'HH:mm')}
                    </div>
                    {event.description && (
                      <div className="opacity-80 text-xs mt-1 truncate">
                        {event.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm">
          {Object.entries(eventColors).map(([type, colorClass]) => (
            <div key={type} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded ${colorClass.split(' ')[0]}`}></div>
              <span className="capitalize text-gray-700">
                {{
                  lesson: 'Урок',
                  homework: 'Домашнее задание',
                  exam: 'Экзамен',
                  break: 'Перерыв'
                }[type as keyof typeof eventColors]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}