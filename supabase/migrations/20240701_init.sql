create extension if not exists "pgvector";

create table public.tasks (
  id            bigserial primary key,
  exam          text    not null check (exam in ('ege','oge')),
  topic         text    not null,
  subtopic      text,
  difficulty    int     not null check (difficulty between 1 and 5),
  statement_md  text    not null,
  answer        text    not null,
  solution_md   text    not null,
  created_at    timestamptz default now()
);

create table public.task_chunks (
  id         bigserial primary key,
  task_id    bigint  references tasks(id) on delete cascade,
  chunk      text,
  embedding  vector(1536)
);

create table public.attempts (
  id               bigserial primary key,
  user_id          uuid references auth.users on delete cascade,
  task_id          bigint references tasks(id) on delete cascade,
  ts               timestamptz default now(),
  answer_submitted text,
  is_correct       boolean,
  time_spent_s     int
);

-- weak topics materialized view
create materialized view public.weak_topics as
select user_id, topic,
       1 - avg(is_correct::int) as error_rate,
       count(*) as attempts
from attempts
group by user_id, topic;

create function match_task_chunks(query_embedding vector, match_count int, taskid bigint)
returns table(id bigint, chunk text, similarity float)
language sql stable as $$
  select id, chunk, embedding <#> query_embedding as similarity
  from task_chunks
  where task_id = taskid
  order by embedding <#> query_embedding
  limit match_count
$$;
