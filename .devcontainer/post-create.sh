#!/bin/bash

echo "🚀 Настройка окружения разработки AcademGrad..."

# Установка зависимостей Node.js
echo "📦 Установка Node.js зависимостей..."
cd /workspace/apps/web
npm install

# Установка Python зависимостей
echo "🐍 Установка Python зависимостей..."
cd /workspace
pip install -r requirements.txt

# Установка дополнительных инструментов
echo "🔧 Установка дополнительных инструментов..."
npm install -g @supabase/cli
npm install -g vercel
npm install -g stripe-cli

# Настройка Git
echo "📝 Настройка Git..."
git config --global init.defaultBranch main
git config --global pull.rebase false

# Создание необходимых директорий
echo "📁 Создание директорий..."
mkdir -p /workspace/.vscode
mkdir -p /workspace/logs
mkdir -p /workspace/temp

# Настройка Husky (если еще не настроен)
echo "🪝 Настройка Git хуков..."
cd /workspace/apps/web
npm run prepare || npx husky install

# Копирование примера переменных окружения
echo "🔐 Настройка переменных окружения..."
if [ ! -f "/workspace/apps/web/.env.local" ]; then
  cp /workspace/apps/web/.env.example /workspace/apps/web/.env.local
  echo "⚠️  Не забудьте заполнить переменные в .env.local"
fi

# Проверка версий
echo "✅ Проверка установленных версий:"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Python: $(python3 --version)"
echo "Git: $(git --version)"

# Создание alias для удобства
echo "🎯 Настройка alias..."
cat >> ~/.bashrc << 'EOF'

# AcademGrad Development Aliases
alias web="cd /workspace/apps/web"
alias supabase="cd /workspace/supabase"
alias scripts="cd /workspace/scripts"
alias logs="cd /workspace/logs"

# Development commands
alias dev="cd /workspace/apps/web && npm run dev"
alias build="cd /workspace/apps/web && npm run build"
alias test="cd /workspace/apps/web && npm run test"
alias lint="cd /workspace/apps/web && npm run lint"

# Supabase commands
alias sb="supabase"
alias sb-start="supabase start"
alias sb-stop="supabase stop"
alias sb-reset="supabase db reset"
alias sb-deploy="supabase functions deploy"

# Git shortcuts
alias gs="git status"
alias ga="git add"
alias gc="git commit"
alias gp="git push"
alias gl="git log --oneline"

EOF

echo "🎉 Настройка окружения завершена!"
echo ""
echo "📚 Полезные команды:"
echo "  web          - перейти в директорию веб-приложения"
echo "  dev          - запустить development сервер"
echo "  sb-start     - запустить Supabase локально"
echo "  sb-deploy    - деплой Edge Functions"
echo ""
echo "🔗 Полезные ссылки:"
echo "  - Next.js App: http://localhost:3000"
echo "  - Supabase Studio: http://localhost:54321"
echo "  - PostgreSQL: localhost:5432"
echo ""
echo "⚡ Готово к разработке!"