-- ============================================================================
-- MIGRATION: 008_rename_groups_to_teams.sql
-- PURPOSE: Rename "groups" table to "teams" and "group_id" column to "team_id"
-- DATE: 2026-03-10
-- ============================================================================
-- MANUAL EXECUTION REQUIRED:
-- This migration must be run manually in the Supabase SQL Editor.
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste this entire file and click "Run"
-- 4. Verify the teams table exists in Table Editor
-- 5. Verify the team_id column exists on the users table
-- ============================================================================

-- Step 1: Drop existing RLS policies on groups table
DROP POLICY IF EXISTS "Owner full access to groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can view own group" ON public.groups;
DROP POLICY IF EXISTS "Users can view own group" ON public.groups;

-- Step 2: Drop existing indexes
DROP INDEX IF EXISTS idx_groups_access_code;
DROP INDEX IF EXISTS idx_users_group_id;

-- Step 3: Rename the table
ALTER TABLE public.groups RENAME TO teams;

-- Step 4: Rename the column on users table
ALTER TABLE public.users RENAME COLUMN group_id TO team_id;

-- Step 5: Recreate indexes with new names
CREATE INDEX IF NOT EXISTS idx_teams_access_code ON public.teams(access_code);
CREATE INDEX IF NOT EXISTS idx_users_team_id ON public.users(team_id);

-- Step 6: Recreate RLS policies with new names
CREATE POLICY "Owner full access to teams" ON public.teams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Admins can view own team" ON public.teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view own team" ON public.teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM public.users WHERE id = auth.uid())
  );

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
