CREATE TABLE study_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    subtopic TEXT,
    estimated_duration TEXT,
    reason TEXT,
    assigned_by_ai BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'pending',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE study_assignments ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (e.g. users in the group can read/insert/update)
CREATE POLICY "Group members can view assignments" 
    ON study_assignments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM study_group_members 
            WHERE study_group_members.group_id = study_assignments.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Group members can insert assignments" 
    ON study_assignments FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM study_group_members 
            WHERE study_group_members.group_id = study_assignments.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Group members can update assignments" 
    ON study_assignments FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM study_group_members 
            WHERE study_group_members.group_id = study_assignments.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );
