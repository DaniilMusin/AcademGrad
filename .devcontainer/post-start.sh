#!/bin/bash

echo "🔄 Запуск среды разработки AcademGrad..."

# Проверка доступности сервисов
echo "🔍 Проверка сервисов..."

# Проверка Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js доступен: $(node --version)"
else
    echo "❌ Node.js не найден"
fi

# Проверка Python
if command -v python3 &> /dev/null; then
    echo "✅ Python доступен: $(python3 --version)"
else
    echo "❌ Python не найден"
fi

# Проверка переменных окружения
echo "🔐 Проверка переменных окружения..."
if [ -f "/workspace/apps/web/.env.local" ]; then
    echo "✅ .env.local найден"
else
    echo "⚠️  .env.local не найден, скопируйте из .env.example"
fi

# Обновление зависимостей (если нужно)
cd /workspace/apps/web
if [ ! -d "node_modules" ]; then
    echo "📦 Установка Node.js зависимостей..."
    npm install
else
    echo "✅ Node.js зависимости установлены"
fi

# Запуск фоновых сервисов (опционально)
echo "🚀 Готов к запуску сервисов..."

# Создание полезных симлинков
ln -sf /workspace/apps/web/package.json /workspace/package.json 2>/dev/null || true

# Показ статуса Git
cd /workspace
echo "📍 Git статус:"
git status --porcelain | head -5

# Приветственное сообщение
echo ""
echo "🎯 AcademGrad Development Environment готов!"
echo ""
echo "🚀 Быстрый старт:"
echo "  1. Запустите 'dev' для запуска Next.js"
echo "  2. Запустите 'sb-start' для локального Supabase"
echo "  3. Откройте http://localhost:3000"
echo ""
echo "📝 Для просмотра всех команд выполните 'alias | grep -E \"(web|dev|sb)\""