-- Migration: Create api_usage_log table for tracking Gemini API token usage
-- This table logs every Gemini API call with token counts and estimated costs

CREATE TABLE IF NOT EXISTS public.api_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  model_name text NOT NULL DEFAULT 'gemini-3-flash-preview',
  estimated_cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_api_usage_log_created_at ON public.api_usage_log(created_at DESC);
CREATE INDEX idx_api_usage_log_user_id ON public.api_usage_log(user_id);

-- RLS Policies
ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;

-- Owner can SELECT all rows
CREATE POLICY "Owner can view all usage logs"
  ON public.api_usage_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'owner'
    )
  );

-- Regular users can SELECT their own rows
CREATE POLICY "Users can view own usage logs"
  ON public.api_usage_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can INSERT (server-side API routes handle the insert)
CREATE POLICY "Authenticated users can insert usage logs"
  ON public.api_usage_log
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
