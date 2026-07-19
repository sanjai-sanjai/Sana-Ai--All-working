-- CONSOLIDATED SUPABASE SCHEMA
-- Run this in the Supabase SQL Editor to initialize all tables, functions, triggers, and policies.

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Profiles & Onboarding Preferences
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  focus_score INT NOT NULL DEFAULT 0,
  phone_e164 TEXT,
  gender TEXT,
  location TEXT,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_.]{4,20}$');
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile all" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.onboarding_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_goal TEXT,
  ai_personality TEXT DEFAULT 'friendly_coach',
  completed_at TIMESTAMPTZ,
  study_view_enabled BOOLEAN NOT NULL DEFAULT false,
  study_style TEXT NOT NULL DEFAULT 'ruled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_preferences TO authenticated;
GRANT ALL ON public.onboarding_preferences TO service_role;
ALTER TABLE public.onboarding_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own onboarding all" ON public.onboarding_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Helper Functions & General Triggers
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_onboarding_upd BEFORE UPDATE ON public.onboarding_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Subjects & Revision Sets
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subjects TO authenticated, anon;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subjects readable" ON public.subjects FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.subjects (slug, name, icon, color) VALUES
  ('python', 'Python Programming', 'code', '#FFD43B'),
  ('dbms', 'DBMS Concepts', 'database', '#3B82F6'),
  ('os', 'Operating Systems', 'monitor', '#8B5CF6'),
  ('ds', 'Data Structures', 'git-branch', '#EC4899')
ON CONFLICT (slug) DO NOTHING;

-- Chat Threads
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_threads_user_idx ON public.chat_threads(user_id, last_message_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own threads all" ON public.chat_threads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Revision Sets
CREATE TABLE IF NOT EXISTS public.revision_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  progress_pct INT NOT NULL DEFAULT 0,
  last_revised_at TIMESTAMPTZ,
  thread_id UUID REFERENCES public.chat_threads(id) ON DELETE SET NULL,
  description TEXT,
  emoji TEXT DEFAULT '📘',
  generated_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS revision_sets_user_idx ON public.revision_sets(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS revision_sets_thread_id_uniq ON public.revision_sets(thread_id) WHERE thread_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.revision_sets TO authenticated;
GRANT ALL ON public.revision_sets TO service_role;
ALTER TABLE public.revision_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sets all" ON public.revision_sets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_sets_upd BEFORE UPDATE ON public.revision_sets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Notes
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id UUID REFERENCES public.revision_sets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_md TEXT DEFAULT '',
  position INT NOT NULL DEFAULT 0,
  progress_pct INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_user_set_idx ON public.notes(user_id, set_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own notes all" ON public.notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_notes_upd BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Flashcards
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id UUID REFERENCES public.revision_sets(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  mastery INT NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'new',
  bookmarked BOOLEAN NOT NULL DEFAULT false,
  topic TEXT,
  hint TEXT,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flashcards_user_set_idx ON public.flashcards(user_id, set_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards TO authenticated;
GRANT ALL ON public.flashcards TO service_role;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own flashcards all" ON public.flashcards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_flashcards_upd BEFORE UPDATE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_thread_idx ON public.chat_messages(thread_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own messages all" ON public.chat_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_time TEXT,
  is_done BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_user_idx ON public.tasks(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own tasks all" ON public.tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_tasks_upd BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Uploads
CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT,
  kind TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.uploads TO authenticated;
GRANT ALL ON public.uploads TO service_role;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own uploads all" ON public.uploads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'study',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  persona TEXT NOT NULL DEFAULT 'friendly_coach',
  repeat_mode TEXT NOT NULL DEFAULT 'once',
  alert_before_minutes INTEGER NOT NULL DEFAULT 10,
  quote TEXT,
  strict_mode BOOLEAN NOT NULL DEFAULT true,
  dont_miss BOOLEAN NOT NULL DEFAULT true,
  ai_call BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'scheduled',
  last_fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own reminders" ON public.reminders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER reminders_set_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS reminders_user_scheduled_idx ON public.reminders (user_id, scheduled_at);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  set_id UUID NOT NULL REFERENCES public.revision_sets(id) ON DELETE CASCADE,
  topic TEXT,
  difficulty TEXT DEFAULT 'medium',
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index INT NOT NULL DEFAULT 0,
  explanation TEXT,
  code_snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own quiz questions" ON public.quiz_questions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Weak Areas
CREATE TABLE IF NOT EXISTS public.weak_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  set_id UUID NOT NULL REFERENCES public.revision_sets(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  accuracy_pct INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weak_areas TO authenticated;
GRANT ALL ON public.weak_areas TO service_role;
ALTER TABLE public.weak_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own weak areas" ON public.weak_areas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER weak_areas_updated_at BEFORE UPDATE ON public.weak_areas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- YouTube Support
CREATE TABLE IF NOT EXISTS public.youtube_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id text NOT NULL,
  url text NOT NULL,
  title text,
  description text,
  thumbnail_url text,
  channel_title text,
  channel_id text,
  duration_seconds integer,
  published_at timestamptz,
  view_count bigint,
  language text,
  status text NOT NULL DEFAULT 'ready',
  error text,
  transcript_status text NOT NULL DEFAULT 'pending',
  transcript_source text,
  chunk_count integer NOT NULL DEFAULT 0,
  transcript_error text,
  last_opened_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.youtube_videos TO authenticated;
GRANT ALL ON public.youtube_videos TO service_role;
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own youtube videos" ON public.youtube_videos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER youtube_videos_set_updated_at BEFORE UPDATE ON public.youtube_videos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS youtube_videos_user_recent_idx ON public.youtube_videos (user_id, last_opened_at DESC);

CREATE TABLE IF NOT EXISTS public.youtube_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id text NOT NULL,
  video_row_id uuid NOT NULL REFERENCES public.youtube_videos(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  start_seconds integer NOT NULL DEFAULT 0,
  end_seconds integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (video_row_id, chunk_index)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.youtube_chunks TO authenticated;
GRANT ALL ON public.youtube_chunks TO service_role;
ALTER TABLE public.youtube_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own youtube chunks" ON public.youtube_chunks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS youtube_chunks_video_idx ON public.youtube_chunks (video_row_id, chunk_index);
CREATE INDEX IF NOT EXISTS youtube_chunks_embedding_idx ON public.youtube_chunks USING hnsw (embedding vector_cosine_ops);

-- Classroom Connections
CREATE TABLE IF NOT EXISTS public.classroom_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  google_sub TEXT,
  google_email TEXT,
  google_name TEXT,
  google_picture TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scope TEXT,
  status TEXT NOT NULL DEFAULT 'connected',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_connections TO authenticated;
GRANT ALL ON public.classroom_connections TO service_role;
ALTER TABLE public.classroom_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own classroom connection" ON public.classroom_connections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER classroom_connections_set_updated_at BEFORE UPDATE ON public.classroom_connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE SELECT (access_token, refresh_token, token_expires_at, scope) ON public.classroom_connections FROM authenticated;
REVOKE UPDATE (access_token, refresh_token, token_expires_at, scope) ON public.classroom_connections FROM authenticated;
REVOKE INSERT (access_token, refresh_token, token_expires_at, scope) ON public.classroom_connections FROM authenticated;

-- Classroom Courses
CREATE TABLE IF NOT EXISTS public.classroom_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  google_course_id TEXT NOT NULL,
  name TEXT NOT NULL,
  section TEXT,
  description TEXT,
  room TEXT,
  owner_id TEXT,
  course_state TEXT,
  alternate_link TEXT,
  enrollment_code TEXT,
  google_created_at TIMESTAMPTZ,
  google_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, google_course_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_courses TO authenticated;
GRANT ALL ON public.classroom_courses TO service_role;
ALTER TABLE public.classroom_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own classroom courses" ON public.classroom_courses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER classroom_courses_set_updated_at BEFORE UPDATE ON public.classroom_courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS classroom_courses_user_idx ON public.classroom_courses(user_id);

-- Classroom Coursework
CREATE TABLE IF NOT EXISTS public.classroom_coursework (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  google_course_id TEXT NOT NULL,
  google_coursework_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  work_type TEXT,
  state TEXT,
  alternate_link TEXT,
  max_points NUMERIC,
  due_at TIMESTAMPTZ,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  google_created_at TIMESTAMPTZ,
  google_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, google_coursework_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_coursework TO authenticated;
GRANT ALL ON public.classroom_coursework TO service_role;
ALTER TABLE public.classroom_coursework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own coursework" ON public.classroom_coursework FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER classroom_coursework_set_updated_at BEFORE UPDATE ON public.classroom_coursework FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS classroom_coursework_user_course_idx ON public.classroom_coursework(user_id, google_course_id);

-- Classroom Announcements
CREATE TABLE IF NOT EXISTS public.classroom_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  google_course_id TEXT NOT NULL,
  google_announcement_id TEXT NOT NULL,
  text TEXT,
  state TEXT,
  alternate_link TEXT,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  google_created_at TIMESTAMPTZ,
  google_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, google_announcement_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_announcements TO authenticated;
GRANT ALL ON public.classroom_announcements TO service_role;
ALTER TABLE public.classroom_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own announcements" ON public.classroom_announcements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER classroom_announcements_set_updated_at BEFORE UPDATE ON public.classroom_announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS classroom_announcements_user_course_idx ON public.classroom_announcements(user_id, google_course_id);

-- Classroom Materials
CREATE TABLE IF NOT EXISTS public.classroom_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  google_course_id TEXT NOT NULL,
  google_material_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  state TEXT,
  alternate_link TEXT,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  google_created_at TIMESTAMPTZ,
  google_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, google_material_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_materials TO authenticated;
GRANT ALL ON public.classroom_materials TO service_role;
ALTER TABLE public.classroom_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own materials" ON public.classroom_materials FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER classroom_materials_set_updated_at BEFORE UPDATE ON public.classroom_materials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS classroom_materials_user_course_idx ON public.classroom_materials(user_id, google_course_id);

-- Classroom Documents
CREATE TABLE IF NOT EXISTS public.classroom_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  google_course_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  mime_type TEXT,
  title TEXT NOT NULL,
  alternate_link TEXT,
  content_length INTEGER,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  indexed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, drive_file_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_documents TO authenticated;
GRANT ALL ON public.classroom_documents TO service_role;
ALTER TABLE public.classroom_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own classroom documents" ON public.classroom_documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER classroom_documents_set_updated_at BEFORE UPDATE ON public.classroom_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS classroom_documents_user_course_idx ON public.classroom_documents(user_id, google_course_id);

-- Classroom Chunks
CREATE TABLE IF NOT EXISTS public.classroom_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id UUID NOT NULL REFERENCES public.classroom_documents(id) ON DELETE CASCADE,
  google_course_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(3072),
  token_estimate INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_chunks TO authenticated;
GRANT ALL ON public.classroom_chunks TO service_role;
ALTER TABLE public.classroom_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own classroom chunks" ON public.classroom_chunks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS classroom_chunks_user_course_idx ON public.classroom_chunks(user_id, google_course_id);
CREATE INDEX IF NOT EXISTS classroom_chunks_doc_idx ON public.classroom_chunks(document_id);

-- Study Call Reminders & Call Sessions
CREATE TABLE IF NOT EXISTS public.study_call_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  phone_e164 text NOT NULL,
  study_topic text,
  motivation_style text NOT NULL DEFAULT 'friendly_coach',
  scheduled_at timestamptz NOT NULL,
  repeat_type text NOT NULL DEFAULT 'once' CHECK (repeat_type IN ('once','daily','weekly')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','calling','done','missed','cancelled','snoozed')),
  last_called_at timestamptz,
  next_call_at timestamptz,
  miss_count int NOT NULL DEFAULT 0,
  twilio_call_sid text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS study_call_reminders_user_idx ON public.study_call_reminders(user_id);
CREATE INDEX IF NOT EXISTS study_call_reminders_due_idx ON public.study_call_reminders(scheduled_at) WHERE status = 'scheduled';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_call_reminders TO authenticated;
GRANT ALL ON public.study_call_reminders TO service_role;
ALTER TABLE public.study_call_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own reminders" ON public.study_call_reminders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER study_call_reminders_set_updated_at BEFORE UPDATE ON public.study_call_reminders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid REFERENCES public.study_call_reminders(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  twilio_call_sid text UNIQUE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds int,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  mood text,
  topics text[] NOT NULL DEFAULT '{}',
  promises jsonb NOT NULL DEFAULT '[]'::jsonb,
  action_taken text,
  follow_up_at timestamptz,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','failed','no_answer','busy','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS call_sessions_user_idx ON public.call_sessions(user_id);
CREATE INDEX IF NOT EXISTS call_sessions_reminder_idx ON public.call_sessions(reminder_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_sessions TO authenticated;
GRANT ALL ON public.call_sessions TO service_role;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own call sessions" ON public.call_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER call_sessions_set_updated_at BEFORE UPDATE ON public.call_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Study Notes
CREATE TABLE IF NOT EXISTS public.study_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  thread_id uuid,
  message_id text NOT NULL,
  topic text,
  style text NOT NULL DEFAULT 'ruled',
  structured jsonb NOT NULL,
  markdown text,
  raw_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, message_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_notes TO authenticated;
GRANT ALL ON public.study_notes TO service_role;
ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own study notes" ON public.study_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS study_notes_user_thread_idx ON public.study_notes (user_id, thread_id);
CREATE TRIGGER study_notes_set_updated_at BEFORE UPDATE ON public.study_notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Auth & User Creation DB Triggers (Critical)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'username'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Revocations
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- 5. Storage Policies (User Uploads Bucket)
-- NOTE: Please ensure the 'user-uploads' bucket exists in your Supabase Storage.
DROP POLICY IF EXISTS "own storage read" ON storage.objects;
CREATE POLICY "own storage read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-uploads' AND owner = auth.uid());

DROP POLICY IF EXISTS "own storage write" ON storage.objects;
CREATE POLICY "own storage write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-uploads' AND owner = auth.uid());

DROP POLICY IF EXISTS "own storage delete" ON storage.objects;
CREATE POLICY "own storage delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-uploads' AND owner = auth.uid());

DROP POLICY IF EXISTS "user-uploads update own" ON storage.objects;
CREATE POLICY "user-uploads update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'user-uploads' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'user-uploads' AND owner = auth.uid());

-- 6. RPC Utility Functions
CREATE OR REPLACE FUNCTION public.check_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE username = p_username
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.match_youtube_chunks(
  query_embedding vector(1536),
  target_user_id uuid,
  target_video_ids text[],
  match_count integer DEFAULT 6,
  min_start_seconds integer DEFAULT NULL,
  max_end_seconds integer DEFAULT NULL
)
RETURNS TABLE (
  video_id text,
  chunk_index integer,
  start_seconds integer,
  end_seconds integer,
  content text,
  similarity float
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    c.video_id,
    c.chunk_index,
    c.start_seconds,
    c.end_seconds,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.youtube_chunks c
  WHERE c.user_id = target_user_id
    AND c.video_id = ANY(target_video_ids)
    AND c.embedding IS NOT NULL
    AND (min_start_seconds IS NULL OR c.end_seconds >= min_start_seconds)
    AND (max_end_seconds IS NULL OR c.start_seconds <= max_end_seconds)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_classroom_chunks(
  query_embedding vector,
  target_user_id UUID,
  target_course_ids TEXT[] DEFAULT NULL,
  match_count INTEGER DEFAULT 8
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  google_course_id TEXT,
  chunk_index INTEGER,
  content TEXT,
  similarity DOUBLE PRECISION,
  document_title TEXT,
  alternate_link TEXT
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    c.id AS chunk_id,
    c.document_id,
    c.google_course_id,
    c.chunk_index,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity,
    d.title AS document_title,
    d.alternate_link
  FROM public.classroom_chunks c
  JOIN public.classroom_documents d ON d.id = c.document_id
  WHERE c.user_id = target_user_id
    AND c.embedding IS NOT NULL
    AND (target_course_ids IS NULL OR c.google_course_id = ANY(target_course_ids))
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
