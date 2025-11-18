'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Send, Bot, User, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  cached?: boolean;
  chunks_used?: number;
  theory_chunks_used?: number;
  response_time_ms?: number;
}

interface TaskChatProps {
  taskId: string;
  taskTitle?: string;
  taskStatement?: string;
}

export default function TaskChat({ taskId, taskTitle, taskStatement }: TaskChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Load chat history from sessionStorage
    const savedHistory = sessionStorage.getItem(`chat-history-${taskId}`);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }

    // Add initial greeting
    if (messages.length === 0 && !savedHistory) {
      const greeting: Message = {
        id: 'greeting',
        role: 'assistant',
        content: `Привет! Я ассистент AcademGrad. Я могу помочь разобрать эту задачу пошагово. ${taskTitle ? `\n\nМы работаем с задачей: **${taskTitle}**` : ''}\n\nЗадавай вопросы о любом шаге решения!`,
        timestamp: new Date()
      };
      setMessages([greeting]);
    }
  }, [taskId, taskTitle]);

  useEffect(() => {
    // Save chat history to sessionStorage
    if (messages.length > 1) { // Don't save just the greeting
      const historyToSave = messages.slice(-12); // Keep last 12 messages
      sessionStorage.setItem(`chat-history-${taskId}`, JSON.stringify(historyToSave));
    }
  }, [messages, taskId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Prepare chat history for API (last 6 exchanges)
      const recentMessages = messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
        },
        body: JSON.stringify({
          task_id: taskId,
          question: input.trim(),
          history: recentMessages
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при обращении к ассистенту');
      }

      const result = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.answer,
        timestamp: new Date(),
        cached: result.cached,
        chunks_used: result.chunks_used,
        theory_chunks_used: result.theory_chunks_used,
        response_time_ms: result.response_time_ms
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Извините, произошла ошибка при обработке вашего вопроса. Попробуйте еще раз.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    const greeting: Message = {
      id: 'greeting',
      role: 'assistant',
      content: `Привет! Я ассистент AcademGrad. Я могу помочь разобрать эту задачу пошагово. ${taskTitle ? `\n\nМы работаем с задачей: **${taskTitle}**` : ''}\n\nЗадавай вопросы о любом шаге решения!`,
      timestamp: new Date()
    };
    setMessages([greeting]);
    sessionStorage.removeItem(`chat-history-${taskId}`);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">
            Ассистент по задаче
          </h3>
        </div>
        
        <button
          onClick={clearChat}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
          title="Очистить чат"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Task info */}
      {taskStatement && (
        <div className="p-3 bg-blue-50 border-b border-blue-100">
          <div className="text-xs text-blue-600 font-medium mb-1">Условие задачи:</div>
          <div className="text-sm text-blue-800 line-clamp-3">
            <ReactMarkdown
              remarkPlugins={[remarkMath as any]}
              rehypePlugins={[rehypeKatex as any]}
              className="prose prose-sm max-w-none"
            >
              {taskStatement}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-100">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className="w-4 h-4 mt-1 flex-shrink-0 text-gray-500" />
                )}
                {message.role === 'user' && (
                  <User className="w-4 h-4 mt-1 flex-shrink-0 text-blue-200" />
                )}
                
                <div className="flex-1">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath as any]}
                    rehypePlugins={[rehypeKatex as any]}
                    className={`prose max-w-none ${
                      message.role === 'user'
                        ? 'prose-invert prose-sm'
                        : 'prose-sm prose-gray'
                    }`}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      code: ({ children, className }) => (
                        <code className={`${className} px-1 py-0.5 rounded text-xs ${
                          message.role === 'user' ? 'bg-blue-700' : 'bg-gray-200'
                        }`}>
                          {children}
                        </code>
                      )
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  
                  {/* Message metadata */}
                  <div className={`flex items-center justify-between mt-2 text-xs opacity-70 ${
                    message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    <span>
                      {message.timestamp.toLocaleTimeString('ru-RU', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-2">
                        {message.cached && (
                          <span className="bg-green-100 text-green-600 px-1 py-0.5 rounded text-xs">
                            кэш
                          </span>
                        )}
                        {message.response_time_ms && (
                          <span>
                            {message.response_time_ms}ms
                          </span>
                        )}
                        {(message.chunks_used || message.theory_chunks_used) && (
                          <span>
                            {message.chunks_used || 0}+{message.theory_chunks_used || 0} фрагментов
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2 text-gray-500">
                <Bot className="w-4 h-4" />
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Ассистент думает...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Задайте вопрос о решении задачи..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              style={{
                minHeight: '40px',
                maxHeight: '120px',
                resize: 'none'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Enter для отправки • Shift+Enter для новой строки
        </div>
      </div>
    </div>
  );
}