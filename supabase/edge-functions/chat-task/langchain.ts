import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const sbAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

export async function similaritySearch(taskId: number, q: string, k = 4) {
  const { data } = await sbAdmin.rpc("match_task_chunks", {
    query_embedding: (await embed(q)),
    match_count: k,
    taskid: taskId
  });
  return data?.map((d: any) => d.chunk) ?? [];
}

async function embed(text: string): Promise<number[]> {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small"
    })
  });
  const j = await r.json();
  return j.data[0].embedding;
}
