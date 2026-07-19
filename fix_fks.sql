-- Fix foreign keys to point to profiles instead of auth.users
-- This allows PostgREST to automatically join the profiles table when querying these tables

ALTER TABLE public.study_group_members
DROP CONSTRAINT IF EXISTS study_group_members_user_id_fkey,
ADD CONSTRAINT study_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.study_group_messages
DROP CONSTRAINT IF EXISTS study_group_messages_user_id_fkey,
ADD CONSTRAINT study_group_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.group_timeline
DROP CONSTRAINT IF EXISTS group_timeline_user_id_fkey,
ADD CONSTRAINT group_timeline_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
