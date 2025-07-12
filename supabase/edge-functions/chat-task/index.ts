// deno run -A mod.ts (Supabase Edge runtime)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { similaritySearch } from "./langchain.ts";

serve(async (req) => {
  const { task_id, question } = await req.json();
  if (!task_id || !question) return new Response("Bad Request", { status: 400 });

  // Supabase admin client
  const sb = createClient(Deno.env.get("SUPABASE_URL")!,
                          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // top‑4 похожих кусков решения для prompt
  const context = await similaritySearch(task_id, question, 4);

  const prompt = [
    { role: "system", content: "Ты дружественный репетитор физ/мат." },
    ...context.map(c => ({ role: "system", content: c })),
    { role: "user", content: question }
  ];

  // stream GPT‑4o мини
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: Deno.env.get("LLM_MODEL"),   // gpt-4o-mini
      stream: true,
      messages: prompt
    })
  });

  return new Response(resp.body, {
    headers: { "Content-Type": "text/event-stream" }
  });
});
