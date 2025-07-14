# 📡 API Документация AcademGrad

## Общие сведения

### Base URL
- **Production**: `https://academgrad.com/api`
- **Staging**: `https://staging.academgrad.com/api`
- **Development**: `http://localhost:3000/api`

### Аутентификация
Все защищенные endpoints требуют JWT токен в заголовке:
```
Authorization: Bearer <jwt_token>
```

### Стандартные ответы
```typescript
// Успешный ответ
{
  "success": true,
  "data": any,
  "message"?: string
}

// Ошибка
{
  "error": string,
  "details"?: any,
  "code"?: string
}
```

## 🏠 Frontend API Routes

### 💳 Платежи

#### POST /api/checkout
Создание checkout сессии для Stripe.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```typescript
{
  "plan": "basic" | "premium" | "pro",
  "return_url"?: string
}
```

**Response:**
```typescript
{
  "session_id": string,
  "url": string,
  "plan": string,
  "amount": number
}
```

#### GET /api/checkout?session_id=<session_id>
Получение статуса checkout сессии.

**Response:**
```typescript
{
  "status": "open" | "complete" | "expired",
  "payment_status": "paid" | "unpaid" | "no_payment_required"
}
```

---

### 🪙 ЮKassa платежи

#### POST /api/payment/yookassa
Создание платежа через ЮKassa.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```typescript
{
  "plan": "basic" | "premium" | "pro",
  "return_url"?: string
}
```

**Response:**
```typescript
{
  "payment_id": string,
  "status": string,
  "confirmation_url": string,
  "amount": number,
  "currency": "RUB"
}
```

#### PUT /api/payment/yookassa
Webhook для обработки уведомлений от ЮKassa.

**Body:** YooKassa payment object

---

### 🔔 Push-уведомления

#### POST /api/push/subscribe
Подписка на push-уведомления.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```typescript
{
  "subscription": PushSubscription,
  "userAgent": string
}
```

**Response:**
```typescript
{
  "success": true,
  "message": string
}
```

#### POST /api/push/unsubscribe
Отписка от push-уведомлений.

**Body:**
```typescript
{
  "endpoint": string
}
```

#### POST /api/push/test
Отправка тестового push-уведомления.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```typescript
{
  "title": string,
  "body": string,
  "icon"?: string,
  "url"?: string
}
```

---

### 💼 Подписки

#### POST /api/subscription/portal
Создание сессии Stripe Customer Portal.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```typescript
{
  "return_url"?: string
}
```

**Response:**
```typescript
{
  "url": string
}
```

---

### 🎯 Попытки решения

#### POST /api/attempt
Логирование попытки решения задачи.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```typescript
{
  "task_id": number,
  "is_correct": boolean,
  "time_spent_s": number,
  "solution"?: string,
  "hints_used": number
}
```

**Response:**
```typescript
{
  "id": string,
  "streak_updated": boolean,
  "badges_earned": Badge[],
  "next_recommendations": Task[]
}
```

---

### 🏥 Health Check

#### GET /api/health
Проверка состояния системы.

**Response:**
```typescript
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": string,
  "services": {
    "database": "up" | "down",
    "edge_functions": "up" | "down",
    "external_apis": {
      "openai": "up" | "down",
      "stripe": "up" | "down",
      "yookassa": "up" | "down"
    }
  },
  "metrics": {
    "response_time_ms": number,
    "active_users": number,
    "error_rate": number
  }
}
```

## 🚀 Edge Functions

### 💬 Chat Task AI

**URL:** `${SUPABASE_URL}/functions/v1/chat-task`

#### POST /
Получение помощи ИИ в решении задач.

**Headers:**
```
Authorization: Bearer <supabase_token>
Content-Type: application/json
```

**Body:**
```typescript
{
  "task_id": number,
  "user_message": string,
  "context"?: {
    "previous_attempts": number,
    "difficulty_level": number,
    "hints_used": string[]
  }
}
```

**Response:**
```typescript
{
  "response": string,
  "hint_type": "conceptual" | "methodological" | "computational",
  "confidence": number,
  "follow_up_questions"?: string[]
}
```

---

### 🏆 Badge Cron

**URL:** `${SUPABASE_URL}/functions/v1/badge-cron`

#### POST /
Автоматическое вручение бейджей (вызывается по расписанию).

**Response:**
```typescript
{
  "processed_users": number,
  "badges_awarded": number,
  "execution_time_ms": number
}
```

---

### 📊 Weekly Report

**URL:** `${SUPABASE_URL}/functions/v1/weekly-report`

#### POST /
Генерация и отправка еженедельных отчетов.

**Response:**
```typescript
{
  "status": "success",
  "reports_generated": number,
  "emails_sent": number,
  "errors": string[]
}
```

---

### 🤖 Telegram Bot

**URL:** `${SUPABASE_URL}/functions/v1/tg-bot`

#### POST /
Webhook для Telegram Bot API.

**Body:** Telegram Update object

**Supported Commands:**
- `/start` - Приветствие и инструкции
- `/tasks_today` - Задачи на сегодня
- `/progress` - Статистика пользователя
- `/streak` - Полоса решений
- `/help` - Справка

**Inline Mode:**
- `@academgrad_bot <query>` - Поиск задач по ключевым словам

---

### 💰 Payment Processing

**URL:** `${SUPABASE_URL}/functions/v1/payment`

#### POST /stripe/webhook
Обработка Stripe webhooks.

**Headers:**
```
stripe-signature: <signature>
```

#### POST /yookassa/webhook
Обработка YooKassa webhooks.

---

### 📝 Log Attempt

**URL:** `${SUPABASE_URL}/functions/v1/log-attempt`

#### POST /
Расширенное логирование попыток с аналитикой.

**Body:**
```typescript
{
  "user_id": string,
  "task_id": number,
  "attempt_data": {
    "is_correct": boolean,
    "time_spent_s": number,
    "solution": string,
    "steps": Step[],
    "metadata": any
  }
}
```

## 📐 Математические формулы

### Алгоритм интервального повторения
```typescript
// Следующий интервал для повторения
function calculateNextInterval(
  difficulty: number,
  previousInterval: number,
  isCorrect: boolean
): number {
  const easeFactor = 2.5; // базовый коэффициент
  const minInterval = 1; // минимум 1 день
  
  if (isCorrect) {
    return Math.max(minInterval, previousInterval * easeFactor);
  } else {
    return minInterval; // сброс при ошибке
  }
}
```

### Расчет сложности рекомендаций
```typescript
function calculateDifficulty(
  userAccuracy: number,
  taskDifficulty: number,
  adaptionRate: number = 0.1
): number {
  // Адаптивная сложность на основе успеваемости
  const targetAccuracy = 0.75; // целевая точность 75%
  const adjustment = (userAccuracy - targetAccuracy) * adaptionRate;
  
  return Math.max(1, Math.min(10, taskDifficulty + adjustment));
}
```

## 🚫 Коды ошибок

| Код | Описание |
|-----|----------|
| `AUTH_REQUIRED` | Требуется аутентификация |
| `INVALID_TOKEN` | Недействительный токен |
| `PERMISSION_DENIED` | Недостаточно прав |
| `VALIDATION_ERROR` | Ошибка валидации данных |
| `RATE_LIMITED` | Превышен лимит запросов |
| `PAYMENT_FAILED` | Ошибка платежа |
| `EXTERNAL_API_ERROR` | Ошибка внешнего API |
| `DATABASE_ERROR` | Ошибка базы данных |

## 🔒 Rate Limiting

| Endpoint | Лимит | Окно |
|----------|-------|------|
| `/api/chat-task` | 30 req/min | User |
| `/api/push/test` | 5 req/min | User |
| `/api/checkout` | 10 req/min | User |
| `/api/health` | 100 req/min | IP |

## 📊 Мониторинг endpoints

### Prometheus метрики
```
# Доступны на /api/metrics
api_requests_total{method, endpoint, status}
api_request_duration_seconds{method, endpoint}
api_active_connections
api_error_rate{endpoint}
```

### Health check dependencies
- Supabase Database
- OpenAI API
- Stripe API
- YooKassa API
- Postmark Email API
- Telegram Bot API

## 🧪 Тестирование API

### Примеры запросов

#### Создание платежа
```bash
curl -X POST https://academgrad.com/api/checkout \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"plan": "premium"}'
```

#### Подписка на push
```bash
curl -X POST https://academgrad.com/api/push/subscribe \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/...",
      "keys": {
        "p256dh": "...",
        "auth": "..."
      }
    },
    "userAgent": "Mozilla/5.0..."
  }'
```

---

*API документация версии 1.0, декабрь 2024*