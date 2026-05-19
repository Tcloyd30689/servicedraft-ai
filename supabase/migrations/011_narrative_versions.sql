-- ============================================================
-- Migration 011: Narrative Version History
-- Sprint 13 — Auto-Save + Version History System (v1.1.3-beta)
-- ============================================================
-- Adds action_history JSONB column to public.narratives so each
-- saved narrative carries its own version timeline (mirroring
-- the narrative_tracker pattern but on the user-facing table).
-- ============================================================

-- 1) Add the column
ALTER TABLE public.narratives
  ADD COLUMN IF NOT EXISTS action_history JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2) Backfill existing rows with a single "generate" entry
UPDATE public.narratives
SET action_history = jsonb_build_array(
  jsonb_build_object(
    'action',         'generate',
    'version',        1,
    'at',             created_at,
    'narrative_text', full_narrative,
    'concern',        concern,
    'cause',          cause,
    'correction',     correction
  )
)
WHERE action_history = '[]'::jsonb;

-- 3) GIN index for querying inside action_history
CREATE INDEX IF NOT EXISTS idx_narratives_action_history_gin
  ON public.narratives USING GIN (action_history);

-- 4) RPC function: append a new history entry atomically
CREATE OR REPLACE FUNCTION public.append_narrative_history(
  p_narrative_id UUID,
  p_entry        JSONB
)
RETURNS VOID AS $$
  UPDATE public.narratives
  SET action_history = action_history || p_entry::jsonb,
      updated_at     = now()
  WHERE id = p_narrative_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 5) Allow authenticated users to call the function
GRANT EXECUTE ON FUNCTION public.append_narrative_history(UUID, JSONB)
  TO authenticated;

-- 6) Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
