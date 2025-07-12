-- Additional tables for full functionality

-- Add new fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS points int DEFAULT 1,
ADD COLUMN IF NOT EXISTS time_limit int DEFAULT 30;

-- Events table for tracking user actions
CREATE TABLE public.events (
  id            bigserial primary key,
  user_id       uuid references auth.users on delete cascade,
  event_type    text not null check (event_type in ('task_start', 'task_submit', 'chat_message', 'lesson_complete', 'badge_earned')),
  event_data    jsonb,
  ts            timestamptz default now()
);

-- Lesson reports table
CREATE TABLE public.lesson_reports (
  id            bigserial primary key,
  user_id       uuid references auth.users on delete cascade,
  week_start    date not null,
  week_end      date not null,
  tasks_solved  int default 0,
  accuracy      float default 0.0,
  topics_covered jsonb,
  weak_topics   jsonb,
  pdf_url       text,
  created_at    timestamptz default now()
);

-- Recommendations table for spaced repetition
CREATE TABLE public.recommendations (
  id            bigserial primary key,
  user_id       uuid references auth.users on delete cascade,
  task_id       bigint references tasks(id) on delete cascade,
  reason        text not null check (reason in ('weak_topic', 'spaced_repetition', 'difficulty_ramp')),
  priority      int default 1 check (priority between 1 and 5),
  next_review   timestamptz not null,
  created_at    timestamptz default now()
);

-- Add user preferences to store onboarding data
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX idx_events_user_id_ts ON public.events(user_id, ts DESC);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_lesson_reports_user_week ON public.lesson_reports(user_id, week_start);
CREATE INDEX idx_recommendations_user_next ON public.recommendations(user_id, next_review);
CREATE INDEX idx_recommendations_priority ON public.recommendations(priority DESC);
CREATE INDEX idx_task_chunks_embedding ON public.task_chunks USING ivfflat (embedding vector_cosine_ops);