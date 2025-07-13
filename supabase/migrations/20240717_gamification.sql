-- Enhanced gamification system
-- XP calculation function
create or replace function calculate_xp_gain(difficulty_level int, is_correct boolean, time_spent int)
returns int as $$
begin
  if not is_correct then
    return 0; -- No XP for incorrect answers
  end if;
  
  -- Base XP calculation: difficulty * 10 + time bonus
  return difficulty_level * 10 + case 
    when time_spent <= 60 then 5   -- Speed bonus
    when time_spent <= 180 then 3  -- Good time bonus
    when time_spent <= 300 then 1  -- Standard bonus
    else 0                          -- No time bonus
  end;
end;
$$ language plpgsql;

-- Function to update user progress and award XP
create or replace function update_user_progress(
  p_user_id uuid,
  p_xp_gained int,
  p_streak_increment int default 1
) returns void as $$
declare
  current_progress user_progress%ROWTYPE;
  new_streak int;
  last_activity_date date;
  today_date date := current_date;
begin
  -- Get current progress
  select * into current_progress
  from user_progress
  where user_id = p_user_id;
  
  -- Calculate new streak
  if current_progress.last_activity is not null then
    last_activity_date := current_progress.last_activity::date;
    
    if last_activity_date = today_date then
      -- Same day, no streak change
      new_streak := current_progress.current_streak;
    elsif last_activity_date = today_date - interval '1 day' then
      -- Next day, increment streak
      new_streak := current_progress.current_streak + p_streak_increment;
    else
      -- Gap in activity, reset streak
      new_streak := p_streak_increment;
    end if;
  else
    -- First activity
    new_streak := p_streak_increment;
  end if;
  
  -- Update progress
  update user_progress
  set
    total_xp = total_xp + p_xp_gained,
    current_streak = new_streak,
    longest_streak = greatest(longest_streak, new_streak),
    last_activity = now(),
    updated_at = now()
  where user_id = p_user_id;
  
  -- Insert if not exists
  if not found then
    insert into user_progress (user_id, total_xp, current_streak, longest_streak, last_activity)
    values (p_user_id, p_xp_gained, new_streak, new_streak, now());
  end if;
end;
$$ language plpgsql;

-- Enhanced badges with more types and conditions
insert into badges(id, code, title, icon) values
  (3, 'first_solve', 'Первое решение', '🎯'),
  (4, 'streak10', 'Стрик 10 дней', '🔥'),
  (5, 'streak30', 'Стрик 30 дней', '⚡'),
  (6, 'hundred_xp', '100 XP', '🌟'),
  (7, 'five_hundred_xp', '500 XP', '💫'),
  (8, 'thousand_xp', '1000 XP', '🏆'),
  (9, 'math_expert', 'Эксперт математики', '📐'),
  (10, 'speed_demon', 'Скоростной демон', '⚡'),
  (11, 'perfectionist', 'Перфекционист', '💎'),
  (12, 'night_owl', 'Сова', '🦉'),
  (13, 'early_bird', 'Ранняя пташка', '🐦'),
  (14, 'weekend_warrior', 'Воин выходного дня', '⚔️'),
  (15, 'monthly_champion', 'Чемпион месяца', '👑')
on conflict (id) do nothing;

-- Badge checking function
create or replace function check_and_award_badges(p_user_id uuid)
returns void as $$
declare
  user_stats record;
  badge_id int;
begin
  -- Get user statistics
  select 
    up.total_xp,
    up.current_streak,
    up.longest_streak,
    count(a.id) as total_attempts,
    count(case when a.is_correct then 1 end) as correct_attempts,
    avg(case when a.is_correct then a.time_spent_s end) as avg_time_correct,
    count(case when extract(hour from a.ts) between 22 and 23 or extract(hour from a.ts) between 0 and 6 then 1 end) as night_attempts,
    count(case when extract(hour from a.ts) between 6 and 9 then 1 end) as early_attempts,
    count(case when extract(dow from a.ts) in (0, 6) then 1 end) as weekend_attempts
  into user_stats
  from user_progress up
  left join attempts a on a.user_id = up.user_id
  where up.user_id = p_user_id
  group by up.user_id, up.total_xp, up.current_streak, up.longest_streak;
  
  -- Award badges based on conditions
  
  -- XP badges
  if user_stats.total_xp >= 100 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 6) on conflict do nothing;
  end if;
  
  if user_stats.total_xp >= 500 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 7) on conflict do nothing;
  end if;
  
  if user_stats.total_xp >= 1000 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 8) on conflict do nothing;
  end if;
  
  -- Streak badges
  if user_stats.current_streak >= 5 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 1) on conflict do nothing;
  end if;
  
  if user_stats.current_streak >= 10 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 4) on conflict do nothing;
  end if;
  
  if user_stats.current_streak >= 30 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 5) on conflict do nothing;
  end if;
  
  -- First solve badge
  if user_stats.total_attempts >= 1 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 3) on conflict do nothing;
  end if;
  
  -- Speed demon (average time < 60 seconds for correct answers)
  if user_stats.avg_time_correct < 60 and user_stats.correct_attempts >= 10 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 10) on conflict do nothing;
  end if;
  
  -- Perfectionist (90%+ accuracy with 50+ attempts)
  if user_stats.total_attempts >= 50 and 
     (user_stats.correct_attempts::float / user_stats.total_attempts) >= 0.9 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 11) on conflict do nothing;
  end if;
  
  -- Night owl (50+ attempts between 22:00-06:00)
  if user_stats.night_attempts >= 50 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 12) on conflict do nothing;
  end if;
  
  -- Early bird (50+ attempts between 06:00-09:00)
  if user_stats.early_attempts >= 50 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 13) on conflict do nothing;
  end if;
  
  -- Weekend warrior (100+ attempts on weekends)
  if user_stats.weekend_attempts >= 100 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 14) on conflict do nothing;
  end if;
  
end;
$$ language plpgsql;

-- Leaderboard view
create or replace view leaderboard as
select 
  u.id as user_id,
  u.email,
  up.total_xp,
  up.current_streak,
  up.longest_streak,
  count(ub.badge_id) as badge_count,
  rank() over (order by up.total_xp desc) as xp_rank,
  rank() over (order by up.current_streak desc) as streak_rank
from auth.users u
join user_progress up on u.id = up.user_id
left join user_badges ub on u.id = ub.user_id
group by u.id, u.email, up.total_xp, up.current_streak, up.longest_streak
order by up.total_xp desc;

-- Weekly leaderboard for classes/groups
create table public.user_groups (
  id bigserial primary key,
  name text not null,
  description text,
  invite_code text unique,
  created_by uuid references auth.users on delete cascade,
  created_at timestamptz default now()
);

create table public.user_group_members (
  user_id uuid references auth.users on delete cascade,
  group_id bigint references user_groups on delete cascade,
  joined_at timestamptz default now(),
  primary key (user_id, group_id)
);

-- RLS for groups
alter table user_groups enable row level security;
alter table user_group_members enable row level security;

create policy "Users can view groups they are members of"
  on user_groups for select
  using (
    id in (
      select group_id from user_group_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can view group memberships"
  on user_group_members for select
  using (auth.uid() = user_id);

-- Group leaderboard view
create or replace view group_leaderboard as
select 
  g.id as group_id,
  g.name as group_name,
  u.id as user_id,
  u.email,
  up.total_xp,
  up.current_streak,
  rank() over (partition by g.id order by up.total_xp desc) as group_rank
from user_groups g
join user_group_members gm on g.id = gm.group_id
join auth.users u on gm.user_id = u.id
join user_progress up on u.id = up.user_id
order by g.id, up.total_xp desc;

-- Trigger to update XP and check badges when attempt is logged
create or replace function handle_attempt_xp()
returns trigger as $$
declare
  xp_gain int;
  task_difficulty int;
begin
  -- Get task difficulty
  select difficulty into task_difficulty
  from tasks
  where id = NEW.task_id;
  
  -- Calculate XP gain
  xp_gain := calculate_xp_gain(task_difficulty, NEW.is_correct, NEW.time_spent_s);
  
  -- Update user progress
  if xp_gain > 0 then
    perform update_user_progress(NEW.user_id, xp_gain);
    
    -- Check and award badges
    perform check_and_award_badges(NEW.user_id);
  end if;
  
  return NEW;
end;
$$ language plpgsql;

-- Create trigger
drop trigger if exists attempt_xp_trigger on attempts;
create trigger attempt_xp_trigger
  after insert on attempts
  for each row execute function handle_attempt_xp();