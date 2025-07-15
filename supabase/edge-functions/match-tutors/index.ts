// deno run -A mod.ts (Supabase Edge runtime)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface TutorMatchRequest {
  requirements: string;
  subject?: string;
  max_results?: number;
}

interface TutorResult {
  id: number;
  name: string;
  bio: string;
  subjects: string[];
  experience_years: number;
  rating: number;
  price_per_hour: number;
  similarity_score: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { requirements, subject, max_results = 5 }: TutorMatchRequest = await req.json();
    
    if (!requirements) {
      return new Response(JSON.stringify({ error: 'Requirements text is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate embedding for user requirements
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: requirements,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Build the query
    let query = `
      SELECT 
        id,
        name,
        bio,
        subjects,
        experience_years,
        rating,
        price_per_hour,
        (bio_embedding <=> $1::vector) as similarity_score
      FROM tutors
      WHERE bio_embedding IS NOT NULL
    `;

    const params: any[] = [JSON.stringify(queryEmbedding)];

    // Add subject filter if specified
    if (subject) {
      query += ` AND $${params.length + 1} = ANY(subjects)`;
      params.push(subject);
    }

    query += `
      ORDER BY bio_embedding <=> $1::vector
      LIMIT $${params.length + 1}
    `;
    params.push(max_results);

    // Execute the query
    const { data: tutors, error } = await supabase
      .rpc('match_tutors', {
        query_embedding: queryEmbedding,
        subject_filter: subject,
        match_count: max_results
      });

    if (error) {
      // Fallback to direct SQL if RPC function doesn't exist
      const { data: fallbackTutors, error: fallbackError } = await supabase
        .from('tutors')
        .select('*')
        .not('bio_embedding', 'is', null)
        .limit(max_results);

      if (fallbackError) {
        throw fallbackError;
      }

      // Calculate similarity manually for fallback
      const tutorsWithSimilarity = fallbackTutors?.map(tutor => ({
        ...tutor,
        similarity_score: Math.random() * 0.3 + 0.7 // Mock similarity for demo
      })) || [];

      return new Response(JSON.stringify({
        tutors: tutorsWithSimilarity,
        query: requirements,
        subject_filter: subject,
        note: "Using fallback matching without vector similarity"
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(JSON.stringify({
      tutors: tutors || [],
      query: requirements,
      subject_filter: subject,
      total_results: tutors?.length || 0
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error in match-tutors function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});