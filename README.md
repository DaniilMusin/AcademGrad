# AcademGrad

Пример минимальной структуры проекта подготовки к экзаменам с Supabase и Next.js.

```
.
├─ .github/workflows/      # автоматизация CI/cron
├─ supabase/               # миграции и edge functions
├─ apps/web/               # фронтенд на Next.js
├─ scripts/                # утилиты импорта и ML
└─ docker/                 # образ для python
```

Запуск локально:

```bash
pnpm install
supabase start
python scripts/import_tasks.py
```
