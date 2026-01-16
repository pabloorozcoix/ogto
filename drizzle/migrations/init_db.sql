-- init_db.sql
--
-- Purpose:
-- - Bootstrap the OGTO schema in the `public` schema (idempotent).
-- - Reset the project data by truncating OGTO tables.
--
-- Why a single file?
-- - You asked to keep only one SQL file.
-- - This works for a brand-new database (creates tables) and for an existing
--   database (keeps schema, clears data).
--
-- WARNING: This is destructive (data loss). Ensure you have a backup.

BEGIN;

-- Extensions used by the schema.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- Diagnostic RPC used by /api/db/test-pgvector
CREATE OR REPLACE FUNCTION public.test_vector_extension() RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM '[1,2,3]'::vector(3);
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Core tables (idempotent)
CREATE TABLE IF NOT EXISTS public.agent_ctx (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  agent_role text NOT NULL,
  goal_title text NOT NULL,
  goal_system_prompt text NOT NULL,
  model text NOT NULL,
  model_temperature numeric NOT NULL,
  model_output_format text NOT NULL,
  model_max_tokens integer NOT NULL,
  model_max_iterations integer NOT NULL,
  budget_max_cost numeric,
  budget_max_tokens integer,
  budget_max_execution_time integer,
  budget_max_steps integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_ctx_id uuid REFERENCES public.agent_ctx(id),
  iterations_completed integer NOT NULL,
  steps_used integer NOT NULL,
  tokens_used integer NOT NULL,
  cost_used numeric NOT NULL,
  elapsed_ms integer NOT NULL,
  summary text,
  memory_refs text[],
  status text,
  coverage_score numeric,
  updated_at timestamptz DEFAULT now()
);

-- Keep the embedding column compatible with pgvector.
-- (The app currently does not require this to be populated, but DB tests do.)
CREATE TABLE IF NOT EXISTS public.memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_state_id uuid REFERENCES public.agent_state(id),
  text text NOT NULL,
  tags text[],
  source text,
  step_id uuid,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

-- If `memory.embedding` exists but is the wrong type (legacy `text`), upgrade it.
-- We drop/re-add because casting arbitrary text -> vector is not safe.
DO $$
DECLARE
  embedding_type text;
BEGIN
  SELECT c.data_type
    INTO embedding_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'memory'
    AND c.column_name = 'embedding'
  LIMIT 1;

  IF embedding_type IS NULL THEN
    -- Column missing entirely (older schema). Add it.
    ALTER TABLE public.memory ADD COLUMN embedding vector(1536);
  ELSIF embedding_type = 'text' THEN
    -- Legacy schema had embedding as text; reset to proper pgvector type.
    ALTER TABLE public.memory DROP COLUMN embedding;
    ALTER TABLE public.memory ADD COLUMN embedding vector(1536);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.plan_step (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_state_id uuid REFERENCES public.agent_state(id),
  rationale text NOT NULL,
  tool_name text NOT NULL,
  args jsonb NOT NULL,
  success_criteria text[],
  risks text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tool_result (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_step_id uuid REFERENCES public.plan_step(id),
  ok boolean NOT NULL,
  data jsonb,
  error text,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.observation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_result_id uuid REFERENCES public.tool_result(id),
  headline text NOT NULL,
  details text NOT NULL,
  artifacts text[],
  quality text,
  counters jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reflection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id uuid REFERENCES public.observation(id),
  critique text NOT NULL,
  decision text,
  goal_satisfied boolean NOT NULL,
  memory_note text,
  updated_summary text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.claim_confidence_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_state_id uuid REFERENCES public.agent_state(id),
  observation_id uuid,
  artifact_index integer NOT NULL,
  claim_index integer NOT NULL,
  statement text NOT NULL,
  heuristic_confidence numeric,
  llm_confidence numeric,
  blended_confidence numeric,
  rationale text,
  created_at timestamptz DEFAULT now()
);

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_memory_embedding ON public.memory USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_agent_state_agent_ctx ON public.agent_state(agent_ctx_id);
CREATE INDEX IF NOT EXISTS idx_plan_step_agent_state ON public.plan_step(agent_state_id);
CREATE INDEX IF NOT EXISTS idx_tool_result_plan_step ON public.tool_result(plan_step_id);
CREATE INDEX IF NOT EXISTS idx_observation_tool_result ON public.observation(tool_result_id);
CREATE INDEX IF NOT EXISTS idx_reflection_observation ON public.reflection(observation_id);
CREATE INDEX IF NOT EXISTS idx_agent_state_status ON public.agent_state(status);
CREATE INDEX IF NOT EXISTS idx_claim_confidence_agent_state ON public.claim_confidence_log(agent_state_id);
CREATE INDEX IF NOT EXISTS idx_claim_confidence_observation ON public.claim_confidence_log(observation_id);
CREATE INDEX IF NOT EXISTS idx_claim_confidence_agent_state_created_at ON public.claim_confidence_log(agent_state_id, created_at DESC);

-- Reset data (truncate only OGTO tables; keep functions/extensions intact)
DO $$
DECLARE
  stmt text;
BEGIN
  stmt := 'TRUNCATE TABLE '
    || 'public.claim_confidence_log, '
    || 'public.reflection, '
    || 'public.observation, '
    || 'public.tool_result, '
    || 'public.plan_step, '
    || 'public.memory, '
    || 'public.agent_state, '
    || 'public.agent_ctx '
    || 'RESTART IDENTITY CASCADE;';

  EXECUTE stmt;
END $$;

COMMIT;