-- Create study_groups table
CREATE TABLE study_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    semester TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_group_members table
CREATE TABLE study_group_members (
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    progress_pct INTEGER DEFAULT 0,
    strengths JSONB DEFAULT '[]'::jsonb,
    learning_preferences JSONB DEFAULT '{}'::jsonb,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- Create study_group_messages table
CREATE TABLE study_group_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null for AI messages
    content TEXT,
    message_type TEXT DEFAULT 'text', -- 'text', 'file', 'ai_roadmap', etc
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_group_resources table
CREATE TABLE study_group_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    resource_type TEXT NOT NULL, -- 'pdf', 'doc', 'link', 'image', 'video'
    url TEXT NOT NULL,
    size_bytes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_group_meets table
CREATE TABLE study_group_meets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    started_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    meet_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Create study_group_topics table (for AI roadmap)
CREATE TABLE study_group_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    difficulty TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security (RLS)
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_meets ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_topics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Members can view their groups" ON study_groups;
DROP POLICY IF EXISTS "Members can view other members" ON study_group_members;
DROP POLICY IF EXISTS "Members can view messages" ON study_group_messages;
DROP POLICY IF EXISTS "Members can insert messages" ON study_group_messages;
DROP POLICY IF EXISTS "Members can view resources" ON study_group_resources;
DROP POLICY IF EXISTS "Members can insert resources" ON study_group_resources;
DROP POLICY IF EXISTS "Members can view meets" ON study_group_meets;
DROP POLICY IF EXISTS "Members can update meets" ON study_group_meets;
DROP POLICY IF EXISTS "Members can insert meets" ON study_group_meets;
DROP POLICY IF EXISTS "Members can view topics" ON study_group_topics;
DROP POLICY IF EXISTS "Members can update topics" ON study_group_topics;

-- Group RLS (Simplified: authenticated users can read all groups for now, or just groups they are in)
CREATE POLICY "Users can view all groups" ON study_groups
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert groups" ON study_groups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Members RLS
CREATE POLICY "Users can view all members" ON study_group_members
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert themselves as members" ON study_group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership" ON study_group_members
    FOR UPDATE USING (auth.uid() = user_id);

-- Messages RLS
CREATE POLICY "Members can view messages" ON study_group_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM study_group_members 
            WHERE study_group_members.group_id = study_group_messages.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can insert messages" ON study_group_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM study_group_members 
            WHERE study_group_members.group_id = study_group_messages.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

-- Resources RLS
CREATE POLICY "Members can view resources" ON study_group_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM study_group_members 
            WHERE study_group_members.group_id = study_group_resources.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can insert resources" ON study_group_resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM study_group_members 
            WHERE study_group_members.group_id = study_group_resources.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

-- Meets RLS
CREATE POLICY "Members can view meets" ON study_group_meets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM study_group_members 
            WHERE study_group_members.group_id = study_group_meets.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can insert meets" ON study_group_meets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM study_group_members 
            WHERE study_group_members.group_id = study_group_meets.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );
    
CREATE POLICY "Members can update meets" ON study_group_meets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM study_group_members 
            WHERE study_group_members.group_id = study_group_meets.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

-- Topics RLS
CREATE POLICY "Members can view topics" ON study_group_topics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM study_group_members 
            WHERE study_group_members.group_id = study_group_topics.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can update topics" ON study_group_topics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM study_group_members 
            WHERE study_group_members.group_id = study_group_topics.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );
    
CREATE POLICY "Members can insert topics" ON study_group_topics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM study_group_members 
            WHERE study_group_members.group_id = study_group_topics.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE study_group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE study_group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE study_group_meets;
ALTER PUBLICATION supabase_realtime ADD TABLE study_group_resources;
ALTER PUBLICATION supabase_realtime ADD TABLE study_group_topics;
