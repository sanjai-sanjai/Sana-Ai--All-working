-- Add subject column and update study_group_members
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE study_group_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'group_invite', 'system', etc.
    payload JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);
    
DROP POLICY IF EXISTS "Users can insert notifications for others" ON notifications;
CREATE POLICY "Users can insert notifications for others" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function for atomic group creation
CREATE OR REPLACE FUNCTION create_study_group_transaction(
    p_name TEXT,
    p_subject TEXT,
    p_semester TEXT,
    p_description TEXT,
    p_avatar_url TEXT,
    p_members JSONB -- Array of { user_id, role, strengths, learning_preferences }
) RETURNS UUID AS $$
DECLARE
    v_group_id UUID;
    v_member JSONB;
BEGIN
    -- 1. Create the group
    INSERT INTO study_groups (name, subject, semester, description, avatar_url)
    VALUES (p_name, p_subject, p_semester, p_description, p_avatar_url)
    RETURNING id INTO v_group_id;

    -- 2. Insert members
    FOR v_member IN SELECT * FROM jsonb_array_elements(p_members)
    LOOP
        INSERT INTO study_group_members (
            group_id, 
            user_id, 
            role, 
            status,
            strengths, 
            learning_preferences
        ) VALUES (
            v_group_id, 
            (v_member->>'user_id')::UUID, 
            v_member->>'role', 
            v_member->>'status', -- 'active' for owner, 'invited' for others
            COALESCE(v_member->'strengths', '[]'::jsonb),
            COALESCE(v_member->'learning_preferences', '{}'::jsonb)
        );
        
        -- If member is invited (not owner), create a notification
        IF (v_member->>'status' = 'invited') THEN
            INSERT INTO notifications (user_id, type, payload)
            VALUES (
                (v_member->>'user_id')::UUID,
                'group_invite',
                jsonb_build_object(
                    'group_id', v_group_id,
                    'group_name', p_name,
                    'invited_by', auth.uid()
                )
            );
        END IF;
    END LOOP;

    -- 3. Create initial system message
    INSERT INTO study_group_messages (
        group_id,
        user_id,
        content,
        message_type,
        created_at
    ) VALUES (
        v_group_id,
        NULL, -- System message
        '👋 Welcome to ' || p_name || '! Start chatting, sharing resources, or @mention Sana_AI for help.',
        'text',
        NOW()
    );

    RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
