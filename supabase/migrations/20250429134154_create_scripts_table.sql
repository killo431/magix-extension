-- 1. Create the Scripts table
CREATE TABLE public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  domain_pattern TEXT NOT NULL,
  code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Optional: Add index for faster lookups by user_id and domain_pattern
CREATE INDEX idx_scripts_user_domain ON public.scripts(user_id, domain_pattern);

-- 2. Enable Row Level Security (RLS) for the table
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- 3. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to automatically update updated_at
CREATE TRIGGER on_scripts_updated
  BEFORE UPDATE ON public.scripts
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Grant usage on the new function to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated;

-- RLS Policies for scripts table

-- Policy: Allow users to view their own scripts
CREATE POLICY "Allow individual user read access"
  ON public.scripts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Allow users to insert their own scripts
CREATE POLICY "Allow individual user insert access"
  ON public.scripts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to update their own scripts
CREATE POLICY "Allow individual user update access"
  ON public.scripts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to delete their own scripts
CREATE POLICY "Allow individual user delete access"
  ON public.scripts
  FOR DELETE
  USING (auth.uid() = user_id);
