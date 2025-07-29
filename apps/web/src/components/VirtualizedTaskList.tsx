'use client';

import { memo, useMemo, useState, useCallback } from 'react';

interface Task {
  id: string;
  name: string;
  count: number;
}

interface VirtualizedTaskListProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  selectedCounts: Record<string, number>;
  onCountChange: (taskId: string, delta: number) => void;
}

const ITEM_HEIGHT = 80;
const VISIBLE_ITEMS = 10;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const TaskItem = memo(({ 
  task, 
  selectedCount, 
  onCountChange, 
  onTaskClick 
}: { 
  task: Task; 
  selectedCount: number; 
  onCountChange: (taskId: string, delta: number) => void;
  onTaskClick: (taskId: string) => void;
}) => (
  <div 
    className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
    style={{ height: ITEM_HEIGHT }}
    onClick={() => onTaskClick(task.id)}
  >
    <div className="flex-1">
      <h3 className="font-medium text-gray-900">{task.name}</h3>
      <p className="text-sm text-gray-600">{task.count} заданий</p>
    </div>
    
    <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => onCountChange(task.id, -1)}
        className="w-8 h-8 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center"
        disabled={selectedCount === 0}
      >
        −
      </button>
      
      <span className="w-8 text-center font-medium">{selectedCount}</span>
      
      <button
        onClick={() => onCountChange(task.id, 1)}
        className="w-8 h-8 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center"
        disabled={selectedCount >= task.count}
      >
        +
      </button>
    </div>
  </div>
));

TaskItem.displayName = 'TaskItem';

const VirtualizedTaskList = memo(({ 
  tasks, 
  onTaskClick, 
  selectedCounts, 
  onCountChange 
}: VirtualizedTaskListProps) => {
  const [scrollTop, setScrollTop] = useState(0);

  // Вычисляем какие элементы видимы
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / ITEM_HEIGHT);
    const end = Math.min(start + VISIBLE_ITEMS + 2, tasks.length); // +2 для буфера
    return { start, end };
  }, [scrollTop, tasks.length]);

  const visibleTasks = useMemo(() => {
    return tasks.slice(visibleRange.start, visibleRange.end);
  }, [tasks, visibleRange]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = tasks.length * ITEM_HEIGHT;
  const offsetY = visibleRange.start * ITEM_HEIGHT;

  return (
    <div 
      className="relative border border-gray-200 rounded-lg overflow-hidden"
      style={{ height: CONTAINER_HEIGHT }}
    >
      <div
        className="overflow-auto h-full"
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                selectedCount={selectedCounts[task.id] || 0}
                onCountChange={onCountChange}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Индикатор скролла */}
      {tasks.length > VISIBLE_ITEMS && (
        <div className="absolute right-1 top-1 bottom-1 w-1 bg-gray-200 rounded">
          <div 
            className="bg-blue-500 rounded transition-all duration-200"
            style={{
              height: `${(VISIBLE_ITEMS / tasks.length) * 100}%`,
              transform: `translateY(${(scrollTop / (totalHeight - CONTAINER_HEIGHT)) * (CONTAINER_HEIGHT - (CONTAINER_HEIGHT * VISIBLE_ITEMS / tasks.length))}px)`
            }}
          />
        </div>
      )}
    </div>
  );
});

VirtualizedTaskList.displayName = 'VirtualizedTaskList';

export default VirtualizedTaskList;