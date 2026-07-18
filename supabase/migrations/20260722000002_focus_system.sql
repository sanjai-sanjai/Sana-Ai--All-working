CREATE TABLE IF NOT EXISTS user_streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    highest_streak INTEGER DEFAULT 0,
    last_active_date DATE,
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS focus_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    score INTEGER NOT NULL DEFAULT 0,
    breakdown JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    focus_quality TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    completed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xp_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own streaks" ON user_streaks;
CREATE POLICY "Users can access their own streaks" ON user_streaks FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can access their own focus scores" ON focus_scores;
CREATE POLICY "Users can access their own focus scores" ON focus_scores FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can access their own study sessions" ON study_sessions;
CREATE POLICY "Users can access their own study sessions" ON study_sessions FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can access their own xp history" ON xp_history;
CREATE POLICY "Users can access their own xp history" ON xp_history FOR ALL USING (user_id = auth.uid());

-- Realtime publication (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_streaks') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_streaks;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'focus_scores') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE focus_scores;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'study_sessions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE study_sessions;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'xp_history') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE xp_history;
    END IF;
END $$;
