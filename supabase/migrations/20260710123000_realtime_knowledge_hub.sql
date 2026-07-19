-- Extend study_group_resources
ALTER TABLE study_group_resources ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE study_group_resources ADD COLUMN IF NOT EXISTS preview JSONB DEFAULT '{}'::jsonb;
ALTER TABLE study_group_resources ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE study_group_resources ADD COLUMN IF NOT EXISTS bookmarks INTEGER DEFAULT 0;
ALTER TABLE study_group_resources ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Create resource_comments table
CREATE TABLE IF NOT EXISTS resource_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES study_group_resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for resource_comments
ALTER TABLE resource_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view comments on resources they can access" ON resource_comments;
CREATE POLICY "Users can view comments on resources they can access" ON resource_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM study_group_resources r
            JOIN study_group_members m ON r.group_id = m.group_id
            WHERE r.id = resource_comments.resource_id
            AND m.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert comments on resources they can access" ON resource_comments;
CREATE POLICY "Users can insert comments on resources they can access" ON resource_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM study_group_resources r
            JOIN study_group_members m ON r.group_id = m.group_id
            WHERE r.id = resource_comments.resource_id
            AND m.user_id = auth.uid()
        )
    );

-- Enable realtime for new tables and resources
ALTER PUBLICATION supabase_realtime ADD TABLE study_group_resources;
ALTER PUBLICATION supabase_realtime ADD TABLE resource_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE study_group_topics;
