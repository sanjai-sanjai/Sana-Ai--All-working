ALTER TABLE public.study_group_members
DROP CONSTRAINT IF EXISTS study_group_members_user_id_fkey;

ALTER TABLE public.study_group_members
ADD CONSTRAINT study_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
