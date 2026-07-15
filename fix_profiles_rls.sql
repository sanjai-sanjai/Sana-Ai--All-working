-- Enable read access to all profiles for authenticated users
-- This allows the search function in the invite members modal to work
CREATE POLICY "authenticated can read profiles" ON public.profiles
FOR SELECT USING (auth.role() = 'authenticated');
