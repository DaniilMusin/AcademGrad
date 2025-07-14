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

async function handleInlineQuery(inlineQuery: any) {
  const query = inlineQuery.query?.toLowerCase() || "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    let results: any[] = [];

    if (query === "" || query === "tasks") {
      // Show recent tasks
      results = await getRecentTasksInline(supabase);
    } else if (query.startsWith("topic:")) {
      // Search by topic
      const topic = query.replace("topic:", "").trim();
      results = await getTasksByTopicInline(supabase, topic);
    } else if (query.startsWith("difficulty:")) {
      // Search by difficulty
      const difficulty = parseInt(query.replace("difficulty:", "").trim());
      results = await getTasksByDifficultyInline(supabase, difficulty);
    } else {
      // General search
      results = await searchTasksInline(supabase, query);
    }

    await answerInlineQuery(inlineQuery.id, results);
  } catch (error) {
    console.error("Error handling inline query:", error);
    await answerInlineQuery(inlineQuery.id, []);
  }
}

async function handleChosenInlineResult(chosenResult: any) {
  // Log which result was chosen for analytics
  console.log("Chosen inline result:", chosenResult.result_id);
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Log interaction
  await supabase
    .from("bot_interactions")
    .insert({
      user_id: chosenResult.from.id,
      interaction_type: "inline_result_chosen",
      data: {
        result_id: chosenResult.result_id,
        query: chosenResult.query
      }
    });
}

async function getRecentTasksInline(supabase: any) {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, topic, difficulty, statement_md")
    .order("created_at", { ascending: false })
    .limit(10);

  return tasks?.map((task: any, index: number) => ({
    type: "article",
    id: task.id.toString(),
    title: `${task.topic} (${task.difficulty}⭐)`,
    description: task.statement_md.substring(0, 100) + "...",
    input_message_content: {
      message_text: `📚 *${task.topic}*\n\n${task.statement_md}\n\n⭐ Сложность: ${task.difficulty}`,
      parse_mode: "Markdown"
    },
    thumb_url: `https://via.placeholder.com/64x64.png?text=${task.difficulty}`
  })) || [];
}

async function getTasksByTopicInline(supabase: any, topic: string) {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, topic, difficulty, statement_md")
    .ilike("topic", `%${topic}%`)
    .limit(10);

  return tasks?.map((task: any) => ({
    type: "article",
    id: `topic_${task.id}`,
    title: `${task.topic} (${task.difficulty}⭐)`,
    description: task.statement_md.substring(0, 100) + "...",
    input_message_content: {
      message_text: `📚 *${task.topic}*\n\n${task.statement_md}\n\n⭐ Сложность: ${task.difficulty}`,
      parse_mode: "Markdown"
    }
  })) || [];
}

async function getTasksByDifficultyInline(supabase: any, difficulty: number) {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, topic, difficulty, statement_md")
    .eq("difficulty", difficulty)
    .limit(10);

  return tasks?.map((task: any) => ({
    type: "article",
    id: `diff_${task.id}`,
    title: `${task.topic} (${task.difficulty}⭐)`,
    description: task.statement_md.substring(0, 100) + "...",
    input_message_content: {
      message_text: `📚 *${task.topic}*\n\n${task.statement_md}\n\n⭐ Сложность: ${task.difficulty}`,
      parse_mode: "Markdown"
    }
  })) || [];
}

async function searchTasksInline(supabase: any, query: string) {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, topic, difficulty, statement_md")
    .or(`topic.ilike.%${query}%,statement_md.ilike.%${query}%`)
    .limit(10);

  return tasks?.map((task: any) => ({
    type: "article",
    id: `search_${task.id}`,
    title: `${task.topic} (${task.difficulty}⭐)`,
    description: task.statement_md.substring(0, 100) + "...",
    input_message_content: {
      message_text: `📚 *${task.topic}*\n\n${task.statement_md}\n\n⭐ Сложность: ${task.difficulty}`,
      parse_mode: "Markdown"
    }
  })) || [];
}

async function answerInlineQuery(queryId: string, results: any[]) {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN not set");
    return;
  }

  // Add default results if no results found
  if (results.length === 0) {
    results = [{
      type: "article",
      id: "no_results",
      title: "Задачи не найдены",
      description: "Попробуйте другой поисковый запрос",
      input_message_content: {
        message_text: "❌ Задачи не найдены. Попробуйте:\n• `tasks` - все задачи\n• `topic:алгебра` - по теме\n• `difficulty:2` - по сложности",
        parse_mode: "Markdown"
      }
    }];
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/answerInlineQuery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inline_query_id: queryId,
      results: results.slice(0, 50), // Telegram limit
      cache_time: 300, // 5 minutes
      is_personal: true
    }),
  });

  if (!response.ok) {
    console.error("Error answering inline query:", await response.text());
  }
}
