-- Function to search task chunks with similarity
CREATE OR REPLACE FUNCTION search_task_chunks(
    task_id_param UUID,
    query_embedding VECTOR(1536),
    similarity_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 4
)
RETURNS TABLE (
    chunk_md TEXT,
    step_idx INTEGER,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.chunk_md,
        tc.step_idx,
        (1 - (tc.embedding <=> query_embedding)) AS similarity
    FROM task_chunks tc
    WHERE 
        tc.task_id = task_id_param
        AND (1 - (tc.embedding <=> query_embedding)) > similarity_threshold
    ORDER BY tc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to search concept chunks with similarity
CREATE OR REPLACE FUNCTION search_concept_chunks(
    query_embedding VECTOR(1536),
    exam_filter VARCHAR DEFAULT NULL,
    topic_filter VARCHAR DEFAULT NULL,
    similarity_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 2
)
RETURNS TABLE (
    chunk_md TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.chunk_md,
        (1 - (cc.embedding <=> query_embedding)) AS similarity
    FROM concept_chunks cc
    JOIN concept_docs cd ON cc.concept_id = cd.id
    WHERE 
        (1 - (cc.embedding <=> query_embedding)) > similarity_threshold
        AND (exam_filter IS NULL OR cd.exam_type = exam_filter)
        AND (topic_filter IS NULL OR cd.subject = topic_filter)
    ORDER BY cc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to batch insert task chunks with embeddings
CREATE OR REPLACE FUNCTION insert_task_chunks(
    p_task_id UUID,
    p_chunks JSONB
)
RETURNS INT AS $$
DECLARE
    chunk_record RECORD;
    inserted_count INT := 0;
BEGIN
    -- Delete existing chunks for this task
    DELETE FROM task_chunks WHERE task_id = p_task_id;
    
    -- Insert new chunks
    FOR chunk_record IN 
        SELECT * FROM jsonb_to_recordset(p_chunks) AS x(
            step_idx INT,
            chunk_md TEXT,
            embedding VECTOR(1536)
        )
    LOOP
        INSERT INTO task_chunks (task_id, step_idx, chunk_md, embedding)
        VALUES (p_task_id, chunk_record.step_idx, chunk_record.chunk_md, chunk_record.embedding);
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to batch insert concept chunks
CREATE OR REPLACE FUNCTION insert_concept_chunks(
    p_concept_id UUID,
    p_chunks JSONB
)
RETURNS INT AS $$
DECLARE
    chunk_record RECORD;
    inserted_count INT := 0;
BEGIN
    -- Delete existing chunks for this concept
    DELETE FROM concept_chunks WHERE concept_id = p_concept_id;
    
    -- Insert new chunks
    FOR chunk_record IN 
        SELECT * FROM jsonb_to_recordset(p_chunks) AS x(
            chunk_md TEXT,
            embedding VECTOR(1536)
        )
    LOOP
        INSERT INTO concept_chunks (concept_id, chunk_md, embedding)
        VALUES (p_concept_id, chunk_record.chunk_md, chunk_record.embedding);
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get chat statistics
CREATE OR REPLACE FUNCTION get_chat_stats(
    user_id_param UUID DEFAULT NULL,
    date_from TIMESTAMP DEFAULT NULL,
    date_to TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
    total_questions INT,
    avg_response_time_ms FLOAT,
    total_tokens INT,
    unique_tasks INT,
    cache_hit_rate FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INT as total_questions,
        AVG(cu.response_time_ms) as avg_response_time_ms,
        SUM(cu.tokens_used)::INT as total_tokens,
        COUNT(DISTINCT cu.task_id)::INT as unique_tasks,
        -- Cache hit rate calculation would need additional logic
        0.0::FLOAT as cache_hit_rate
    FROM chat_usage cu
    WHERE 
        (user_id_param IS NULL OR cu.user_id = user_id_param)
        AND (date_from IS NULL OR cu.created_at >= date_from)
        AND (date_to IS NULL OR cu.created_at <= date_to);
END;
$$ LANGUAGE plpgsql;

-- Function to clean old cache entries (called by cron)
CREATE OR REPLACE FUNCTION cleanup_rag_cache()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM rag_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_chunks_task_step ON task_chunks(task_id, step_idx);
CREATE INDEX IF NOT EXISTS idx_concept_docs_exam_subject ON concept_docs(exam_type, subject);
CREATE INDEX IF NOT EXISTS idx_chat_usage_created_at ON chat_usage(created_at);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_task_chunks TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_concept_chunks TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_chat_stats TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_rag_cache TO service_role;