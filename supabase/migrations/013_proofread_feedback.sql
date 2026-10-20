-- 013_proofread_feedback: per-suggestion thumbs up/down on Review & Proofread results.
-- APPLIED TO PRODUCTION 2026-10-20 via Supabase MCP (apply_migration "proofread_feedback").
-- Additive only: new table, no changes to any existing table or policy.
-- RLS enabled with NO policies => only the service-role key can read/write
-- (same pattern as survey_questions: API route authenticates with the cookie
-- client and does data work with the service-role client, user_id from session).
create table if not exists public.proofread_feedback (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid references public.narrative_tracker(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  proofread_run_id uuid not null,
  suggestion_index integer not null default 0,
  suggestion_text text,
  issue_type text,
  rating text not null check (rating in ('up','down')),
  comment text,
  story_type text,
  narrative_style text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proofread_feedback_unique_vote unique (user_id, proofread_run_id, suggestion_index)
);
create index if not exists proofread_feedback_tracker_idx on public.proofread_feedback (tracker_id);
create index if not exists proofread_feedback_user_idx on public.proofread_feedback (user_id);
create index if not exists proofread_feedback_created_idx on public.proofread_feedback (created_at desc);
alter table public.proofread_feedback enable row level security;
