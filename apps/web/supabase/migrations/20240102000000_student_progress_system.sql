-- Система отслеживания прогресса ученика и персонализированных рекомендаций

-- Расширенная таблица профилей пользователей
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Личная информация
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    birth_date DATE,
    
    -- Образовательная информация
    current_grade INTEGER CHECK (current_grade BETWEEN 1 AND 11),
    target_exam VARCHAR(20) DEFAULT 'егэ', -- 'егэ', 'огэ', 'олимпиада'
    target_year INTEGER,
    target_score INTEGER,
    
    -- Предметы и приоритеты
    primary_subjects JSONB DEFAULT '[]'::jsonb, -- ['математика', 'физика']
    weak_topics JSONB DEFAULT '[]'::jsonb,      -- автоматически определяемые слабые темы
    strong_topics JSONB DEFAULT '[]'::jsonb,    -- сильные темы
    
    -- Статистика обучения
    total_tasks_solved INTEGER DEFAULT 0,
    correct_tasks_count INTEGER DEFAULT 0,
    study_streak_days INTEGER DEFAULT 0,
    total_study_time_minutes INTEGER DEFAULT 0,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    
    -- Уровень и опыт (геймификация)
    current_level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    achievement_badges JSONB DEFAULT '[]'::jsonb,
    
    -- Настройки обучения
    preferred_difficulty INTEGER DEFAULT 3 CHECK (preferred_difficulty BETWEEN 1 AND 5),
    daily_goal_tasks INTEGER DEFAULT 10,
    daily_goal_time_minutes INTEGER DEFAULT 60,
    learning_style VARCHAR(20) DEFAULT 'mixed', -- 'visual', 'practical', 'theoretical', 'mixed'
    
    -- Метаданные
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Подробная таблица попыток решения задач
CREATE TABLE IF NOT EXISTS task_attempts (
    attempt_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Детали задачи
    task_number INTEGER NOT NULL,
    topic_name VARCHAR(200),
    subtopic_name VARCHAR(200),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    
    -- Результат попытки
    user_answer TEXT,
    correct_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    
    -- Процесс решения
    time_spent_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,
    solution_viewed BOOLEAN DEFAULT FALSE,
    attempts_count INTEGER DEFAULT 1, -- количество попыток на одной задаче
    
    -- Дополнительная информация
    mistake_type VARCHAR(50), -- 'calculation', 'concept', 'attention', 'method'
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5), -- уверенность ученика
    
    -- Контекст
    session_id UUID, -- ID сессии решения
    device_type VARCHAR(20) DEFAULT 'web', -- 'web', 'mobile', 'tablet'
    
    -- Метаданные
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица учебных сессий
CREATE TABLE IF NOT EXISTS study_sessions (
    session_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Параметры сессии
    session_type VARCHAR(30) DEFAULT 'practice', -- 'practice', 'test', 'review', 'targeted'
    planned_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    
    -- Результаты сессии
    tasks_planned INTEGER,
    tasks_completed INTEGER,
    tasks_correct INTEGER,
    average_time_per_task FLOAT,
    
    -- Фокус сессии
    target_topics JSONB DEFAULT '[]'::jsonb,
    difficulty_range JSONB DEFAULT '{"min": 1, "max": 5}'::jsonb,
    
    -- Статус
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
    completion_percentage FLOAT DEFAULT 0,
    
    -- Метаданные
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица учебных материалов (статьи, видео, etc.)
CREATE TABLE IF NOT EXISTS learning_materials (
    material_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Основная информация
    title VARCHAR(300) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) NOT NULL, -- 'article', 'video', 'interactive', 'pdf'
    content_url TEXT,
    thumbnail_url TEXT,
    
    -- Классификация
    subject VARCHAR(100) NOT NULL,
    topics JSONB DEFAULT '[]'::jsonb, -- ['производные', 'интегралы']
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    target_exam VARCHAR(20) DEFAULT 'егэ',
    
    -- Метаданные контента
    duration_minutes INTEGER, -- для видео
    word_count INTEGER, -- для текстов
    language VARCHAR(10) DEFAULT 'ru',
    
    -- Качество и рейтинг
    average_rating FLOAT DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Теги для поиска
    tags JSONB DEFAULT '[]'::jsonb,
    search_keywords TEXT, -- для полнотекстового поиска
    
    -- Статус
    is_published BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    
    -- Автор
    author_name VARCHAR(200),
    author_id UUID REFERENCES auth.users(id),
    
    -- Метаданные
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица взаимодействий с учебными материалами
CREATE TABLE IF NOT EXISTS material_interactions (
    interaction_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES learning_materials(material_id) ON DELETE CASCADE,
    
    -- Тип взаимодействия
    interaction_type VARCHAR(20) NOT NULL, -- 'view', 'like', 'bookmark', 'complete', 'rate'
    
    -- Детали взаимодействия
    progress_percentage FLOAT DEFAULT 0, -- для отслеживания прогресса
    time_spent_seconds INTEGER,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    
    -- Контекст
    came_from VARCHAR(50), -- 'recommendation', 'search', 'direct', 'related'
    device_type VARCHAR(20) DEFAULT 'web',
    
    -- Метаданные
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица персонализированных рекомендаций
CREATE TABLE IF NOT EXISTS user_recommendations (
    recommendation_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Тип рекомендации
    recommendation_type VARCHAR(30) NOT NULL, -- 'task_practice', 'learning_material', 'topic_focus', 'difficulty_adjustment'
    
    -- Содержание рекомендации
    title VARCHAR(300) NOT NULL,
    description TEXT,
    action_text VARCHAR(100), -- текст кнопки действия
    
    -- Связанные объекты
    related_task_ids JSONB DEFAULT '[]'::jsonb,
    related_material_ids JSONB DEFAULT '[]'::jsonb,
    related_topics JSONB DEFAULT '[]'::jsonb,
    
    -- Параметры рекомендации
    priority_score FLOAT DEFAULT 0, -- чем выше, тем важнее
    confidence_score FLOAT DEFAULT 0, -- уверенность ИИ в рекомендации
    
    -- Обоснование
    reasoning TEXT, -- объяснение почему эта рекомендация
    based_on_data JSONB, -- данные, на основе которых сделана рекомендация
    
    -- Статус
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'accepted', 'dismissed', 'expired'
    viewed_at TIMESTAMP WITH TIME ZONE,
    acted_upon_at TIMESTAMP WITH TIME ZONE,
    
    -- AI метаданные
    generated_by_model VARCHAR(50) DEFAULT 'gpt-4o-mini',
    generation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Жизненный цикл
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица анализа ошибок и паттернов
CREATE TABLE IF NOT EXISTS error_patterns (
    pattern_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Классификация ошибки
    error_category VARCHAR(50) NOT NULL, -- 'calculation', 'conceptual', 'method', 'attention'
    error_subcategory VARCHAR(100),
    
    -- Контекст ошибки
    topic_name VARCHAR(200),
    difficulty_level INTEGER,
    mistake_frequency INTEGER DEFAULT 1,
    
    -- Паттерн
    pattern_description TEXT,
    example_tasks JSONB DEFAULT '[]'::jsonb, -- примеры задач с такой ошибкой
    
    -- Рекомендации по исправлению
    suggested_materials JSONB DEFAULT '[]'::jsonb,
    suggested_practice_topics JSONB DEFAULT '[]'::jsonb,
    
    -- Прогресс исправления
    improvement_score FLOAT DEFAULT 0, -- от 0 до 1
    last_occurrence_date TIMESTAMP WITH TIME ZONE,
    
    -- Метаданные
    first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица достижений (геймификация)
CREATE TABLE IF NOT EXISTS user_achievements (
    achievement_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Тип достижения
    achievement_type VARCHAR(50) NOT NULL, -- 'streak', 'accuracy', 'topic_mastery', 'speed', 'consistency'
    achievement_name VARCHAR(200) NOT NULL,
    achievement_description TEXT,
    
    -- Критерии
    requirement_type VARCHAR(30), -- 'tasks_solved', 'accuracy_rate', 'streak_days', 'topic_completion'
    requirement_value INTEGER,
    current_progress INTEGER DEFAULT 0,
    
    -- Награда
    experience_reward INTEGER DEFAULT 0,
    badge_icon_url TEXT,
    badge_color VARCHAR(20),
    
    -- Статус
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    
    -- Метаданные
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_task_attempts_user_created ON task_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_attempts_topic ON task_attempts(topic_name, subtopic_name);
CREATE INDEX IF NOT EXISTS idx_task_attempts_difficulty ON task_attempts(difficulty_level, is_correct);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_material_interactions_user ON material_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_status ON user_recommendations(user_id, status, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_error_patterns_user ON error_patterns(user_id, mistake_frequency DESC);
CREATE INDEX IF NOT EXISTS idx_learning_materials_subject_difficulty ON learning_materials(subject, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_learning_materials_search ON learning_materials USING gin(to_tsvector('russian', search_keywords));

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Политики доступа - пользователи видят только свои данные
CREATE POLICY "Users can manage their own profile" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own attempts" ON task_attempts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sessions" ON study_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Everyone can read published materials" ON learning_materials
    FOR SELECT USING (is_published = true);

CREATE POLICY "Users can manage their own interactions" ON material_interactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can see their own recommendations" ON user_recommendations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can see their own error patterns" ON error_patterns
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can see their own achievements" ON user_achievements
    FOR ALL USING (auth.uid() = user_id);

-- Функции для автоматического обновления статистики
CREATE OR REPLACE FUNCTION update_user_stats_on_attempt()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем статистику в профиле пользователя
    UPDATE user_profiles 
    SET 
        total_tasks_solved = total_tasks_solved + 1,
        correct_tasks_count = CASE WHEN NEW.is_correct THEN correct_tasks_count + 1 ELSE correct_tasks_count END,
        last_activity_date = CURRENT_DATE,
        experience_points = experience_points + CASE WHEN NEW.is_correct THEN 10 ELSE 3 END,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Обновляем streak если решал вчера или сегодня
    UPDATE user_profiles 
    SET study_streak_days = CASE 
        WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN study_streak_days + 1
        WHEN last_activity_date = CURRENT_DATE THEN study_streak_days
        ELSE 1
    END
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats 
    AFTER INSERT ON task_attempts
    FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_attempt();

-- Функция для анализа слабых тем
CREATE OR REPLACE FUNCTION analyze_weak_topics(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    weak_topics_result JSONB;
BEGIN
    SELECT jsonb_agg(topic_analysis)
    INTO weak_topics_result
    FROM (
        SELECT jsonb_build_object(
            'topic', topic_name,
            'accuracy', ROUND((SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::FLOAT / COUNT(*))::NUMERIC, 2),
            'total_attempts', COUNT(*),
            'recent_attempts', COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')
        ) as topic_analysis
        FROM task_attempts 
        WHERE user_id = p_user_id 
        AND topic_name IS NOT NULL
        AND created_at > NOW() - INTERVAL '90 days' -- последние 3 месяца
        GROUP BY topic_name
        HAVING COUNT(*) >= 3 -- минимум 3 попытки
        AND (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::FLOAT / COUNT(*)) < 0.7 -- точность меньше 70%
        ORDER BY (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::FLOAT / COUNT(*)) ASC
        LIMIT 5
    ) t;
    
    RETURN COALESCE(weak_topics_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Функция для получения статистики пользователя
CREATE OR REPLACE FUNCTION get_user_learning_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    stats_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_tasks', COALESCE(SUM(CASE WHEN ta.created_at IS NOT NULL THEN 1 ELSE 0 END), 0),
        'correct_tasks', COALESCE(SUM(CASE WHEN ta.is_correct THEN 1 ELSE 0 END), 0),
        'accuracy_rate', COALESCE(ROUND((SUM(CASE WHEN ta.is_correct THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0))::NUMERIC, 3), 0),
        'average_time_per_task', COALESCE(ROUND(AVG(ta.time_spent_seconds)), 0),
        'study_days', COALESCE(COUNT(DISTINCT DATE(ta.created_at)), 0),
        'current_streak', COALESCE(up.study_streak_days, 0),
        'total_study_time', COALESCE(SUM(ta.time_spent_seconds), 0),
        'favorite_topics', (
            SELECT jsonb_agg(jsonb_build_object('topic', topic_name, 'count', topic_count))
            FROM (
                SELECT topic_name, COUNT(*) as topic_count
                FROM task_attempts 
                WHERE user_id = p_user_id AND topic_name IS NOT NULL
                GROUP BY topic_name
                ORDER BY COUNT(*) DESC
                LIMIT 3
            ) ft
        ),
        'weekly_progress', (
            SELECT jsonb_agg(jsonb_build_object('date', solve_date, 'tasks', tasks_count, 'correct', correct_count))
            FROM (
                SELECT 
                    DATE(created_at) as solve_date,
                    COUNT(*) as tasks_count,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count
                FROM task_attempts 
                WHERE user_id = p_user_id 
                AND created_at > NOW() - INTERVAL '7 days'
                GROUP BY DATE(created_at)
                ORDER BY solve_date
            ) wp
        ),
        'difficulty_distribution', (
            SELECT jsonb_object_agg(difficulty_level::text, count)
            FROM (
                SELECT difficulty_level, COUNT(*) as count
                FROM task_attempts 
                WHERE user_id = p_user_id
                GROUP BY difficulty_level
            ) dd
        ),
        'weak_topics', analyze_weak_topics(p_user_id),
        'level_info', jsonb_build_object(
            'current_level', COALESCE(up.current_level, 1),
            'experience_points', COALESCE(up.experience_points, 0),
            'next_level_threshold', (COALESCE(up.current_level, 1) * 1000)
        )
    )
    INTO stats_result
    FROM user_profiles up
    LEFT JOIN task_attempts ta ON up.user_id = ta.user_id
    WHERE up.user_id = p_user_id
    GROUP BY up.user_id, up.study_streak_days, up.current_level, up.experience_points;
    
    RETURN COALESCE(stats_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;