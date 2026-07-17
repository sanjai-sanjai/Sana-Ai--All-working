-- Add study_status to study_group_members
ALTER TABLE public.study_group_members ADD COLUMN IF NOT EXISTS study_status TEXT DEFAULT 'offline';

-- Update create_study_group_transaction to allow study_status to be passed or default it
-- (No change needed to create_study_group_transaction signature as it uses JSONB members, 
-- but we might want to let the status be active/invited in the `status` column 
-- and study_status will just default to 'offline').

-- Ensure realtime is enabled on both tables for the new dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE study_group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE group_member_profiles;
