
# 🎯 EGE AI Learning Platform

Интеллектуальная платформа для подготовки к ЕГЭ и ОГЭ с AI-чатом, spaced repetition и аналитикой.

## ✨ Функции

- 🤖 **AI-чат** с RAG для помощи в решении задач
- 📊 **Аналитика** слабых мест и прогресса
- 🎯 **Spaced repetition** для эффективного повторения
- 🏆 **Система бейджей** и мотивации
- 📱 **PWA** с оффлайн-режимом
- 🤖 **Telegram бот** для уведомлений
- 📄 **PDF отчеты** о прогрессе
- 💳 **Stripe** для подписок

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- Python 3.11+
- Supabase CLI
- Docker (для локальной разработки)

### Локальная разработка

1. **Клонирование и установка**
   ```bash
   git clone https://github.com/your-username/ege-ai-platform.git
   cd ege-ai-platform
   npm install
   cd apps/web && npm install && cd ../..
   ```

2. **Настройка переменных окружения**
   ```bash
   cp .env.example .env.local
   # Отредактируйте .env.local с вашими ключами
   ```

   **Основные переменные:**
   - `NEXT_PUBLIC_SUPABASE_URL` - URL вашего Supabase проекта
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Анонимный ключ Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` - Сервисный ключ Supabase
   - `OPENAI_API_KEY` - Ключ OpenAI для AI-чата
   - `STRIPE_SECRET_KEY` - Секретный ключ Stripe
   - `TELEGRAM_BOT_TOKEN` - Токен Telegram бота
   - `POSTMARK_TOKEN` - Токен Postmark для отправки email
   - `NEXT_PUBLIC_SENTRY_DSN` - DSN для Sentry мониторинга

3. **Запуск Supabase**
   ```bash
   supabase start
   supabase db reset
   ```

4. **Импорт задач и создание эмбеддингов**
   ```bash
   # Создайте папку tasks с markdown файлами
   mkdir tasks
   # Добавьте файлы задач в формате: тема_подтема_сложность.md
   
   # Установите зависимости Python
   pip install -r scripts/requirements.txt
   
   # Импорт задач
   python scripts/import_tasks.py
   
   # Создание эмбеддингов
   python scripts/embed_chunks.py
   ```

5. **Запуск приложения**
   ```bash
   cd apps/web
   npm run dev
   ```

   Откройте [http://localhost:3000](http://localhost:3000)

## 📁 Структура проекта

```
├── apps/
│   └── web/                 # Next.js приложение
├── supabase/
│   ├── migrations/          # SQL миграции
│   ├── edge-functions/      # Serverless функции
│   └── seed/               # Начальные данные
├── scripts/                # Python скрипты
│   ├── import_tasks.py     # Импорт задач из Markdown
│   ├── embed_chunks.py     # Создание эмбеддингов
│   ├── spaced_repetition.py # Планирование повторений
│   └── generate_pdf.py     # Генерация PDF отчетов
├── .github/workflows/      # GitHub Actions
└── docker/                 # Docker конфигурация
```

## 🗄️ База данных

### Миграции

```bash
# Применить миграции
supabase db push

# Создать новую миграцию
supabase db diff -f new_feature

# Сбросить локальную БД
supabase db reset
```

### Основные таблицы

- `tasks` - задачи ЕГЭ/ОГЭ
- `task_chunks` - части решений с эмбеддингами
- `attempts` - попытки решения пользователей
- `events` - события для аналитики
- `recommendations` - рекомендации для повторения
- `badges` / `user_badges` - система достижений
- `lesson_reports` - недельные отчеты

## 🔧 Edge Functions

### Локальная разработка

```bash
# Запуск всех функций
supabase functions serve

# Запуск конкретной функции
supabase functions serve chat-task
```

### Тестирование

```bash
# Тест чата
curl -X POST http://localhost:54321/functions/v1/chat-task \
  -H "Content-Type: application/json" \
  -d '{"task_id": 1, "question": "Как решить эту задачу?"}'

# Тест логирования попыток
curl -X POST http://localhost:54321/functions/v1/log-attempt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"task_id": 1, "answer_submitted": "42", "is_correct": true}'
```

## 📱 PWA

Приложение поддерживает:
- Установку как PWA
- Оффлайн-режим
- Push-уведомления
- Кеширование задач

### Установка PWA

1. **Пользователи Chrome/Edge:**
   - Нажмите на иконку "Установить" в адресной строке
   - Или через меню: "Установить приложение"

2. **Пользователи Safari:**
   - Нажмите "Поделиться" → "На экран «Домой»"

3. **Пользователи Firefox:**
   - Нажмите меню → "Установить"

### Настройка Service Worker

Service Worker автоматически кеширует:
- Страницы приложения
- Статические ресурсы
- API ответы (временно)

Для очистки кеша: `Настройки → Очистить данные приложения`

## 🤖 Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Добавьте токен в переменные окружения
3. Настройте webhook:
   ```bash
   curl -X POST https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-project.supabase.co/functions/v1/tg-bot"}'
   ```

## 💳 Stripe Integration

1. Создайте аккаунт в [Stripe](https://stripe.com)
2. Добавьте ключи в переменные окружения
3. Настройте webhook endpoint:
   ```
   https://your-project.supabase.co/functions/v1/payment
   ```

## 🚀 Deploy

### Vercel (Frontend)

1. **Подключите GitHub репозиторий**
2. **Настройте переменные окружения**
3. **Настройте build command:**
   ```bash
   cd apps/web && npm run build
   ```

### Supabase (Backend)

1. **Создайте проект** в [Supabase](https://supabase.com)
2. **Примените миграции:**
   ```bash
   supabase db push --project-ref YOUR_PROJECT_REF
   ```
3. **Деплой Edge Functions:**
   ```bash
   supabase functions deploy --project-ref YOUR_PROJECT_REF
   ```

## 📊 Мониторинг

### Sentry

Добавьте в `apps/web/pages/_app.tsx`:
```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
});
```

### Логи

```bash
# Просмотр логов Edge Functions
supabase functions logs chat-task

# Просмотр логов БД
supabase logs --type database
```

## 🔄 Автоматизация

### GitHub Actions

- **CI/CD:** линтинг, тесты, деплой
- **Cron jobs:** обновление эмбеддингов, вручение бейджей, генерация отчетов

### Локальные cron-задачи

```bash
# Обновление рекомендаций
python scripts/spaced_repetition.py

# Генерация отчетов
python scripts/generate_pdf.py

# Обновление эмбеддингов
python scripts/embed_chunks.py
```

### Настройка cron в production

```bash
# Добавить в crontab
crontab -e

# Обновление рекомендаций каждые 6 часов
0 */6 * * * cd /path/to/project && python scripts/spaced_repetition.py

# Генерация отчетов каждое воскресенье в 9:00
0 9 * * 0 cd /path/to/project && python scripts/generate_pdf.py

# Обновление эмбеддингов каждую ночь в 02:00
0 2 * * * cd /path/to/project && python scripts/embed_chunks.py
```

### Docker разработка

```bash
# Запуск с Docker Compose
docker-compose up

# Запуск только БД
docker-compose up postgres redis

# Пересборка контейнеров
docker-compose up --build
```

## 🧪 Тестирование

### Unit тесты (Vitest)

```bash
cd apps/web
npm run test          # Запуск тестов
npm run test:ui      # Запуск с UI интерфейсом
npm run test:coverage # Запуск с покрытием кода
```

### E2E тесты (Playwright)

```bash
# Установка браузеров
npx playwright install

# Запуск E2E тестов
npm run test:e2e

# Запуск в интерактивном режиме
npx playwright test --ui
```

### Backend тесты

```bash
# Тесты БД
supabase test db

# Тесты Edge Functions
supabase functions test
```

### Структура тестов

```
src/test/
├── setup.ts           # Настройка тестового окружения
├── utils.test.ts      # Unit тесты для utils
└── e2e/               # E2E тесты
    └── app.spec.ts    # Основные пользовательские сценарии
```

## 📚 Документация API

### Edge Functions

- `POST /functions/v1/chat-task` - AI чат
- `POST /functions/v1/log-attempt` - логирование попыток
- `POST /functions/v1/payment` - обработка платежей
- `POST /functions/v1/tg-bot` - Telegram webhook

### Database Functions

- `match_task_chunks(query_embedding, match_count, taskid)` - поиск похожих chunks

## 🤝 Разработка

### Добавление новых задач

1. Создайте markdown файл в папке `tasks/`
2. Формат: `тема_подтема_сложность.md`
3. Структура файла:
   ```markdown
   # Условие
   Текст задачи...
   
   # Ответ
   Правильный ответ
   
   # Решение
   Подробное решение...
   ```
4. Запустите импорт: `python scripts/import_tasks.py`

### Добавление новых фич

1. Создайте ветку: `git checkout -b feature/new-feature`
2. Внесите изменения
3. Добавьте тесты
4. Создайте PR
=======
# � EGE AI Platform

> **Обновлено**: Реализован полный приоритетный план доработок MLP (Minimum Lovable Product)

Интеллектуальная платформа для подготовки к ЕГЭ и ОГЭ с персонализированным обучением, геймификацией и AI-чатом.

## 🚀 Что нового

### ✅ Полностью реализованные компоненты

- **🎯 Dashboard**: Персональный кабинет с прогрессом и достижениями
- **📋 Onboarding**: 4-шаговый визард настройки обучения
- **📅 Расписание**: Умное планирование на основе слабых тем
- **🏆 Система бейджей**: 15 различных достижений для мотивации
- **📝 YAML-задачи**: Современный формат импорта с метаданными
- **� CI/CD**: Автоматизированные процессы с GitHub Secrets
- **🔗 Preview**: Vercel Preview для Pull Request'ов

## �️ Быстрый старт

### 1. Клонирование и установка

```bash
git clone https://github.com/your-username/ege-ai-platform.git
cd ege-ai-platform

# Установка зависимостей фронтенда
cd apps/web
npm install

# Установка зависимостей скриптов
cd ../../scripts
pip install -r requirements.txt
```

### 2. Настройка переменных окружения

```bash
# В корне проекта
cp .env.example .env.local

# В apps/web
cp .env.example .env.local
```

**Заполните переменные:**

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Stripe (опционально)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Telegram (опционально)
TELEGRAM_BOT_TOKEN=your_bot_token
```

### 3. Настройка Supabase

```bash
# Установка Supabase CLI
npm install -g supabase

# Запуск локального окружения
supabase start

# Применение миграций
supabase db push

# Или подключение к существующему проекту
supabase link --project-ref your-project-ref
```

### 4. Импорт задач

```bash
# Создать папку для задач
mkdir tasks

# Импорт задач в новом формате YAML
python scripts/import_tasks.py

# Создание эмбеддингов для AI-чата
python scripts/embed_chunks.py
```

### 5. Запуск приложения

```bash
cd apps/web
npm run dev
```

Приложение будет доступно на `http://localhost:3000`

## 📁 Структура проекта

```
ege-ai-platform/
├── apps/web/                    # Next.js фронтенд
│   ├── src/app/
│   │   ├── dashboard/          # ✅ Личный кабинет
│   │   ├── onboarding/         # ✅ Визард настройки
│   │   ├── schedule/           # ✅ Расписание
│   │   └── tasks/              # Решение задач
│   └── src/components/         # React компоненты
├── supabase/
│   ├── migrations/             # ✅ Миграции БД
│   └── edge-functions/         # ✅ Серверные функции
├── scripts/                    # ✅ Python скрипты
├── tasks/                      # ✅ Задачи в YAML формате
└── .github/workflows/          # ✅ CI/CD
```

## 🎮 Новые возможности

### 🏆 Система бейджей

15 различных достижений для мотивации:

- 🔥 **Стрик-бейджи**: 5, 10, 30 дней подряд
- ⚡ **Скорость**: Быстрое решение задач
- 🎯 **Точность**: Идеальные серии решений
- 🌙 **Время**: Сова (вечер) и Жаворонок (утро)
- 🏆 **Активность**: Выходной воин
- 🎓 **Мастерство**: Освоение тем на 95%
- 💯 **Достижения**: 100 задач, марафон
- ✅ **Прогресс**: Первые успехи
- � **Возвращение**: После перерыва
- 🗺️ **Исследование**: Изучение всех тем

### 📋 Onboarding

4-шаговый процесс настройки:

1. **Выбор экзамена**: ЕГЭ или ОГЭ
2. **Предметы**: Автоматическое выделение обязательных
3. **Уровень**: Оценка знаний и времени
4. **Настройки**: Уведомления и финальная настройка

### 📅 Умное расписание

Персонализированное планирование на основе:
- Слабых тем пользователя
- Интервального повторения
- Приоритетов задач
- Индивидуального прогресса

### � YAML-задачи

Новый формат с богатыми метаданными:

```yaml
---
exam: ege
topic: Тригонометрия
subtopic: Тригонометрические уравнения
difficulty: 3
answer: "pi/4"
points: 1
time_limit: 15
tags: ["тригонометрия", "уравнения"]
---

# Условие
[Условие задачи]

# Решение
[Подробное решение]
```

## 🔧 Разработка

### Добавление новых задач

1. Создайте файл в папке `tasks/` с YAML frontmatter
2. Запустите импорт: `python scripts/import_tasks.py`
3. Создайте эмбеддинги: `python scripts/embed_chunks.py`

### Создание Pull Request

1. Создайте ветку: `git checkout -b feature/new-feature`
2. Внесите изменения
3. Откройте PR - автоматически создастся Vercel Preview
4. Пройдите проверку Lighthouse CI

### Настройка CI/CD

Добавьте в GitHub Secrets:

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_PROJECT_REF
SUPABASE_ACCESS_TOKEN
OPENAI_API_KEY
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## 🎯 Roadmap

### Следующие фичи

- [ ] Мобильное приложение
- [ ] Голосовой ввод
- [ ] Видео-объяснения
- [ ] Соцсети интеграция
- [ ] Групповые занятия
- [ ] Репетиторы онлайн

### Улучшения

- [ ] Темная тема
- [ ] Экспорт прогресса
- [ ] Родительский контроль
- [ ] Статистика преподавателей
- [ ] A/B тестирование

## 🤝 Участие в разработке

1. Fork проекта
2. Создайте ветку (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📊 Технологии

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase, PostgreSQL, Edge Functions
- **AI**: OpenAI GPT-4, Embeddings, RAG
- **Deployment**: Vercel, Supabase
- **CI/CD**: GitHub Actions, Lighthouse CI
- **Monitoring**: Sentry, Vercel Analytics


## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 🆘 Поддержка


- Создайте [Issue](https://github.com/your-username/ege-ai-platform/issues)
- Напишите в [Discussions](https://github.com/your-username/ege-ai-platform/discussions)

## 🙏 Благодарности

- [Supabase](https://supabase.com) - backend-as-a-service
- [OpenAI](https://openai.com) - AI модели
- [Vercel](https://vercel.com) - хостинг
- [Stripe](https://stripe.com) - платежи
=======
- 📧 Email: support@ege-ai.com
- 💬 Telegram: @ege_ai_support
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/ege-ai-platform/issues)

---

**Проект готов к продакшену** ✅


