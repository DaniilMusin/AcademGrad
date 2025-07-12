### Быстрый старт

```bash
git clone https://github.com/you/ege-ai-platform.git
cd ege-ai-platform
pnpm install
supabase start            # локальный Postgres + Studio
supabase db reset         # применит миграции
python scripts/embed_chunks.py
pnpm --filter @apps/web dev
```

Открыть: [http://localhost:3000/tasks/1](http://localhost:3000/tasks/1)

### Deploy (Vercel)

1. `vercel link`
2. `vercel env pull`
3. Set build command: `pnpm --filter @apps/web build`

