-- Migration 005: Saved Repairs (My Repairs Templates)
-- Run this in the Supabase SQL Editor
-- Allows users to save common repair scenarios as templates for rapid story generation

-- 1. Create saved_repairs table
CREATE TABLE IF NOT EXISTS public.saved_repairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  story_type TEXT NOT NULL CHECK (story_type IN ('diagnostic', 'repair')),
  year TEXT,
  make TEXT,
  model TEXT,
  customer_concern TEXT,
  codes_present TEXT,
  codes_present_option TEXT DEFAULT 'include',
  diagnostics_performed TEXT,
  diagnostics_option TEXT DEFAULT 'include',
  root_cause TEXT,
  root_cause_option TEXT DEFAULT 'include',
  repair_performed TEXT,
  repair_option TEXT,
  repair_verification TEXT,
  verification_option TEXT,
  recommended_action TEXT,
  recommended_option TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_saved_repairs_user_id ON public.saved_repairs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_repairs_updated_at ON public.saved_repairs(updated_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.saved_repairs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies — users can only access their own templates
CREATE POLICY "Users can view own saved repairs"
  ON public.saved_repairs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved repairs"
  ON public.saved_repairs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved repairs"
  ON public.saved_repairs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved repairs"
  ON public.saved_repairs FOR DELETE
  USING (auth.uid() = user_id);
