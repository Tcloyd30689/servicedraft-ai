-- ============================================
-- NARRATIVE UPSERT SUPPORT
-- Enables overwriting a saved narrative when the same user + RO# combo exists
-- ============================================

-- 1. Add updated_at column
ALTER TABLE public.narratives
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Backfill updated_at from created_at for existing rows
UPDATE public.narratives SET updated_at = created_at WHERE updated_at IS NULL;

-- 3. Clean up any existing duplicate (user_id, ro_number) pairs — keep the newest
DELETE FROM public.narratives a
USING public.narratives b
WHERE a.user_id = b.user_id
  AND a.ro_number = b.ro_number
  AND a.ro_number IS NOT NULL
  AND a.created_at < b.created_at;

-- 4. Add unique constraint for upsert conflict resolution
ALTER TABLE public.narratives
ADD CONSTRAINT narratives_user_ro_unique UNIQUE (user_id, ro_number);

-- 5. Add missing UPDATE policy (only SELECT, INSERT, DELETE exist)
CREATE POLICY "Users can update own narratives" ON public.narratives
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Add auto-update trigger for updated_at
CREATE TRIGGER on_narratives_updated
  BEFORE UPDATE ON public.narratives
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Add index on updated_at for dashboard ordering
CREATE INDEX IF NOT EXISTS narratives_updated_at_idx ON public.narratives(updated_at DESC);
