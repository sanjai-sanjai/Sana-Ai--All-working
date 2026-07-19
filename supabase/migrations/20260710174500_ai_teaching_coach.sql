-- Create teaching_materials table
CREATE TABLE IF NOT EXISTS teaching_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES study_group_topics(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    structured_content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teaching_sessions table
CREATE TABLE IF NOT EXISTS teaching_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES study_group_topics(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    material_id UUID REFERENCES teaching_materials(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    duration_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Create teaching_feedback table
CREATE TABLE IF NOT EXISTS teaching_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES teaching_sessions(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating TEXT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for teaching_materials
ALTER TABLE teaching_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view teaching materials" ON teaching_materials;
CREATE POLICY "Members can view teaching materials" ON teaching_materials FOR SELECT USING (
    EXISTS (SELECT 1 FROM study_group_members m WHERE m.group_id = teaching_materials.group_id AND m.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Members can insert teaching materials" ON teaching_materials;
CREATE POLICY "Members can insert teaching materials" ON teaching_materials FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM study_group_members m WHERE m.group_id = teaching_materials.group_id AND m.user_id = auth.uid())
);

-- RLS for teaching_sessions
ALTER TABLE teaching_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view teaching sessions" ON teaching_sessions;
CREATE POLICY "Members can view teaching sessions" ON teaching_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM study_group_members m WHERE m.group_id = teaching_sessions.group_id AND m.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Members can insert teaching sessions" ON teaching_sessions;
CREATE POLICY "Members can insert teaching sessions" ON teaching_sessions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM study_group_members m WHERE m.group_id = teaching_sessions.group_id AND m.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Members can update teaching sessions" ON teaching_sessions;
CREATE POLICY "Members can update teaching sessions" ON teaching_sessions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM study_group_members m WHERE m.group_id = teaching_sessions.group_id AND m.user_id = auth.uid())
);

-- RLS for teaching_feedback
ALTER TABLE teaching_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view feedback" ON teaching_feedback;
CREATE POLICY "Members can view feedback" ON teaching_feedback FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM teaching_sessions ts
        JOIN study_group_members m ON ts.group_id = m.group_id
        WHERE ts.id = teaching_feedback.session_id AND m.user_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "Members can insert feedback" ON teaching_feedback;
CREATE POLICY "Members can insert feedback" ON teaching_feedback FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM teaching_sessions ts
        JOIN study_group_members m ON ts.group_id = m.group_id
        WHERE ts.id = teaching_feedback.session_id AND m.user_id = auth.uid()
    )
);

-- Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE teaching_materials;
ALTER PUBLICATION supabase_realtime ADD TABLE teaching_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE teaching_feedback;
