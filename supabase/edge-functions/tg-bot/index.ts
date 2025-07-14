import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const update = await req.json();
    
    // Handle incoming Telegram webhook
    if (update.message?.text) {
      await handleMessage(update.message);
    } else if (update.inline_query) {
      await handleInlineQuery(update.inline_query);
    } else if (update.chosen_inline_result) {
      await handleChosenInlineResult(update.chosen_inline_result);
    }
    
    return new Response("OK");
  } catch (error) {
    console.error("Error in telegram webhook:", error);
    return new Response("Error", { status: 500 });
  }
});

async function handleMessage(message: any) {
  const chatId = message.chat.id;
  const text = message.text;
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (text === "/start") {
    await sendMessage(chatId, `
🎓 Привет! Я бот AcademGrad для работы с задачами ЕГЭ.

📝 Команды:
/tasks_today - Задачи на сегодня
/progress - Твой прогресс
/streak - Полоса решений
/help - Помощь

🔍 Inline-режим:
Наберите @academgrad_bot в любом чате и начните поиск задач!
Например: @academgrad_bot алгебра
    `);
  } else if (text === "/tasks_today") {
    await sendTasksToday(chatId, supabase);
  } else if (text === "/progress") {
    await sendProgress(chatId, supabase);
  } else if (text === "/streak") {
    await sendStreak(chatId, supabase);
  } else if (text === "/help") {
    await sendHelp(chatId);
  } else {
    await sendMessage(chatId, "❓ Неизвестная команда. Используй /help для списка команд.");
  }
}

async function handleInlineQuery(inlineQuery: any) {
  const queryId = inlineQuery.id;
  const query = inlineQuery.query.trim().toLowerCase();
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    let results = [];

    if (query === "" || query.length < 2) {
      // Show popular categories when no query
      results = [
        {
          type: "article",
          id: "algebra",
          title: "📊 Алгебра",
          description: "Задачи по алгебре",
          input_message_content: {
            message_text: "🔍 Поиск задач по алгебре...",
          },
          thumb_url: "https://via.placeholder.com/64x64/4f46e5/white?text=📊"
        },
        {
          type: "article",
          id: "geometry",
          title: "📐 Геометрия", 
          description: "Задачи по геометрии",
          input_message_content: {
            message_text: "🔍 Поиск задач по геометрии...",
          },
          thumb_url: "https://via.placeholder.com/64x64/059669/white?text=📐"
        },
        {
          type: "article",
          id: "probability",
          title: "🎲 Теория вероятностей",
          description: "Задачи по теории вероятностей",
          input_message_content: {
            message_text: "🔍 Поиск задач по теории вероятностей...",
          },
          thumb_url: "https://via.placeholder.com/64x64/dc2626/white?text=🎲"
        }
      ];
    } else {
      // Search tasks by query
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, topic, difficulty, content")
        .or(`topic.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(10);

      if (tasks && tasks.length > 0) {
        results = tasks.map((task: any, index: number) => ({
          type: "article",
          id: `task_${task.id}`,
          title: `${getEmojiByTopic(task.topic)} ${task.topic}`,
          description: `Сложность: ${'⭐'.repeat(task.difficulty)} | ${task.content.substring(0, 100)}...`,
          input_message_content: {
            message_text: `📚 Задача: ${task.topic}\n\n${task.content}\n\n🎯 Сложность: ${'⭐'.repeat(task.difficulty)}\n\n👆 Нажмите на задачу чтобы начать решение`,
            parse_mode: "HTML"
          },
          thumb_url: `https://via.placeholder.com/64x64/${getColorByDifficulty(task.difficulty)}/white?text=${getEmojiByTopic(task.topic)}`
        }));
      } else {
        results = [{
          type: "article",
          id: "no_results",
          title: "🚫 Задачи не найдены",
          description: `По запросу "${query}" ничего не найдено`,
          input_message_content: {
            message_text: `🔍 По запросу "${query}" задачи не найдены.\n\nПопробуйте другие ключевые слова.`,
          },
          thumb_url: "https://via.placeholder.com/64x64/6b7280/white?text=🚫"
        }];
      }
    }

    await answerInlineQuery(queryId, results);

  } catch (error) {
    console.error("Error in inline query:", error);
    await answerInlineQuery(queryId, [{
      type: "article",
      id: "error",
      title: "❌ Ошибка",
      description: "Произошла ошибка при поиске",
      input_message_content: {
        message_text: "❌ Произошла ошибка при поиске задач. Попробуйте позже.",
      }
    }]);
  }
}

async function handleChosenInlineResult(chosenResult: any) {
  const resultId = chosenResult.result_id;
  const userId = chosenResult.from.id;
  
  // Log inline result usage for analytics
  console.log(`Inline result chosen: ${resultId} by user ${userId}`);
  
  // Could track usage in database here
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (resultId.startsWith('task_')) {
    const taskId = resultId.replace('task_', '');
    
    // Log task sharing
    await supabase
      .from('task_shares')
      .insert({
        task_id: parseInt(taskId),
        telegram_user_id: userId,
        shared_at: new Date().toISOString()
      });
  }
}

function getColorByDifficulty(difficulty: number): string {
  if (difficulty <= 3) return "22c55e"; // green
  if (difficulty <= 6) return "f59e0b"; // yellow
  if (difficulty <= 8) return "f97316"; // orange
  return "ef4444"; // red
}

async function sendTasksToday(chatId: number, supabase: any) {
  try {
    // Get today's recommended tasks
    const { data: tasks } = await supabase
      .from("recommendations")
      .select(`
        task_id,
        tasks (
          topic,
          difficulty,
          content
        )
      `)
      .limit(3);

    if (tasks && tasks.length > 0) {
      let message = "📚 *Задачи на сегодня:*\n\n";
      
      tasks.forEach((rec: any, index: number) => {
        const task = rec.tasks;
        message += `${index + 1}. *${task.topic}*\n`;
        message += `   🎯 Сложность: ${task.difficulty}/10\n`;
        message += `   📝 ${task.content.substring(0, 100)}...\n\n`;
      });
      
      message += "💡 Решайте задачи в приложении AcademGrad!";
      
      await sendMessage(chatId, message, "Markdown");
    } else {
      await sendMessage(chatId, "📭 На сегодня нет рекомендованных задач. Попробуйте завтра!");
    }
  } catch (error) {
    console.error("Error getting tasks:", error);
    await sendMessage(chatId, "❌ Ошибка при получении задач.");
  }
}

async function sendProgress(chatId: number, supabase: any) {
  try {
    // This would need user linking logic
    await sendMessage(chatId, `
📊 *Ваш прогресс:*

✅ Решено задач: 45
🔥 Текущая полоса: 7 дней
🎯 Средняя сложность: 6.2/10
📈 Точность: 78%

💡 Для подробной статистики откройте приложение AcademGrad!
    `, "Markdown");
  } catch (error) {
    console.error("Error getting progress:", error);
    await sendMessage(chatId, "❌ Ошибка при получении прогресса.");
  }
}

async function sendStreak(chatId: number, supabase: any) {
  await sendMessage(chatId, `
🔥 *Ваша полоса решений:*

Текущая полоса: *7 дней* 🔥
Лучшая полоса: *12 дней* 🏆

📅 Последние дни:
Вчера: ✅ 3 задачи
Позавчера: ✅ 2 задачи  
3 дня назад: ✅ 4 задачи

💪 Продолжайте решать каждый день!
  `, "Markdown");
}

async function sendHelp(chatId: number) {
  await sendMessage(chatId, `
🆘 *Помощь по боту AcademGrad*

📝 *Команды:*
/start - Начать работу
/tasks_today - Задачи на сегодня
/progress - Ваш прогресс
/streak - Полоса решений
/help - Эта справка

🔍 *Inline-режим:*
Наберите @academgrad_bot в любом чате для поиска задач
Примеры:
• @academgrad_bot алгебра
• @academgrad_bot интеграл
• @academgrad_bot геометрия

📱 *Веб-приложение:*
Полный функционал доступен в приложении AcademGrad
  `, "Markdown");
}

async function sendMessage(chatId: number, text: string, parseMode?: string) {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  
  const body: any = {
    chat_id: chatId,
    text: text,
  };
  
  if (parseMode) {
    body.parse_mode = parseMode;
  }

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function answerInlineQuery(queryId: string, results: any[]) {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

  await fetch(`https://api.telegram.org/bot${botToken}/answerInlineQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inline_query_id: queryId,
      results: results,
      cache_time: 300, // Cache for 5 minutes
      is_personal: true,
    }),
  });
}
