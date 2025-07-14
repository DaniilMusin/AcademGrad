-- User preferences table for onboarding and personalization
create table public.user_preferences (
  user_id          uuid primary key references auth.users on delete cascade,
  goal_score       int check (goal_score in (70, 80, 90)),
  weak_topics      text[] default '{}',
  tg_chat          text,
  fcm_token        text,
  onboarding_step  int default 1 check (onboarding_step between 1 and 4),
  completed_at     timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- User calendar events for scheduling
create table public.user_events (
  id               bigserial primary key,
  user_id          uuid references auth.users on delete cascade,
  title            text not null,
  start_time       timestamptz not null,
  end_time         timestamptz not null,
  event_type       text default 'study' check (event_type in ('study', 'exam', 'break')),
  is_draft         boolean default false,
  created_at       timestamptz default now()
);

-- XP and gamification tracking
create table public.user_progress (
  user_id          uuid primary key references auth.users on delete cascade,
  total_xp         int default 0,
  current_streak   int default 0,
  longest_streak   int default 0,
  last_activity    timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Update function for preferences
create or replace function update_user_preferences() 
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_preferences_trigger
  before update on user_preferences
  for each row execute function update_user_preferences();

-- RLS policies
alter table user_preferences enable row level security;
alter table user_events enable row level security;
alter table user_progress enable row level security;

create policy "Users can view own preferences" 
  on user_preferences for select 
  using (auth.uid() = user_id);

create policy "Users can update own preferences" 
  on user_preferences for all 
  using (auth.uid() = user_id);

create policy "Users can view own events" 
  on user_events for select 
  using (auth.uid() = user_id);

create policy "Users can manage own events" 
  on user_events for all 
  using (auth.uid() = user_id);

create policy "Users can view own progress" 
  on user_progress for select 
  using (auth.uid() = user_id);

create policy "Users can update own progress" 
  on user_progress for all 
  using (auth.uid() = user_id);