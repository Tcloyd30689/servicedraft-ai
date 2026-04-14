-- Migration 010: Contacts (Saved Email Contacts)
-- Allows users to save frequently-used email contacts for quick selection in email exports

-- 1. Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index for fast lookups by user
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);

-- 3. Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies — users can only access their own contacts
CREATE POLICY "Users can view own contacts"
  ON public.contacts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own contacts"
  ON public.contacts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own contacts"
  ON public.contacts FOR DELETE
  USING (user_id = auth.uid());

-- 5. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
