module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // новая функция
        'fix',      // исправление бага
        'docs',     // изменения в документации
        'style',    // форматирование кода
        'refactor', // рефакторинг кода
        'perf',     // улучшение производительности
        'test',     // добавление тестов
        'chore',    // обновление зависимостей, конфигураций
        'ci',       // изменения в CI/CD
        'build',    // изменения в сборке
        'revert'    // отмена изменений
      ]
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-max-length': [2, 'always', 100],
    'subject-min-length': [2, 'always', 10],
    'header-max-length': [2, 'always', 120]
  },
  helpUrl: `
🔧 Формат коммита: <type>(<scope>): <subject>

Примеры:
  feat(auth): добавлена авторизация через Telegram
  fix(payment): исправлена ошибка в Stripe webhook
  docs(api): обновлена документация API
  style(ui): исправлено форматирование компонента Calendar
  
Типы коммитов:
  feat     - новая функция
  fix      - исправление бага
  docs     - изменения в документации
  style    - форматирование кода
  refactor - рефакторинг кода
  perf     - улучшение производительности
  test     - добавление тестов
  chore    - обновление зависимостей, конфигураций
  ci       - изменения в CI/CD
  build    - изменения в сборке
  revert   - отмена изменений
  `
};