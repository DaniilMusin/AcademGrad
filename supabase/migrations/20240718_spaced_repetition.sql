-- Spaced Repetition System (SM-2 Algorithm)
-- Task scheduling and repetition tracking

create table public.task_repetitions (
  id               bigserial primary key,
  user_id          uuid references auth.users on delete cascade,
  task_id          bigint references tasks(id) on delete cascade,
  easiness_factor  real default 2.5 check (easiness_factor >= 1.3),
  interval_days    int default 1 check (interval_days > 0),
  repetition_count int default 0,
  last_reviewed    timestamptz,
  next_review      timestamptz,
  quality_score    int, -- Last quality score (0-5)
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique(user_id, task_id)
);

-- SM-2 Algorithm Implementation
create or replace function calculate_sm2_schedule(
  current_ef real,
  current_interval int,
  repetition_count int,
  quality int -- 0-5 scale
) returns table(
  new_ef real,
  new_interval int,
  new_repetition_count int
) as $$
begin
  -- Quality less than 3 means incorrect answer, reset
  if quality < 3 then
    return query select 
      greatest(1.3, current_ef - 0.8 + (0.28 * quality) - (0.02 * quality * quality))::real,
      1,
      0;
  else
    -- Correct answer, calculate new values
    declare
      ef_new real;
      interval_new int;
      rep_new int;
    begin
      -- Calculate new easiness factor
      ef_new := current_ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      ef_new := greatest(1.3, ef_new);
      
      -- Calculate new interval
      rep_new := repetition_count + 1;
      
      if rep_new = 1 then
        interval_new := 1;
      elsif rep_new = 2 then
        interval_new := 6;
      else
        interval_new := round(current_interval * ef_new);
      end if;
      
      return query select ef_new, interval_new, rep_new;
    end;
  end if;
end;
$$ language plpgsql;

-- Function to schedule next review
create or replace function schedule_next_review(
  p_user_id uuid,
  p_task_id bigint,
  p_quality int, -- 0-5 quality score
  p_time_spent int default null
) returns void as $$
declare
  current_rep task_repetitions%ROWTYPE;
  sm2_result record;
  next_review_date timestamptz;
begin
  -- Get current repetition data
  select * into current_rep
  from task_repetitions
  where user_id = p_user_id and task_id = p_task_id;
  
  -- Calculate new SM-2 values
  if current_rep.id is not null then
    select * into sm2_result
    from calculate_sm2_schedule(
      current_rep.easiness_factor,
      current_rep.interval_days,
      current_rep.repetition_count,
      p_quality
    );
  else
    -- First time seeing this task
    select * into sm2_result
    from calculate_sm2_schedule(2.5, 1, 0, p_quality);
  end if;
  
  -- Calculate next review date
  next_review_date := now() + (sm2_result.new_interval || ' days')::interval;
  
  -- Update or insert repetition record
  insert into task_repetitions (
    user_id, task_id, easiness_factor, interval_days, 
    repetition_count, last_reviewed, next_review, quality_score
  ) values (
    p_user_id, p_task_id, sm2_result.new_ef, sm2_result.new_interval,
    sm2_result.new_repetition_count, now(), next_review_date, p_quality
  ) on conflict (user_id, task_id) do update set
    easiness_factor = sm2_result.new_ef,
    interval_days = sm2_result.new_interval,
    repetition_count = sm2_result.new_repetition_count,
    last_reviewed = now(),
    next_review = next_review_date,
    quality_score = p_quality,
    updated_at = now();
end;
$$ language plpgsql;

-- View for tasks due for review
create or replace view tasks_due_for_review as
select 
  tr.user_id,
  tr.task_id,
  t.exam,
  t.topic,
  t.subtopic,
  t.difficulty,
  t.statement_md,
  tr.easiness_factor,
  tr.interval_days,
  tr.repetition_count,
  tr.next_review,
  tr.last_reviewed,
  extract(epoch from (tr.next_review - now()))/86400 as days_until_due,
  -- Priority calculation (higher = more urgent)
  case 
    when tr.next_review <= now() then 100 -- Overdue
    when tr.next_review <= now() + interval '1 day' then 90 -- Due today
    when tr.next_review <= now() + interval '2 days' then 80 -- Due soon
    else 70 - extract(epoch from (tr.next_review - now()))/86400 -- Future
  end as priority_score
from task_repetitions tr
join tasks t on tr.task_id = t.id
where tr.next_review <= now() + interval '7 days' -- Only show tasks due within a week
order by priority_score desc, tr.next_review asc;

-- View for personalized task recommendations
create or replace view next_drill_recommendations as
select distinct on (user_id, priority_bucket)
  tr.user_id,
  t.id as task_id,
  t.exam,
  t.topic,
  t.subtopic,
  t.difficulty,
  t.statement_md,
  tr.easiness_factor,
  tr.priority_score,
  tr.days_until_due,
  -- Priority buckets for balanced recommendations
  case 
    when tr.priority_score >= 90 then 'urgent'
    when tr.priority_score >= 80 then 'due_soon'
    when tr.priority_score >= 70 then 'scheduled'
    else 'future'
  end as priority_bucket,
  -- Recommendation reason
  case 
    when tr.priority_score >= 100 then 'Просрочено - требует немедленного повторения'
    when tr.priority_score >= 90 then 'Запланировано на сегодня'
    when tr.priority_score >= 80 then 'Запланировано на завтра'
    else 'Повторение через ' || ceil(tr.days_until_due) || ' дней'
  end as recommendation_reason
from tasks_due_for_review tr
join tasks t on tr.task_id = t.id
order by tr.user_id, priority_bucket, tr.priority_score desc;

-- Function to get personalized task recommendations
create or replace function get_personalized_recommendations(
  p_user_id uuid,
  p_limit int default 10
) returns table(
  task_id bigint,
  exam text,
  topic text,
  subtopic text,
  difficulty int,
  statement_md text,
  priority_score numeric,
  recommendation_reason text,
  priority_bucket text
) as $$
begin
  return query
  with weak_topics as (
    -- Get user's weak topics from preferences
    select unnest(weak_topics) as topic
    from user_preferences
    where user_id = p_user_id
  ),
  recommendations as (
    -- Spaced repetition recommendations
    select 
      ndr.task_id,
      ndr.exam,
      ndr.topic,
      ndr.subtopic,
      ndr.difficulty,
      ndr.statement_md,
      ndr.priority_score,
      ndr.recommendation_reason,
      ndr.priority_bucket,
      1 as source_priority -- Highest priority
    from next_drill_recommendations ndr
    where ndr.user_id = p_user_id
    
    union all
    
    -- Weak topics recommendations
    select 
      t.id as task_id,
      t.exam,
      t.topic,
      t.subtopic,
      t.difficulty,
      t.statement_md,
      50 + (5 - t.difficulty) * 5 as priority_score, -- Easier tasks get higher priority for weak topics
      'Слабая тема: ' || t.topic as recommendation_reason,
      'weak_topic' as priority_bucket,
      2 as source_priority -- Medium priority
    from tasks t
    join weak_topics wt on t.topic = wt.topic
    where not exists (
      select 1 from task_repetitions tr
      where tr.user_id = p_user_id and tr.task_id = t.id
    )
    
    union all
    
    -- New tasks recommendations (not yet attempted)
    select 
      t.id as task_id,
      t.exam,
      t.topic,
      t.subtopic,
      t.difficulty,
      t.statement_md,
      30 + random() * 20 as priority_score, -- Random priority for variety
      'Новая задача по теме: ' || t.topic as recommendation_reason,
      'new_task' as priority_bucket,
      3 as source_priority -- Lowest priority
    from tasks t
    where not exists (
      select 1 from attempts a
      where a.user_id = p_user_id and a.task_id = t.id
    )
    and not exists (
      select 1 from task_repetitions tr
      where tr.user_id = p_user_id and tr.task_id = t.id
    )
  )
  select 
    r.task_id,
    r.exam,
    r.topic,
    r.subtopic,
    r.difficulty,
    r.statement_md,
    r.priority_score,
    r.recommendation_reason,
    r.priority_bucket
  from recommendations r
  order by r.source_priority, r.priority_score desc
  limit p_limit;
end;
$$ language plpgsql;

-- Trigger to schedule repetition when attempt is made
create or replace function handle_attempt_repetition()
returns trigger as $$
declare
  quality_score int;
begin
  -- Convert boolean correctness to 0-5 quality score
  -- Add time factor for more nuanced scoring
  if NEW.is_correct then
    quality_score := case 
      when NEW.time_spent_s <= 30 then 5  -- Perfect and fast
      when NEW.time_spent_s <= 60 then 4  -- Good
      when NEW.time_spent_s <= 180 then 3 -- Acceptable
      else 3 -- Slow but correct
    end;
  else
    quality_score := 1; -- Incorrect
  end if;
  
  -- Schedule next review
  perform schedule_next_review(NEW.user_id, NEW.task_id, quality_score, NEW.time_spent_s);
  
  return NEW;
end;
$$ language plpgsql;

-- Create trigger for repetition scheduling
drop trigger if exists attempt_repetition_trigger on attempts;
create trigger attempt_repetition_trigger
  after insert on attempts
  for each row execute function handle_attempt_repetition();

-- RLS policies for task_repetitions
alter table task_repetitions enable row level security;

create policy "Users can view own repetitions"
  on task_repetitions for select
  using (auth.uid() = user_id);

create policy "Users can manage own repetitions"
  on task_repetitions for all
  using (auth.uid() = user_id);

-- Indexes for performance
create index idx_task_repetitions_user_next_review on task_repetitions(user_id, next_review);
create index idx_task_repetitions_next_review on task_repetitions(next_review);
create index idx_task_repetitions_user_priority on task_repetitions(user_id, (case when next_review <= now() then 100 else 0 end));

-- Function to get study statistics
create or replace function get_study_statistics(p_user_id uuid)
returns table(
  total_tasks_studied int,
  due_today int,
  overdue int,
  average_interval real,
  average_easiness real,
  retention_rate real
) as $$
begin
  return query
  select 
    count(*)::int as total_tasks_studied,
    count(case when tr.next_review::date = current_date then 1 end)::int as due_today,
    count(case when tr.next_review < now() then 1 end)::int as overdue,
    avg(tr.interval_days) as average_interval,
    avg(tr.easiness_factor) as average_easiness,
    case 
      when count(*) > 0 then 
        count(case when tr.quality_score >= 3 then 1 end)::real / count(*)::real * 100
      else 0
    end as retention_rate
  from task_repetitions tr
  where tr.user_id = p_user_id;
end;
$$ language plpgsql;