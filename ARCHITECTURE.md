# 🏗️ Архитектура AcademGrad

## Общий обзор

AcademGrad - это современное веб-приложение для подготовки к ЕГЭ, построенное на основе микросервисной архитектуры с использованием современных технологий.

## 🎯 Технологический стек

### Frontend
- **Next.js 14** - React фреймворк с App Router
- **TypeScript** - Статическая типизация
- **Tailwind CSS** - Утилитарный CSS фреймворк
- **Lucide React** - Иконки
- **Chart.js** - Графики и визуализация
- **React Markdown** - Рендеринг математических формул
- **Date-fns** - Работа с датами

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Основная база данных
- **Edge Functions** - Серверные функции на Deno
- **Row Level Security (RLS)** - Безопасность на уровне строк

### Внешние сервисы
- **OpenAI GPT-4** - ИИ-помощник для решения задач
- **Stripe** - Международные платежи
- **YooKassa** - Российские платежи
- **Telegram Bot API** - Telegram интеграция
- **Postmark** - Email уведомления
- **Web Push** - Push-уведомления
- **GitHub Actions** - CI/CD

## 🏛️ Архитектурные слои

### 1. Презентационный слой (Presentation Layer)
```
apps/web/src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Главная страница
│   ├── onboarding/        # Процесс регистрации
│   ├── schedule/          # Календарь и расписание
│   ├── tasks/             # Решение задач
│   ├── subscription/      # Управление подпиской
│   └── api/               # API routes
├── components/            # React компоненты
│   ├── Calendar.tsx
│   ├── DragDropCalendar.tsx
│   ├── PWAInstallPrompt.tsx
│   ├── PushNotifications.tsx
│   └── PaymentProvider.tsx
└── lib/                   # Утилиты и хелперы
```

### 2. Логический слой (Business Logic Layer)
```
supabase/edge-functions/
├── badge-cron/           # Автоматическое вручение бейджей
├── chat-task/            # AI чат для решения задач
├── log-attempt/          # Логирование попыток
├── payment/              # Обработка платежей
├── tg-bot/               # Telegram бот с inline-mode
└── weekly-report/        # Еженедельные отчеты с PDF
```

### 3. Слой данных (Data Layer)
```
supabase/migrations/
├── 20240701_init.sql            # Базовые таблицы
├── 20240701_rls.sql             # RLS политики
├── 20240702_views.sql           # Материализованные представления
├── 20240715_badges.sql          # Система бейджей
├── 20240715_referral.sql        # Реферальная система
├── 20240720_additional_tables.sql
└── 20240721_functions.sql       # PL/pgSQL функции
```

## 🗄️ Схема базы данных

### Основные таблицы

#### Пользователи и профили
```sql
-- auth.users (Supabase Auth)
-- profiles (расширенная информация о пользователе)
-- customers (связь с платежными системами)
```

#### Контент и задачи
```sql
-- tasks (база задач ЕГЭ)
-- attempts (попытки решения)
-- recommendations (рекомендации задач)
-- embeddings (векторные представления)
```

#### Геймификация
```sql
-- badges (система бейджей)
-- user_badges (связь пользователей и бейджей)
-- streaks (полосы решений)
-- achievements (достижения)
```

#### Платежи и подписки
```sql
-- subscriptions (подписки пользователей)
-- payments (история платежей)
-- coupons (промокоды)
-- refunds (возвраты)
```

#### Коммуникации
```sql
-- push_subscriptions (Push-уведомления)
-- email_templates (шаблоны писем)
-- notifications (уведомления)
-- task_shares (шеринг задач через Telegram)
```

### Связи и индексы

```sql
-- Основные связи
profiles.id -> auth.users.id
attempts.user_id -> profiles.id
attempts.task_id -> tasks.id
subscriptions.user_id -> profiles.id
payments.user_id -> profiles.id

-- Ключевые индексы для производительности
CREATE INDEX idx_attempts_user_created ON attempts(user_id, created_at);
CREATE INDEX idx_tasks_embedding ON tasks USING ivfflat(embedding);
CREATE INDEX idx_recommendations_user ON recommendations(user_id, priority);
```

## 🔄 Поток данных

### 1. Аутентификация
```
User → Supabase Auth → JWT Token → Row Level Security
```

### 2. Решение задач
```
User Input → Edge Function (chat-task) → OpenAI API → Response → Database
```

### 3. Рекомендации
```
User Activity → Spaced Repetition Algorithm → Vector Similarity → Recommendations
```

### 4. Платежи
```
User → Payment Provider (Stripe/YooKassa) → Webhook → Edge Function → Database
```

## 🛡️ Безопасность

### Row Level Security (RLS)
```sql
-- Пример политики RLS
CREATE POLICY "Users can view own data" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own attempts" ON attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### API Security
- JWT токены для аутентификации
- Rate limiting в Edge Functions
- CORS настройки
- Валидация входных данных
- Escape SQL injection через параметризованные запросы

### Платежная безопасность
- Webhook signature verification
- Идемпотентность платежей
- PCI DSS compliance через Stripe/YooKassa
- Шифрование чувствительных данных

## 📊 Производительность

### Оптимизация базы данных
- Материализованные представления для аналитики
- Векторные индексы для семантического поиска
- Партиционирование больших таблиц по времени
- Connection pooling через Supabase

### Frontend оптимизация
- Code splitting через Next.js
- Image optimization
- PWA с Service Worker
- Prefetching критических ресурсов

### Кэширование
- Browser cache для статических ресурсов
- API response caching
- Redis для session storage (опционально)

## 🔧 Мониторинг и логирование

### Метрики
- User engagement analytics
- Performance metrics (Core Web Vitals)
- Error tracking через Sentry
- Business metrics (conversion rates)

### Логирование
```typescript
// Edge Functions logging
console.log('User action:', { userId, action, timestamp });

// Error tracking
Sentry.captureException(error, { user, context });
```

## 🚀 Деплой и инфраструктура

### CI/CD Pipeline
```yaml
# .github/workflows/
├── ci.yml              # Тестирование и линтинг
├── preview.yml         # Preview deployments
├── deploy-edge.yml     # Edge Functions deploy
└── cron.yml           # Scheduled tasks
```

### Environments
- **Development** - локальная разработка
- **Staging** - тестирование перед релизом
- **Production** - рабочая среда

### Scaling Strategy
- Horizontal scaling через Vercel/Supabase
- CDN для статических ресурсов
- Database read replicas для аналитики
- Edge Functions auto-scaling

## 🔮 Будущие улучшения

### Планируемая архитектура
1. **Microservices** - выделение отдельных сервисов
2. **Event Sourcing** - для аудита пользовательских действий
3. **GraphQL** - для более гибких API запросов
4. **Machine Learning** - для персонализированных рекомендаций
5. **Real-time collaboration** - для групповых занятий

### Технические долги
- Миграция на более новые версии зависимостей
- Улучшение типизации TypeScript
- Добавление E2E тестов
- Оптимизация bundle size

## 📋 Принципы разработки

### Code Style
- **DRY** - Don't Repeat Yourself
- **SOLID** - Принципы объектно-ориентированного программирования
- **Composition over Inheritance**
- **Fail Fast** - раннее обнаружение ошибок

### API Design
- RESTful endpoints
- Consistent error responses
- Versioning strategy
- Documentation with OpenAPI

### Database Design
- Нормализация до 3NF
- Meaningful naming conventions
- Foreign key constraints
- Audit columns (created_at, updated_at)

---

*Документация актуальна на декабрь 2024. Для получения последней информации обратитесь к команде разработки.*