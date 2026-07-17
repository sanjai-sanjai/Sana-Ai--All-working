-- 1. Add invite_code to study_groups
ALTER TABLE public.study_groups ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- 2. Backfill existing groups with unique 6-char codes
UPDATE public.study_groups 
SET invite_code = upper(substr(md5(random()::text), 1, 6)) 
WHERE invite_code IS NULL;

-- 3. Make invite_code unique and not null
ALTER TABLE public.study_groups ADD CONSTRAINT unique_invite_code UNIQUE (invite_code);
ALTER TABLE public.study_groups ALTER COLUMN invite_code SET NOT NULL;

-- 4. Re-create create_study_group_transaction to generate code
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
    v_invite_code TEXT;
BEGIN
    -- Generate 6 char unique code
    v_invite_code := upper(substr(md5(random()::text), 1, 6));

    -- 1. Create the group
    INSERT INTO study_groups (name, subject, semester, description, avatar_url, invite_code)
    VALUES (p_name, p_subject, p_semester, p_description, p_avatar_url, v_invite_code)
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

-- 5. Create RPC for joining by code
CREATE OR REPLACE FUNCTION public.join_group_by_code(
    p_user_id UUID,
    p_invite_code TEXT
) RETURNS UUID AS $$
DECLARE
    v_group_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Find group
    SELECT id INTO v_group_id FROM public.study_groups WHERE invite_code = upper(p_invite_code);
    IF v_group_id IS NULL THEN
        RAISE EXCEPTION 'Invalid invite code';
    END IF;

    -- Check if already member
    SELECT EXISTS(SELECT 1 FROM public.study_group_members WHERE group_id = v_group_id AND user_id = p_user_id) INTO v_exists;
    IF v_exists THEN
        RAISE EXCEPTION 'Already a member';
    END IF;

    -- Insert member (UI handles pending state without a group_member_profiles record)
    INSERT INTO public.study_group_members (group_id, user_id, role, status)
    VALUES (v_group_id, p_user_id, 'member', 'active');
    
    RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
