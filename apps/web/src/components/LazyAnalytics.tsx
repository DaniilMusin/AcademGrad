'use client';

import { lazy, Suspense } from 'react';

// Lazy загружаемые компоненты
const PersonalAnalytics = lazy(() => import('./PersonalAnalytics'));
const TaskHistory = lazy(() => import('./TaskHistory'));

// Компоненты загрузки
const AnalyticsLoader = () => (
  <div className="animate-pulse space-y-6 p-6">
    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 rounded"></div>
      ))}
    </div>
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
);

const HistoryLoader = () => (
  <div className="animate-pulse space-y-4 p-6">
    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-20 bg-gray-200 rounded"></div>
    ))}
  </div>
);

interface LazyPersonalAnalyticsProps {
  className?: string;
}

export const LazyPersonalAnalytics = ({ className }: LazyPersonalAnalyticsProps) => (
  <Suspense fallback={<AnalyticsLoader />}>
    <PersonalAnalytics className={className} />
  </Suspense>
);

interface LazyTaskHistoryProps {
  className?: string;
  limit?: number;
  showFilters?: boolean;
}

export const LazyTaskHistory = ({ className, limit, showFilters }: LazyTaskHistoryProps) => (
  <Suspense fallback={<HistoryLoader />}>
    <TaskHistory className={className} limit={limit} showFilters={showFilters} />
  </Suspense>
);

// Дополнительные ленивые компоненты
export const LazyProgressChart = lazy(() => import('./ProgressChart'));
export const LazyTaskChat = lazy(() => import('./TaskChat'));
export const LazyNotificationCenter = lazy(() => import('./NotificationCenter'));

// Обертки с Suspense
export const LazyProgressChartWithSuspense = ({ data }: { data: number[] }) => (
  <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded"></div>}>
    <LazyProgressChart data={data} />
  </Suspense>
);

export const LazyTaskChatWithSuspense = ({ 
  taskId, 
  taskTitle, 
  taskStatement 
}: { 
  taskId: string; 
  taskTitle: string; 
  taskStatement: string; 
}) => (
  <Suspense fallback={
    <div className="h-96 bg-gray-100 animate-pulse rounded flex items-center justify-center">
      <div className="text-gray-400">Загрузка чата...</div>
    </div>
  }>
    <LazyTaskChat 
      taskId={taskId} 
      taskTitle={taskTitle} 
      taskStatement={taskStatement} 
    />
  </Suspense>
);

export const LazyNotificationCenterWithSuspense = () => (
  <Suspense fallback={
    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
  }>
    <LazyNotificationCenter />
  </Suspense>
);