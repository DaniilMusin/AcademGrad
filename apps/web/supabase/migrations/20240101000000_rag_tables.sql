-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for storing task chunks with embeddings
CREATE TABLE IF NOT EXISTS task_chunks (
    chunk_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    step_idx INTEGER NOT NULL,
    chunk_md TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure ordering within task
    UNIQUE(task_id, step_idx)
);

-- Table for concept documents (theory/reference material)
CREATE TABLE IF NOT EXISTS concept_docs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tag VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_md TEXT NOT NULL,
    exam_type VARCHAR(50), -- 'егэ', 'огэ' etc.
    subject VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for concept chunks with embeddings
CREATE TABLE IF NOT EXISTS concept_chunks (
    chunk_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    concept_id UUID NOT NULL REFERENCES concept_docs(id) ON DELETE CASCADE,
    chunk_md TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for similarity search
    INDEX(embedding vector_cosine_ops)
);

-- Table for RAG cache (KV store)
CREATE TABLE IF NOT EXISTS rag_cache (
    cache_key VARCHAR(64) PRIMARY KEY, -- SHA256 hash
    task_id UUID NOT NULL,
    question TEXT NOT NULL,
    response_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '12 hours')
);

-- Table for chat usage tracking
CREATE TABLE IF NOT EXISTS chat_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    task_id UUID REFERENCES tasks(id),
    question TEXT NOT NULL,
    response TEXT,
    tokens_used INTEGER,
    response_time_ms INTEGER,
    model_used VARCHAR(50) DEFAULT 'perplexity',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_chunks_task_id ON task_chunks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_chunks_embedding ON task_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_concept_chunks_embedding ON concept_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_rag_cache_expires ON rag_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_usage_user_task ON chat_usage(user_id, task_id);

-- RLS Policies
ALTER TABLE task_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_usage ENABLE ROW LEVEL SECURITY;

-- Policy for task_chunks - users can read chunks for tasks they have access to
CREATE POLICY "Users can read task chunks" ON task_chunks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_chunks.task_id 
            AND tasks.is_public = true
        )
    );

-- Policy for concept docs - public read access
CREATE POLICY "Public read access to concept docs" ON concept_docs
    FOR SELECT USING (true);

CREATE POLICY "Public read access to concept chunks" ON concept_chunks
    FOR SELECT USING (true);

-- Policy for rag_cache - users can access their own cache
CREATE POLICY "Users can access their cache" ON rag_cache
    FOR ALL USING (true); -- Will be filtered by application logic

-- Policy for chat_usage - users can access their own usage
CREATE POLICY "Users can access their chat usage" ON chat_usage
    FOR ALL USING (auth.uid() = user_id);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM rag_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate cosine similarity
CREATE OR REPLACE FUNCTION cosine_similarity(a vector, b vector)
RETURNS float AS $$
BEGIN
    RETURN 1 - (a <=> b);
END;
$$ LANGUAGE plpgsql IMMUTABLE;