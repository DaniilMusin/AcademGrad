# 🚀 Быстрое решение конфликтов слияния

## Основные команды для решения конфликтов

### 1. Подготовка
```bash
# Прекратить текущий rebase/merge
git rebase --abort || git merge --abort

# Убедиться что на правильной ветке
git checkout cursor/fix-branch-for-merging-into-main-3dd5

# Обновить main
git checkout main
git pull origin main
git checkout cursor/fix-branch-for-merging-into-main-3dd5
```

### 2. Принудительное решение конфликтов
```bash
# Начать merge с main
git merge main --no-ff --no-commit

# Если есть конфликты, принять нашу версию для всех файлов
git checkout --ours .

# Добавить все файлы
git add .

# Завершить merge
git commit -m "🔧 Resolve merge conflicts with main - prefer feature branch implementation"
```

### 3. Проверка и push
```bash
# Проверить что все в порядке
git status

# Отправить в origin
git push origin cursor/fix-branch-for-merging-into-main-3dd5 --force
```

## Альтернативный подход: Recreate branch

Если конфликты слишком сложные, можно пересоздать ветку:

```bash
# Создать новую ветку от main
git checkout main
git pull origin main
git checkout -b cursor/fix-branch-for-merging-into-main-3dd5-clean

# Применить только нужные изменения
git cherry-pick 1cd5950  # коммит с реализацией MLP

# Решить конфликты если есть
git add .
git commit -m "✅ Реализация приоритетного плана доработок MLP - clean version"

# Заменить старую ветку
git branch -D cursor/fix-branch-for-merging-into-main-3dd5
git branch -m cursor/fix-branch-for-merging-into-main-3dd5
git push origin cursor/fix-branch-for-merging-into-main-3dd5 --force
```

## Главные файлы, которые готовы

1. ✅ **`.env.example`** - Полный файл с переменными окружения
2. ✅ **Workflow файлы** - GitHub Actions настроены
3. ✅ **React компоненты** - Dashboard и onboarding готовы
4. ✅ **Python скрипты** - Импорт задач и embeddings
5. ✅ **Supabase миграции** - Все таблицы и функции

## Если всё равно не работает

1. **Форсировать push нашей версии:**
   ```bash
   git push origin cursor/fix-branch-for-merging-into-main-3dd5 --force
   ```

2. **Создать PR в GitHub UI** - иногда проще решить конфликты в веб-интерфейсе

3. **Связаться с maintainer** - если есть права на push в main

## Проверка готовности

После выполнения команд:
- Нет конфликтов в `git status`
- Ветка синхронизирована с main
- Можно создать PR
- CI проходит успешно

🎯 **Результат**: Ветка готова к слиянию в main без конфликтов!