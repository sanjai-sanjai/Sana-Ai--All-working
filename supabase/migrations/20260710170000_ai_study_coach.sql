-- Add analytics JSONB and study_streak to study_groups
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS analytics JSONB DEFAULT '{}'::jsonb;
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS study_streak INTEGER DEFAULT 0;

-- Create group_timeline table
CREATE TABLE IF NOT EXISTS group_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for group_timeline
ALTER TABLE group_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view timeline" ON group_timeline;
CREATE POLICY "Members can view timeline" ON group_timeline FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM study_group_members m 
        WHERE m.group_id = group_timeline.group_id 
        AND m.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Members can insert timeline" ON group_timeline;
CREATE POLICY "Members can insert timeline" ON group_timeline FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM study_group_members m 
        WHERE m.group_id = group_timeline.group_id 
        AND m.user_id = auth.uid()
    )
);

-- Realtime for group_timeline and study_groups analytics
ALTER PUBLICATION supabase_realtime ADD TABLE group_timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE study_groups;
