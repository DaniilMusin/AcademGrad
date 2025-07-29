import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

interface ChatRequest {
  task_id: string
  question: string
  history?: Array<{role: 'user' | 'assistant', content: string}>
}

interface TaskChunk {
  chunk_md: string
  step_idx: number
  similarity: number
}

interface ConceptChunk {
  chunk_md: string
  similarity: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { task_id, question, history = [] }: ChatRequest = await req.json()

    if (!task_id || !question) {
      return new Response(
        JSON.stringify({ error: 'task_id and question are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const startTime = Date.now()

    // 1. Check cache first
    const cacheKey = await generateCacheKey(task_id, question)
    const cachedResponse = await checkCache(supabase, cacheKey)
    
    if (cachedResponse) {
      console.log('Cache hit for key:', cacheKey)
      return new Response(
        JSON.stringify(cachedResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Get task metadata
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, exam, topic, statement_md, answer, solution_md')
      .eq('id', task_id)
      .single()

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question)

    // 4. Semantic search in task chunks (filtered by task_id)
    const taskChunks = await searchTaskChunks(supabase, task_id, questionEmbedding)

    // 5. Optional theory search in concept chunks
    const theoryChunks = await searchTheoryChunks(supabase, questionEmbedding, task.exam, task.topic)

    // 6. Build prompt and get LLM response
    const prompt = buildPrompt(task, taskChunks, theoryChunks, history, question)
    const response = await callPerplexityAPI(prompt)

    const responseTime = Date.now() - startTime

    // 7. Cache the response
    await cacheResponse(supabase, cacheKey, task_id, question, response)

    // 8. Log usage
    await logUsage(supabase, req, task_id, question, response, responseTime)

    return new Response(
      JSON.stringify({ 
        answer: response,
        cached: false,
        response_time_ms: responseTime,
        chunks_used: taskChunks.length,
        theory_chunks_used: theoryChunks.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in chat-task function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateCacheKey(taskId: string, question: string): Promise<string> {
  const text = taskId + question.trim().toLowerCase()
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function checkCache(supabase: any, cacheKey: string) {
  const { data, error } = await supabase
    .from('rag_cache')
    .select('response_json')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return null
  return { ...data.response_json, cached: true }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })

  const result = await response.json()
  return result.data[0].embedding
}

async function searchTaskChunks(supabase: any, taskId: string, embedding: number[]): Promise<TaskChunk[]> {
  const { data, error } = await supabase.rpc('search_task_chunks', {
    task_id_param: taskId,
    query_embedding: embedding,
    similarity_threshold: 0.3,
    match_count: 4
  })

  if (error) {
    console.error('Error searching task chunks:', error)
    return []
  }

  return data || []
}

async function searchTheoryChunks(supabase: any, embedding: number[], exam: string, topic: string): Promise<ConceptChunk[]> {
  const { data, error } = await supabase.rpc('search_concept_chunks', {
    query_embedding: embedding,
    exam_filter: exam,
    topic_filter: topic,
    similarity_threshold: 0.3,
    match_count: 2
  })

  if (error) {
    console.error('Error searching concept chunks:', error)
    return []
  }

  return data || []
}

function buildPrompt(
  task: any,
  taskChunks: TaskChunk[],
  theoryChunks: ConceptChunk[],
  history: Array<{role: string, content: string}>,
  question: string
): string {
  const historyText = history.length > 0 
    ? '\n\nПРЕДЫДУЩИЙ КОНТЕКСТ:\n' + history.map(h => 
        `${h.role === 'user' ? 'Вопрос' : 'Ответ'}: ${h.content}`
      ).join('\n')
    : ''

  return `Ты "AcademGrad Tutor" - ассистент для подготовки к ЕГЭ. Отвечай ТОЛЬКО на основе предоставленного контекста.

УСЛОВИЕ ЗАДАЧИ:
${task.statement_md}

ПОШАГОВОЕ РЕШЕНИЕ:
${taskChunks.map((c, i) => `Шаг ${c.step_idx}: ${c.chunk_md}`).join('\n\n')}

СПРАВОЧНАЯ ТЕОРИЯ:
${theoryChunks.map(t => t.chunk_md).join('\n\n')}

### Правила
- Отвечай на русском языке в стиле TED-talks, пошагово
- Если вопрос выходит за рамки контекста, вежливо скажи "Нужно уточнить детали задачи"
- Формулы оформляй в KaTeX синтаксисе
- Ссылайся на конкретные шаги решения
- Будь точным и избегай домыслов${historyText}

Вопрос: ${question}
Ответ:`
}

async function callPerplexityAPI(prompt: string): Promise<string> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Ты опытный преподаватель математики и физики, специализирующийся на подготовке к ЕГЭ. Отвечай только на основе предоставленного контекста.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1000,
      }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${result.error?.message || 'Unknown error'}`)
    }

    return result.choices[0].message.content
  } catch (error) {
    console.error('Perplexity API error, falling back to OpenAI:', error)
    return await callOpenAIFallback(prompt)
  }
}

async function callOpenAIFallback(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Ты опытный преподаватель математики и физики, специализирующийся на подготовке к ЕГЭ. Отвечай только на основе предоставленного контекста.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 1000,
    }),
  })

  const result = await response.json()
  return result.choices[0].message.content
}

async function cacheResponse(supabase: any, cacheKey: string, taskId: string, question: string, response: string) {
  await supabase
    .from('rag_cache')
    .upsert({
      cache_key: cacheKey,
      task_id: taskId,
      question: question,
      response_json: { answer: response },
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours
    })
}

async function logUsage(supabase: any, req: Request, taskId: string, question: string, response: string, responseTime: number) {
  const authHeader = req.headers.get('Authorization')
  let userId = null

  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id
    } catch (error) {
      console.error('Error getting user from token:', error)
    }
  }

  await supabase
    .from('chat_usage')
    .insert({
      user_id: userId,
      task_id: taskId,
      question: question,
      response: response,
      tokens_used: estimateTokens(question + response),
      response_time_ms: responseTime,
      model_used: 'perplexity'
    })
}

function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for Russian text
  return Math.ceil(text.length / 4)
}