'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Upload, FileText, Database, BarChart3, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface RAGStats {
  tasks_with_chunks: number;
  total_task_chunks: number;
  concept_docs: number;
  total_concept_chunks: number;
  cache_entries: number;
  recent_chat_usage: number;
}

interface ProcessingResult {
  status: 'success' | 'error' | 'processing';
  message: string;
  details?: any;
}

export default function RAGManagementPage() {
  const [stats, setStats] = useState<RAGStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const supabase = createClient();

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get various statistics
      const [
        tasksWithChunks,
        taskChunks,
        conceptDocs,
        conceptChunks,
        cacheEntries,
        recentUsage
      ] = await Promise.all([
        supabase.from('task_chunks').select('task_id', { count: 'exact', head: true }),
        supabase.from('task_chunks').select('*', { count: 'exact', head: true }),
        supabase.from('concept_docs').select('*', { count: 'exact', head: true }),
        supabase.from('concept_chunks').select('*', { count: 'exact', head: true }),
        supabase.from('rag_cache').select('*', { count: 'exact', head: true }),
        supabase.from('chat_usage')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      setStats({
        tasks_with_chunks: tasksWithChunks.count || 0,
        total_task_chunks: taskChunks.count || 0,
        concept_docs: conceptDocs.count || 0,
        total_concept_chunks: conceptChunks.count || 0,
        cache_entries: cacheEntries.count || 0,
        recent_chat_usage: recentUsage.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setProcessingResult({
        status: 'error',
        message: 'Ошибка при загрузке статистики'
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const clearCache = async () => {
    try {
      setIsLoading(true);
      setProcessingResult({ status: 'processing', message: 'Очистка кэша...' });

      const { data, error } = await supabase.rpc('cleanup_rag_cache');
      
      if (error) throw error;

      setProcessingResult({
        status: 'success',
        message: `Успешно удалено ${data} записей из кэша`
      });
      
      loadStats();
    } catch (error) {
      console.error('Error clearing cache:', error);
      setProcessingResult({
        status: 'error',
        message: 'Ошибка при очистке кэша'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testEmbedding = async () => {
    try {
      setIsLoading(true);
      setProcessingResult({ status: 'processing', message: 'Тестирование embedding...' });

      const response = await fetch('/api/test-embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Тестовый текст для проверки embedding' })
      });

      if (!response.ok) {
        throw new Error('Ошибка API');
      }

      const result = await response.json();
      
      setProcessingResult({
        status: 'success',
        message: 'Embedding API работает корректно',
        details: {
          embedding_length: result.embedding?.length,
          model: result.model
        }
      });
    } catch (error) {
      console.error('Error testing embedding:', error);
      setProcessingResult({
        status: 'error',
        message: 'Ошибка при тестировании embedding API'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testChatFunction = async () => {
    try {
      setIsLoading(true);
      setProcessingResult({ status: 'processing', message: 'Тестирование чат-функции...' });

      // Get a random task for testing
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .limit(1);

      if (!tasks || tasks.length === 0) {
        throw new Error('Нет задач для тестирования');
      }

      const response = await fetch('/api/chat-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: tasks[0].id,
          question: 'Объясни первый шаг решения'
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка чат API');
      }

      const result = await response.json();
      
      setProcessingResult({
        status: 'success',
        message: 'Чат-функция работает корректно',
        details: {
          response_length: result.answer?.length,
          cached: result.cached,
          chunks_used: result.chunks_used,
          response_time: result.response_time_ms
        }
      });
    } catch (error) {
      console.error('Error testing chat function:', error);
      setProcessingResult({
        status: 'error',
        message: 'Ошибка при тестировании чат-функции'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Управление RAG системой
          </h1>
          <p className="text-gray-600">
            Мониторинг и управление системой ИИ-ассистента
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.tasks_with_chunks || 0}
                </div>
                <div className="text-sm text-gray-600">Задач с чанками</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.total_task_chunks || 0}
                </div>
                <div className="text-sm text-gray-600">Всего чанков задач</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.concept_docs || 0}
                </div>
                <div className="text-sm text-gray-600">Документов теории</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.total_concept_chunks || 0}
                </div>
                <div className="text-sm text-gray-600">Чанков теории</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.cache_entries || 0}
                </div>
                <div className="text-sm text-gray-600">Записей в кэше</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.recent_chat_usage || 0}
                </div>
                <div className="text-sm text-gray-600">Запросов за 24ч</div>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Result */}
        {processingResult && (
          <div className={`mb-6 p-4 rounded-lg border ${
            processingResult.status === 'success' ? 'bg-green-50 border-green-200' :
            processingResult.status === 'error' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center space-x-2">
              {processingResult.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {processingResult.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {processingResult.status === 'processing' && <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />}
              
              <div className="flex-1">
                <div className={`font-medium ${
                  processingResult.status === 'success' ? 'text-green-800' :
                  processingResult.status === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {processingResult.message}
                </div>
                
                {processingResult.details && (
                  <div className="mt-2 text-sm opacity-75">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(processingResult.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Управление данными
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={loadStats}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Обновить статистику</span>
              </button>

              <button
                onClick={clearCache}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Database className="w-4 h-4" />
                <span>Очистить кэш</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Тестирование системы
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={testEmbedding}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Тест Embedding API</span>
              </button>

              <button
                onClick={testChatFunction}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Тест чат-функции</span>
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Инструкции по использованию
          </h3>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900">Импорт задач:</h4>
              <code className="block mt-1 p-2 bg-gray-100 rounded">
                python scripts/import_tasks.py --file task.md --task-id uuid
              </code>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Импорт теории:</h4>
              <code className="block mt-1 p-2 bg-gray-100 rounded">
                python scripts/import_concepts.py --directory concepts/
              </code>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Переменные окружения:</h4>
              <ul className="mt-1 space-y-1">
                <li>• SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY</li>
                <li>• OPENAI_API_KEY (для embeddings)</li>
                <li>• PERPLEXITY_API_KEY (для chat)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}