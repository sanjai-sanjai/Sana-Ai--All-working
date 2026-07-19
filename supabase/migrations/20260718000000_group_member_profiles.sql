-- Create group_member_profiles table
CREATE TABLE IF NOT EXISTS public.group_member_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    strongest_skills TEXT[] DEFAULT '{}',
    weak_skills TEXT[] DEFAULT '{}',
    learning_style TEXT[] DEFAULT '{}',
    confidence_levels JSONB DEFAULT '{}'::jsonb,
    teaching_preference TEXT,
    availability TEXT[] DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_member_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view profiles of members in their groups
CREATE POLICY "Users can view group member profiles" ON public.group_member_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.study_group_members 
            WHERE study_group_members.group_id = group_member_profiles.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

-- Policy: Users can insert/update their own profile
CREATE POLICY "Users can insert own group profile" ON public.group_member_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own group profile" ON public.group_member_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE group_member_profiles;

-- Remove old columns from study_group_members
ALTER TABLE public.study_group_members DROP COLUMN IF EXISTS strengths;
ALTER TABLE public.study_group_members DROP COLUMN IF EXISTS learning_preferences;

-- Re-create create_study_group_transaction RPC without old profile fields
CREATE OR REPLACE FUNCTION public.create_study_group_transaction(
    p_name TEXT,
    p_subject TEXT,
    p_semester TEXT,
    p_description TEXT,
    p_avatar_url TEXT,
    p_members JSONB -- Array of { user_id, role, status }
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
            status
        ) VALUES (
            v_group_id, 
            (v_member->>'user_id')::UUID, 
            v_member->>'role', 
            v_member->>'status' -- 'active' for owner, 'invited' for others
        );
        
        -- Create a blank profile entry for all members (pending state)
        INSERT INTO group_member_profiles (
            group_id,
            user_id
        ) VALUES (
            v_group_id,
            (v_member->>'user_id')::UUID
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
