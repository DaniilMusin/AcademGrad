import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

serve(async req => {
  const { task_id, question } = await req.json();
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // fetch chunks - placeholder
  const prompt = [{ role: "user", content: question }];
  const stream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
               "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-3.5-turbo", stream: true, messages: prompt })
  });
  return new Response(stream.body, { headers: { "Content-Type": "text/event-stream" }});
});
