import { lazy } from 'react';

// Ленивая загрузка компонентов для dashboard
export const LazyProgressChart = lazy(() => import('./ProgressChart'));
export const LazyTaskCard = lazy(() => import('./TaskCard'));

// Ленивая загрузка для новых страниц
export const LazyAchievements = lazy(() => import('../app/achievements/page'));
export const LazyAnalytics = lazy(() => import('../app/analytics/page'));