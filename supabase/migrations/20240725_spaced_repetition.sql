-- Migration for spaced repetition functionality
-- Creates table and functions for SM-2 algorithm implementation

-- Create spaced repetition table
CREATE TABLE IF NOT EXISTS public.spaced_repetition (
  id            bigserial primary key,
  user_id       uuid references auth.users on delete cascade,
  task_id       bigint references tasks(id) on delete cascade,
  repetition_count int default 0,
  easiness_factor float default 2.5 check (easiness_factor >= 1.3),
  interval_days   int default 1,
  next_review_date timestamptz not null,
  last_review_date timestamptz default now(),
  performance_rating int check (performance_rating between 1 and 5),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Create unique constraint
ALTER TABLE public.spaced_repetition ADD CONSTRAINT spaced_repetition_user_task_unique UNIQUE (user_id, task_id);

-- Create indexes for better performance
CREATE INDEX idx_spaced_repetition_user_id ON public.spaced_repetition(user_id);
CREATE INDEX idx_spaced_repetition_next_review ON public.spaced_repetition(next_review_date);
CREATE INDEX idx_spaced_repetition_user_review ON public.spaced_repetition(user_id, next_review_date);

-- RLS policies for spaced repetition
ALTER TABLE public.spaced_repetition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spaced repetition data" ON public.spaced_repetition
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spaced repetition data" ON public.spaced_repetition
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spaced repetition data" ON public.spaced_repetition
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to calculate next review interval using SM-2 algorithm
CREATE OR REPLACE FUNCTION calculate_next_review_interval(
  repetition_count int,
  easiness_factor float,
  performance_rating int
) RETURNS TABLE (
  new_interval int,
  new_easiness_factor float
) AS $$
DECLARE
  ef float := easiness_factor;
  interval_days int;
BEGIN
  -- Update easiness factor based on performance
  ef := ef + (0.1 - (5 - performance_rating) * (0.08 + (5 - performance_rating) * 0.02));
  ef := GREATEST(1.3, ef);
  
  -- Calculate interval based on repetition count
  IF repetition_count = 0 THEN
    interval_days := 1;
  ELSIF repetition_count = 1 THEN
    interval_days := 6;
  ELSE
    -- For repetitions > 1, use exponential backoff
    interval_days := CEIL(POWER(ef, repetition_count - 1) * 6);
  END IF;
  
  -- If performance is poor (< 3), reset to beginning
  IF performance_rating < 3 THEN
    interval_days := 1;
  END IF;
  
  -- Cap maximum interval at 90 days
  interval_days := LEAST(interval_days, 90);
  
  RETURN QUERY SELECT interval_days, ef;
END;
$$ LANGUAGE plpgsql;

-- Function to update spaced repetition after task completion
CREATE OR REPLACE FUNCTION update_spaced_repetition(
  user_uuid uuid,
  task_id_param bigint,
  performance_rating int
) RETURNS void AS $$
DECLARE
  current_record public.spaced_repetition%ROWTYPE;
  new_interval int;
  new_ef float;
  next_review timestamptz;
BEGIN
  -- Get current record or create default values
  SELECT * INTO current_record
  FROM public.spaced_repetition
  WHERE user_id = user_uuid AND task_id = task_id_param;
  
  IF current_record IS NULL THEN
    -- First time: create new record
    SELECT interval_days, easiness_factor INTO new_interval, new_ef
    FROM calculate_next_review_interval(0, 2.5, performance_rating);
    
    next_review := NOW() + INTERVAL '1 day' * new_interval;
    
    INSERT INTO public.spaced_repetition (
      user_id, task_id, repetition_count, easiness_factor, 
      interval_days, next_review_date, performance_rating
    ) VALUES (
      user_uuid, task_id_param, 1, new_ef, 
      new_interval, next_review, performance_rating
    );
  ELSE
    -- Update existing record
    SELECT interval_days, easiness_factor INTO new_interval, new_ef
    FROM calculate_next_review_interval(
      current_record.repetition_count, 
      current_record.easiness_factor, 
      performance_rating
    );
    
    next_review := NOW() + INTERVAL '1 day' * new_interval;
    
    UPDATE public.spaced_repetition
    SET
      repetition_count = CASE 
        WHEN performance_rating < 3 THEN 0 
        ELSE current_record.repetition_count + 1 
      END,
      easiness_factor = new_ef,
      interval_days = new_interval,
      next_review_date = next_review,
      last_review_date = NOW(),
      performance_rating = performance_rating,
      updated_at = NOW()
    WHERE user_id = user_uuid AND task_id = task_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get due reviews for a user
CREATE OR REPLACE FUNCTION get_due_reviews(
  user_uuid uuid,
  review_limit int DEFAULT 10
) RETURNS TABLE (
  task_id bigint,
  title text,
  topic text,
  difficulty int,
  next_review_date timestamptz,
  repetition_count int,
  performance_rating int
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.task_id,
    t.title,
    t.topic,
    t.difficulty,
    sr.next_review_date,
    sr.repetition_count,
    sr.performance_rating
  FROM public.spaced_repetition sr
  JOIN public.tasks t ON sr.task_id = t.id
  WHERE sr.user_id = user_uuid
    AND sr.next_review_date <= NOW()
  ORDER BY sr.next_review_date ASC
  LIMIT review_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get spaced repetition statistics
CREATE OR REPLACE FUNCTION get_spaced_repetition_stats(
  user_uuid uuid
) RETURNS TABLE (
  total_reviews bigint,
  due_reviews bigint,
  average_performance float,
  retention_rate float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (WHERE next_review_date <= NOW()) as due_reviews,
    AVG(performance_rating) as average_performance,
    (COUNT(*) FILTER (WHERE performance_rating >= 3) * 100.0 / NULLIF(COUNT(*), 0)) as retention_rate
  FROM public.spaced_repetition
  WHERE user_id = user_uuid
    AND last_review_date > NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to get average performance for a user
CREATE OR REPLACE FUNCTION get_average_performance(
  user_uuid uuid
) RETURNS float AS $$
DECLARE
  avg_performance float;
BEGIN
  SELECT AVG(performance_rating) INTO avg_performance
  FROM public.spaced_repetition
  WHERE user_id = user_uuid
    AND last_review_date > NOW() - INTERVAL '30 days';
  
  RETURN COALESCE(avg_performance, 0.0);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_spaced_repetition_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_spaced_repetition_updated_at
  BEFORE UPDATE ON public.spaced_repetition
  FOR EACH ROW
  EXECUTE FUNCTION update_spaced_repetition_updated_at();

-- Create a view for easy querying of due reviews
CREATE OR REPLACE VIEW public.due_reviews AS
SELECT 
  sr.user_id,
  sr.task_id,
  t.title,
  t.topic,
  t.difficulty,
  sr.next_review_date,
  sr.repetition_count,
  sr.performance_rating,
  sr.easiness_factor,
  EXTRACT(EPOCH FROM (sr.next_review_date - NOW())) / 86400 as days_until_due
FROM public.spaced_repetition sr
JOIN public.tasks t ON sr.task_id = t.id
WHERE sr.next_review_date <= NOW() + INTERVAL '1 day'
ORDER BY sr.next_review_date ASC;

-- Add comment for documentation
COMMENT ON TABLE public.spaced_repetition IS 'Stores spaced repetition data for each user-task pair using SM-2 algorithm';
COMMENT ON COLUMN public.spaced_repetition.easiness_factor IS 'Difficulty factor for SM-2 algorithm (1.3 - 2.5)';
COMMENT ON COLUMN public.spaced_repetition.interval_days IS 'Number of days until next review';
COMMENT ON COLUMN public.spaced_repetition.performance_rating IS 'User performance rating (1-5) for last review';
COMMENT ON FUNCTION calculate_next_review_interval IS 'Calculates next review interval using SM-2 algorithm';
COMMENT ON FUNCTION update_spaced_repetition IS 'Updates spaced repetition data after task completion';
COMMENT ON VIEW public.due_reviews IS 'View showing all tasks due for review within the next day';