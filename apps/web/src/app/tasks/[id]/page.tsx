import { createClient } from "@/lib/supabase";
import TaskCard from "@/components/TaskCard";
import ChatDrawer from "@/components/ChatDrawer";

export default async function Task({ params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: task } = await sb.from("tasks").select("*").eq("id", params.id).single();

  return (
    <div className="grid md:grid-cols-3 gap-6 p-6">
      <TaskCard task={task!} />
      <ChatDrawer taskId={task!.id} />
    </div>
  );
}
