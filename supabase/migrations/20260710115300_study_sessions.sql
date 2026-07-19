-- Add progress to study_group_topics
ALTER TABLE study_group_topics ADD COLUMN IF NOT EXISTS progress_pct INTEGER DEFAULT 0;

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES study_group_topics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active', -- 'active', 'completed'
    current_step TEXT DEFAULT 'overview',
    quiz_scores JSONB DEFAULT '[]'::jsonb,
    live_notes JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for study_sessions
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own study sessions" ON study_sessions;
CREATE POLICY "Users can view their own study sessions" ON study_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own study sessions" ON study_sessions;
CREATE POLICY "Users can update their own study sessions" ON study_sessions
    FOR UPDATE USING (auth.uid() = user_id);
    
DROP POLICY IF EXISTS "Users can insert their own study sessions" ON study_sessions;
CREATE POLICY "Users can insert their own study sessions" ON study_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
