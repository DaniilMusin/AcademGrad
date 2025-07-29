// Простая in-memory кэш утилита для клиентской стороны
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttlMs: number = 300000) { // 5 минут по умолчанию
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Проверяем, не истек ли кэш
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Очистка устаревших записей
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Глобальный экземпляр кэша
export const clientCache = new SimpleCache();

// Автоматическая очистка каждые 10 минут
if (typeof window !== 'undefined') {
  setInterval(() => {
    clientCache.cleanup();
  }, 600000); // 10 минут
}

// Хук для кэшированных запросов
export function useCachedFetch<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttlMs: number = 300000
): Promise<T> {
  // Проверяем кэш
  const cached = clientCache.get(key);
  if (cached) {
    return Promise.resolve(cached);
  }

  // Делаем запрос и кэшируем результат
  return fetcher().then(data => {
    clientCache.set(key, data, ttlMs);
    return data;
  });
}

// Утилита для создания ключей кэша
export function createCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  
  return `${prefix}:${sortedParams}`;
}