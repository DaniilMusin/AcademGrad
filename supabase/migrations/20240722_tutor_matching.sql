-- Migration: Add tutors table and matching function
-- Description: Creates tutors table with embeddings and AI-powered matching functionality

-- Create tutors table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tutors (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT NOT NULL,
    subjects TEXT[] NOT NULL,
    bio_embedding VECTOR(1536),
    experience_years INTEGER DEFAULT 1,
    rating DECIMAL(3,2) DEFAULT 5.0,
    price_per_hour INTEGER DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_tutors_bio_embedding 
ON public.tutors USING ivfflat (bio_embedding vector_cosine_ops) 
WITH (lists = 100);

-- Create index for subject filtering
CREATE INDEX IF NOT EXISTS idx_tutors_subjects 
ON public.tutors USING gin (subjects);

-- Function to match tutors using vector similarity
CREATE OR REPLACE FUNCTION match_tutors(
  query_embedding vector(1536),
  subject_filter text DEFAULT NULL,
  match_count int DEFAULT 5
)
RETURNS TABLE(
  id bigint,
  name text,
  bio text,
  subjects text[],
  experience_years int,
  rating decimal,
  price_per_hour int,
  similarity_score float
)
LANGUAGE SQL
AS $$
  SELECT 
    t.id,
    t.name,
    t.bio,
    t.subjects,
    t.experience_years,
    t.rating,
    t.price_per_hour,
    1 - (t.bio_embedding <=> query_embedding) as similarity_score
  FROM tutors t
  WHERE 
    t.bio_embedding IS NOT NULL
    AND (subject_filter IS NULL OR subject_filter = ANY(t.subjects))
  ORDER BY t.bio_embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Add RLS policies for tutors table
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read tutor profiles
CREATE POLICY "Tutors are viewable by everyone" 
ON public.tutors FOR SELECT 
USING (true);

-- Only authenticated users can insert/update (for admin purposes)
CREATE POLICY "Only authenticated users can modify tutors" 
ON public.tutors FOR ALL 
USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tutors_updated_at
    BEFORE UPDATE ON public.tutors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();