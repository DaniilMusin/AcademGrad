-- Row Level Security
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Public read access for tasks and badges
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_chunks ENABLE ROW LEVEL SECURITY;

-- Tasks - public read access
CREATE POLICY "tasks_public_read" ON tasks FOR SELECT USING (true);

-- Task chunks - public read access
CREATE POLICY "task_chunks_public_read" ON task_chunks FOR SELECT USING (true);

-- Badges - public read access
CREATE POLICY "badges_public_read" ON badges FOR SELECT USING (true);

-- Attempts - user can only access their own
CREATE POLICY "attempts_read_own" ON attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "attempts_insert_own" ON attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Events - user can only access their own
CREATE POLICY "events_read_own" ON events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "events_insert_own" ON events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Lesson reports - user can only access their own
CREATE POLICY "lesson_reports_read_own" ON lesson_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lesson_reports_insert_own" ON lesson_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Recommendations - user can only access their own
CREATE POLICY "recommendations_read_own" ON recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recommendations_insert_own" ON recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User badges - user can only access their own
CREATE POLICY "user_badges_read_own" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_badges_insert_own" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
