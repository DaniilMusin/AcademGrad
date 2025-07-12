-- Material view for weak topics analysis
CREATE MATERIALIZED VIEW weak_topics AS
SELECT 
  a.user_id,
  t.topic,
  1 - AVG(CASE WHEN a.is_correct THEN 1 ELSE 0 END) as error_rate,
  COUNT(*) as attempts_count,
  MAX(a.ts) as last_attempt
FROM attempts a
JOIN tasks t ON a.task_id = t.id
WHERE a.ts > NOW() - INTERVAL '30 days'
GROUP BY a.user_id, t.topic
HAVING COUNT(*) >= 3;
