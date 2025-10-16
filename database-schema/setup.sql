-- =====================================================
-- Magix Database Setup
-- =====================================================
-- Copy and paste this entire file into your Supabase SQL Editor
-- Then click "Run" to create all tables and policies
-- =====================================================

-- 1. Create Scripts Table
-- Stores user-generated modifications
CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  domain_pattern TEXT NOT NULL,
  code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  install_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  source_script_id UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Chats Table
-- Stores chat conversations
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  script_id UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Chat Messages Table
-- Stores individual messages in chats
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai')),
  content TEXT NOT NULL,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- Create Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_scripts_user_domain ON public.scripts(user_id, domain_pattern);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_script_id ON public.chats(script_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Create RLS Policies for Scripts Table
-- =====================================================

-- Users can view their own scripts OR public scripts
CREATE POLICY "Users can view own scripts and public scripts"
  ON public.scripts
  FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

-- Users can insert their own scripts
CREATE POLICY "Users can insert own scripts"
  ON public.scripts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own scripts
CREATE POLICY "Users can update own scripts"
  ON public.scripts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own scripts
CREATE POLICY "Users can delete own scripts"
  ON public.scripts
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Create RLS Policies for Chats Table
-- =====================================================

-- Users can view their own chats
CREATE POLICY "Users can view own chats"
  ON public.chats
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own chats
CREATE POLICY "Users can insert own chats"
  ON public.chats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own chats
CREATE POLICY "Users can update own chats"
  ON public.chats
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own chats
CREATE POLICY "Users can delete own chats"
  ON public.chats
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Create RLS Policies for Chat Messages Table
-- =====================================================

-- Users can view their own messages
CREATE POLICY "Users can view own messages"
  ON public.chat_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert own messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON public.chat_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Create Function for Auto-updating Timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Create Triggers for Auto-updating Timestamps
-- =====================================================

CREATE TRIGGER on_scripts_updated
  BEFORE UPDATE ON public.scripts
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_chats_updated
  BEFORE UPDATE ON public.chats
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated;

-- =====================================================
-- Setup Complete!
-- =====================================================
-- All tables, indexes, policies, and functions created successfully
-- You can now use Magix with this Supabase project
-- =====================================================
