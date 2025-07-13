# 🔧 Инструкции по решению конфликтов в PR

## Проблема
В PR есть конфликты между:
- **Main branch**: Упрощенные версии компонентов из первого неполного PR
- **Feature branch**: Полные версии из оригинальной реализации

## 🎯 Конфликтные файлы:
- `apps/web/src/app/onboarding/step-1/page.tsx`
- `apps/web/src/app/onboarding/step-2/page.tsx`
- `apps/web/src/app/onboarding/step-3/page.tsx`
- `apps/web/src/app/onboarding/step-4/page.tsx`
- `apps/web/src/components/GamificationBar.tsx`
- `apps/web/src/components/OnboardingWizard.tsx`

## 🚀 Решение: Использовать полные версии

**Для ВСЕХ конфликтных файлов нужно выбрать версию из feature branch** (полную реализацию из оригинальной ветки).

### Вариант 1: Через GitHub Web Editor

1. **Открыть PR** на GitHub
2. **Нажать "Resolve conflicts"**
3. **Для каждого файла**:
   - Найти конфликтные секции между `<<<<<<< HEAD` и `>>>>>>> feature-branch`
   - **Удалить** версию из HEAD (main branch)
   - **Оставить** версию из feature branch
   - **Удалить** маркеры конфликтов (`<<<<<<<`, `=======`, `>>>>>>>`)

### Вариант 2: Через командную строку

```bash
# 1. Клонировать ветку локально
git checkout feature/complete-mlp-all-changes
git pull origin feature/complete-mlp-all-changes

# 2. Merge main и разрешить конфликты
git merge main

# 3. Для каждого конфликтного файла выбрать нашу версию
git checkout --ours apps/web/src/app/onboarding/step-1/page.tsx
git checkout --ours apps/web/src/app/onboarding/step-2/page.tsx
git checkout --ours apps/web/src/app/onboarding/step-3/page.tsx
git checkout --ours apps/web/src/app/onboarding/step-4/page.tsx
git checkout --ours apps/web/src/components/GamificationBar.tsx
git checkout --ours apps/web/src/components/OnboardingWizard.tsx

# 4. Добавить файлы и закоммитить
git add .
git commit -m "🔧 Resolve merge conflicts - use full implementation versions"

# 5. Отправить в GitHub
git push origin feature/complete-mlp-all-changes
```

### Вариант 3: Пересоздать ветку (РЕКОМЕНДУЕТСЯ)

```bash
# 1. Создать новую чистую ветку от текущего main
git checkout main
git pull origin main
git checkout -b feature/complete-mlp-final

# 2. Копировать ТОЛЬКО нужные файлы из оригинальной ветки
# (исключив те, что уже есть в main)

# 3. Создать новый PR
```

## 🎯 Какие версии оставить:

### ✅ Оставить (из feature branch - полные версии):
- **Onboarding pages**: Полные 4-шаговые компоненты с выбором экзамена, предметов, уровня
- **GamificationBar**: Полная версия с прогрессом, стриками, бейджами  
- **OnboardingWizard**: Удалить (заменена на отдельные step-страницы)

### ❌ Удалить (из main - упрощенные версии):
- Упрощенные версии компонентов из первого PR

## 🚀 После разрешения конфликтов:

**Результат:** PR будет содержать полную реализацию MLP enhancement plan:
- ✅ **35 файлов изменений**
- ✅ **16,896+ строк кода**
- ✅ **Полная геймификация**
- ✅ **Все UI компоненты**
- ✅ **Все миграции БД**
- ✅ **CI/CD оптимизация**

## 💡 Рекомендация:

**Самый простой способ** - использовать **Вариант 3** (пересоздать ветку), чтобы избежать конфликтов полностью.

Хотите, чтобы я создал новую чистую ветку без конфликтов?