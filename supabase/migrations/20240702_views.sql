create function match_task_chunks(query_embedding vector, match_count int, taskid bigint)
returns table(id bigint, chunk text, similarity float)
language sql stable as $$
  select id, chunk, embedding <#> query_embedding as similarity
  from task_chunks
  where task_id = taskid
  order by embedding <#> query_embedding
  limit match_count
$$;
