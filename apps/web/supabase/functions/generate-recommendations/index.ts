import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

interface RecommendationRequest {
  user_id: string
  force_regenerate?: boolean
}

interface UserStats {
  total_tasks: number
  correct_tasks: number
  accuracy_rate: number
  weak_topics: Array<{
    topic: string
    accuracy: number
    total_attempts: number
  }>
  favorite_topics: Array<{
    topic: string
    count: number
  }>
  difficulty_distribution: Record<string, number>
  study_streak: number
  recent_performance: Array<{
    date: string
    tasks: number
    correct: number
  }>
}

interface LearningMaterial {
  material_id: string
  title: string
  description: string
  content_type: string
  difficulty_level: number
  topics: string[]
}

interface TaskRecommendation {
  topic: string
  subtopic?: string
  difficulty_range: [number, number]
  count: number
  reason: string
}

interface GeneratedRecommendation {
  type: 'task_practice' | 'learning_material' | 'topic_focus' | 'difficulty_adjustment'
  title: string
  description: string
  action_text: string
  priority_score: number
  confidence_score: number
  reasoning: string
  related_task_ids?: string[]
  related_material_ids?: string[]
  related_topics?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, force_regenerate = false }: RecommendationRequest = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Проверяем существующие активные рекомендации
    if (!force_regenerate) {
      const { data: existingRecs } = await supabase
        .from('user_recommendations')
        .select('*')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())

      if (existingRecs && existingRecs.length > 0) {
        return new Response(
          JSON.stringify({ 
            message: 'Active recommendations already exist',
            recommendations: existingRecs 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Получаем статистику пользователя
    const { data: statsData } = await supabase
      .rpc('get_user_learning_stats', { p_user_id: user_id })

    if (!statsData) {
      return new Response(
        JSON.stringify({ error: 'No user data found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Получаем профиль пользователя
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user_id)
      .single()

    // Получаем доступные учебные материалы
    const { data: materials } = await supabase
      .from('learning_materials')
      .select('material_id, title, description, content_type, difficulty_level, topics')
      .eq('is_published', true)
      .limit(50)

    // Генерируем рекомендации с помощью ИИ
    const recommendations = await generateAIRecommendations(
      statsData,
      userProfile,
      materials || []
    )

    // Сохраняем рекомендации в базу
    if (recommendations.length > 0) {
      const recommendationsToInsert = recommendations.map(rec => ({
        user_id,
        recommendation_type: rec.type,
        title: rec.title,
        description: rec.description,
        action_text: rec.action_text,
        priority_score: rec.priority_score,
        confidence_score: rec.confidence_score,
        reasoning: rec.reasoning,
        related_task_ids: rec.related_task_ids || [],
        related_material_ids: rec.related_material_ids || [],
        related_topics: rec.related_topics || [],
        based_on_data: statsData,
        generated_by_model: 'gpt-4o-mini'
      }))

      await supabase
        .from('user_recommendations')
        .insert(recommendationsToInsert)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        recommendations,
        stats_analyzed: statsData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating recommendations:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateAIRecommendations(
  stats: any,
  profile: any,
  materials: LearningMaterial[]
): Promise<GeneratedRecommendation[]> {
  
  const prompt = buildRecommendationPrompt(stats, profile, materials)
  
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
            content: `Ты эксперт по образовательной аналитике и персонализированному обучению. 
            Анализируй данные ученика и создавай конкретные, действенные рекомендации для улучшения результатов ЕГЭ.
            Ответ должен быть строго в формате JSON массива объектов.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error('Perplexity API error')
    }

    const result = await response.json()
    const aiResponse = result.choices[0].message.content
    
    // Парсим JSON ответ от ИИ
    try {
      const parsedRecommendations = JSON.parse(aiResponse)
      return Array.isArray(parsedRecommendations) ? parsedRecommendations : []
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse)
      return generateFallbackRecommendations(stats, materials)
    }

  } catch (error) {
    console.error('AI recommendation error:', error)
    return generateFallbackRecommendations(stats, materials)
  }
}

function buildRecommendationPrompt(
  stats: any,
  profile: any,
  materials: LearningMaterial[]
): string {
  return `
Проанализируй данные ученика и создай персонализированные рекомендации для подготовки к ЕГЭ.

ДАННЫЕ УЧЕНИКА:
- Общая статистика: решено ${stats.total_tasks} задач, точность ${(stats.accuracy_rate * 100).toFixed(1)}%
- Слабые темы: ${JSON.stringify(stats.weak_topics)}
- Любимые темы: ${JSON.stringify(stats.favorite_topics)}
- Распределение по сложности: ${JSON.stringify(stats.difficulty_distribution)}
- Streak: ${stats.current_streak} дней
- Целевой экзамен: ${profile?.target_exam || 'ЕГЭ'}
- Текущий класс: ${profile?.current_grade || 11}
- Целевой балл: ${profile?.target_score || 'не указан'}
- Ежедневная цель: ${profile?.daily_goal_tasks || 10} задач

ДОСТУПНЫЕ МАТЕРИАЛЫ:
${materials.slice(0, 10).map(m => 
  `- ${m.title} (${m.content_type}, сложность: ${m.difficulty_level}, темы: ${m.topics.join(', ')})`
).join('\n')}

ТРЕБОВАНИЯ К РЕКОМЕНДАЦИЯМ:
1. Создай 3-5 конкретных рекомендаций
2. Каждая рекомендация должна быть в формате JSON объекта с полями:
   - type: "task_practice" | "learning_material" | "topic_focus" | "difficulty_adjustment"
   - title: краткий заголовок (до 50 символов)
   - description: подробное описание (до 200 символов)
   - action_text: текст кнопки действия (до 30 символов)
   - priority_score: число от 0 до 1 (важность)
   - confidence_score: число от 0 до 1 (уверенность в рекомендации)
   - reasoning: объяснение почему эта рекомендация подходит (до 300 символов)
   - related_topics: массив строк с темами (если применимо)
   - related_material_ids: массив ID материалов (если применимо)

3. Фокусируйся на слабых темах и областях для улучшения
4. Учитывай текущий уровень и цели ученика
5. Предлагай конкретные действия, а не общие советы

Верни только валидный JSON массив объектов, без дополнительного текста.
`
}

function generateFallbackRecommendations(
  stats: any,
  materials: LearningMaterial[]
): GeneratedRecommendation[] {
  const recommendations: GeneratedRecommendation[] = []

  // Рекомендация по слабым темам
  if (stats.weak_topics && stats.weak_topics.length > 0) {
    const weakestTopic = stats.weak_topics[0]
    recommendations.push({
      type: 'topic_focus',
      title: `Укрепить знания: ${weakestTopic.topic}`,
      description: `Точность по теме "${weakestTopic.topic}" составляет ${(weakestTopic.accuracy * 100).toFixed(0)}%. Рекомендуем дополнительную практику.`,
      action_text: 'Начать практику',
      priority_score: 0.9,
      confidence_score: 0.8,
      reasoning: `Низкая точность ${(weakestTopic.accuracy * 100).toFixed(0)}% требует дополнительной работы`,
      related_topics: [weakestTopic.topic]
    })
  }

  // Рекомендация по материалам
  const relevantMaterials = materials.filter(m => 
    stats.weak_topics?.some((wt: any) => 
      m.topics.some(topic => topic.toLowerCase().includes(wt.topic.toLowerCase()))
    )
  )

  if (relevantMaterials.length > 0) {
    const material = relevantMaterials[0]
    recommendations.push({
      type: 'learning_material',
      title: `Изучить: ${material.title}`,
      description: `Материал поможет разобрать сложные моменты в ваших слабых темах.`,
      action_text: 'Открыть материал',
      priority_score: 0.7,
      confidence_score: 0.6,
      reasoning: 'Материал покрывает ваши слабые места',
      related_material_ids: [material.material_id]
    })
  }

  // Рекомендация по сложности
  if (stats.accuracy_rate > 0.8) {
    recommendations.push({
      type: 'difficulty_adjustment',
      title: 'Повысить сложность задач',
      description: 'Ваша точность высокая! Время перейти к более сложным заданиям.',
      action_text: 'Сложные задачи',
      priority_score: 0.6,
      confidence_score: 0.7,
      reasoning: `Высокая точность ${(stats.accuracy_rate * 100).toFixed(0)}% позволяет увеличить сложность`,
      related_topics: []
    })
  }

  return recommendations
}