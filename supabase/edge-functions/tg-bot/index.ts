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
    await sendMessage(chatId, "Привет! Я бот для отслеживания твоих задач. Используй /tasks_today для получения задач на сегодня.");
  } else if (text === "/tasks_today") {
    await sendTasksToday(chatId, supabase);
  } else {
    await sendMessage(chatId, "Неизвестная команда. Используй /start или /tasks_today");
  }
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
          statement_md
        )
      `)
      .lte("next_review", new Date().toISOString())
      .order("priority", { ascending: false })
      .limit(3);

    if (!tasks?.length) {
      await sendMessage(chatId, "На сегодня нет задач для повторения! 🎉");
      return;
    }

    let message = "📚 *Задачи на сегодня:*\n\n";
    tasks.forEach((task: any, index: number) => {
      const difficulty = "⭐".repeat(task.tasks.difficulty);
      message += `${index + 1}. ${task.tasks.topic} ${difficulty}\n`;
      message += `${task.tasks.statement_md.substring(0, 100)}...\n\n`;
    });

    await sendMessage(chatId, message);
  } catch (error) {
    console.error("Error getting tasks:", error);
    await sendMessage(chatId, "Ошибка при получении задач");
  }
}

async function sendMessage(chatId: number, text: string) {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN not set");
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });

  if (!response.ok) {
    console.error("Error sending message:", await response.text());
  }
}
