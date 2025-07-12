"use client";
import { useState } from "react";
import { postSSE } from "@/lib/sse";

export default function ChatDrawer({ taskId }: { taskId: number }) {
  const [question, setQ] = useState("");
  const [answer, setA] = useState("");

  const ask = async () => {
    setA("");
    await postSSE(
      "/functions/v1/chat-task",
      { task_id: taskId, question },
      (tok) => setA((a) => a + tok)
    );
  };

  return (
    <aside className="border rounded p-4">
      <textarea
        value={question}
        onChange={(e) => setQ(e.target.value)}
        className="w-full border p-2"
      />
      <button onClick={ask} className="btn mt-2">
        Спросить
      </button>
      <pre className="mt-4 whitespace-pre-wrap">{answer}</pre>
    </aside>
  );
}
