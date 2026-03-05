-- ============================================
-- DROP NARRATIVE UNIQUE CONSTRAINT
-- Sprint 9: Diagnostic → Repair Complete update system
--
-- Removes the UNIQUE(user_id, ro_number) constraint so that
-- diagnostic-only and repair-complete narratives with the same
-- RO# can coexist as separate rows. Each save is now an INSERT,
-- preserving the complete audit trail.
-- ============================================

-- Drop the unique constraint that was added in migration 003
ALTER TABLE public.narratives
DROP CONSTRAINT IF EXISTS narratives_user_ro_unique;
