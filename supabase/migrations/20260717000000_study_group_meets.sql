DROP TABLE IF EXISTS public.study_group_meets CASCADE;

CREATE TABLE public.study_group_meets (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL,
    meet_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    active_members JSONB DEFAULT '[]'::jsonb,
    CONSTRAINT study_group_meets_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.study_group_meets ENABLE ROW LEVEL SECURITY;

-- Policy: Members can select meets for their groups
CREATE POLICY "Members can select meets for their groups" ON public.study_group_meets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.study_group_members 
            WHERE study_group_members.group_id = study_group_meets.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

-- Policy: Members can insert meets for their groups
CREATE POLICY "Members can insert meets for their groups" ON public.study_group_meets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.study_group_members 
            WHERE study_group_members.group_id = study_group_meets.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

-- Policy: Members can update meets for their groups
CREATE POLICY "Members can update meets for their groups" ON public.study_group_meets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.study_group_members 
            WHERE study_group_members.group_id = study_group_meets.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_group_meets;
ALTER TABLE public.study_group_meets REPLICA IDENTITY FULL;
