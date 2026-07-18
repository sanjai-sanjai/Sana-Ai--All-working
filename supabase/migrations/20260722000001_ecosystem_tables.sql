CREATE TABLE study_roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES study_assignments(id) ON DELETE CASCADE,
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE study_space_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES study_assignments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    message TEXT NOT NULL,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE group_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    topic TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE progress_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES study_assignments(id) ON DELETE CASCADE,
    progress_pct INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, assignment_id)
);

CREATE TABLE assignment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES study_assignments(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE study_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_space_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE study_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE study_roadmaps;
ALTER PUBLICATION supabase_realtime ADD TABLE study_space_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE group_resources;
ALTER PUBLICATION supabase_realtime ADD TABLE progress_tracking;

-- Basic Group-level RLS policies
CREATE POLICY "Group members can access roadmaps" ON study_roadmaps FOR ALL USING (
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_roadmaps.group_id AND user_id = auth.uid())
);

CREATE POLICY "Users can access their workspace messages" ON study_space_messages FOR ALL USING (
    user_id = auth.uid()
);

CREATE POLICY "Group members can access resources" ON group_resources FOR ALL USING (
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = group_resources.group_id AND user_id = auth.uid())
);

CREATE POLICY "Group members can access progress" ON progress_tracking FOR ALL USING (
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = progress_tracking.group_id AND user_id = auth.uid())
);

CREATE POLICY "Group members can access history" ON assignment_history FOR ALL USING (
    EXISTS (
        SELECT 1 FROM study_assignments 
        JOIN study_group_members ON study_assignments.group_id = study_group_members.group_id
        WHERE study_assignments.id = assignment_history.assignment_id 
        AND study_group_members.user_id = auth.uid()
    )
);
