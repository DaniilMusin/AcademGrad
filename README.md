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

- 📧 Email: support@ege-ai.com
- 💬 Telegram: @ege_ai_support
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/ege-ai-platform/issues)

---

**Проект готов к продакшену** ✅

Полная реализация приоритетного плана доработок завершена. Система готова к масштабированию и активному использованию.
