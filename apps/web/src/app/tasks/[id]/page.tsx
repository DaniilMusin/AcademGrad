'use client';

import { createClient } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';
import TaskCard from "@/components/TaskCard";
import ChatDrawer from "@/components/ChatDrawer";

const sb = createClient();

interface Task {
  id: number;
  topic: string;
  difficulty: number;
  statement_md: string;
}

export default function Task({ params }: { params: { id: string } }) {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTask = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await sb
        .from("tasks")
        .select("*")
        .eq("id", params.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setTask(data);
    } catch (err) {
      console.error('Error loading task:', err);
      setError('Failed to load task');
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h1>
          <p className="text-gray-600 mb-4">{error || 'Задача не найдена'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 p-6">
      <TaskCard task={task} />
      <ChatDrawer taskId={task.id} />
    </div>
  );
}
