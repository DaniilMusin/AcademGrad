-- PL/pgSQL functions for EGE AI Platform

-- Function to match task chunks using vector similarity
CREATE OR REPLACE FUNCTION match_task_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  taskid int DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  task_id bigint,
  chunk_text text,
  embedding vector(1536),
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.id,
    tc.task_id,
    tc.chunk_text,
    tc.embedding,
    1 - (tc.embedding <=> query_embedding) as similarity
  FROM task_chunks tc
  WHERE (taskid IS NULL OR tc.task_id = taskid)
    AND tc.embedding IS NOT NULL
  ORDER BY tc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to award streak badges
CREATE OR REPLACE FUNCTION award_streak_badges(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_streak int;
  max_streak int;
BEGIN
  -- Calculate current streak
  WITH consecutive_days AS (
    SELECT 
      DATE(ts) as solve_date,
      ROW_NUMBER() OVER (ORDER BY DATE(ts) DESC) as row_num,
      DATE(ts) - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY DATE(ts) DESC) - 1) as expected_date
    FROM attempts 
    WHERE user_id = user_uuid 
      AND is_correct = true
      AND ts >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(ts)
    ORDER BY DATE(ts) DESC
  )
  SELECT COUNT(*) INTO current_streak
  FROM consecutive_days
  WHERE solve_date = expected_date;

  -- Award streak badges
  IF current_streak >= 5 AND NOT EXISTS (
    SELECT 1 FROM user_badges 
    WHERE user_id = user_uuid AND badge_id = 1
  ) THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (user_uuid, 1);
  END IF;

  -- Check for speedy badge (3 correct answers in 1 hour)
  IF EXISTS (
    SELECT 1 FROM (
      SELECT COUNT(*) as correct_count
      FROM attempts
      WHERE user_id = user_uuid
        AND is_correct = true
        AND ts >= NOW() - INTERVAL '1 hour'
    ) as recent_correct
    WHERE correct_count >= 3
  ) AND NOT EXISTS (
    SELECT 1 FROM user_badges 
    WHERE user_id = user_uuid AND badge_id = 2
  ) THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (user_uuid, 2);
  END IF;
END;
$$;

-- Function to schedule next review for spaced repetition
CREATE OR REPLACE FUNCTION schedule_next(
  user_uuid uuid,
  task_id_param bigint,
  performance_rating int DEFAULT 3 -- 1-5 scale
)
RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
  last_review timestamptz;
  review_count int;
  next_review timestamptz;
  interval_days int;
BEGIN
  -- Get last review info
  SELECT MAX(ts), COUNT(*) INTO last_review, review_count
  FROM attempts
  WHERE user_id = user_uuid AND task_id = task_id_param;
  
  -- Calculate next review interval using simplified SM-2 algorithm
  CASE 
    WHEN review_count = 0 THEN interval_days := 1;
    WHEN review_count = 1 THEN interval_days := 3;
    WHEN performance_rating >= 4 THEN 
      interval_days := GREATEST(1, (review_count - 1) * 2);
    WHEN performance_rating = 3 THEN 
      interval_days := GREATEST(1, review_count);
    ELSE 
      interval_days := 1;
  END CASE;
  
  -- Calculate next review date
  next_review := COALESCE(last_review, NOW()) + INTERVAL '1 day' * interval_days;
  
  -- Update or insert recommendation
  INSERT INTO recommendations (user_id, task_id, reason, next_review, priority)
  VALUES (user_uuid, task_id_param, 'spaced_repetition', next_review, 
          CASE WHEN performance_rating < 3 THEN 5 ELSE 3 END)
  ON CONFLICT (user_id, task_id) 
  DO UPDATE SET 
    next_review = EXCLUDED.next_review,
    priority = EXCLUDED.priority;
    
  RETURN next_review;
END;
$$;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_weak_topics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW weak_topics;
END;
$$;

-- Add missing constraint for recommendations table
ALTER TABLE recommendations ADD CONSTRAINT recommendations_user_task_unique UNIQUE (user_id, task_id);

-- Create view for user schedule
CREATE OR REPLACE VIEW schedule_view AS
SELECT 
  r.user_id,
  r.task_id,
  t.topic,
  t.difficulty,
  r.reason,
  r.priority,
  r.next_review,
  t.title
FROM recommendations r
JOIN tasks t ON r.task_id = t.id
WHERE r.next_review <= NOW() + INTERVAL '1 day'
ORDER BY r.priority DESC, r.next_review ASC;