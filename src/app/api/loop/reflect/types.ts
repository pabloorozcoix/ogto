export type TReflectRequestBody = {
  observation_id?: string;
  observation?: {
    headline: string;
    details: string;
    artifacts?: string[];
    quality?: string | null;
    counters?: Record<string, number> | null;
  };
  agent_state_id?: string;
  prior_summary?: string | null;
};

export type TReflectionRow = {
  critique: string;
  decision: string | null;
  goal_satisfied: boolean;
  memory_note: string | null;
  updated_summary: string | null;
  fallback?: boolean;
  unmet_criteria?: string[];
  missing_facts?: string[];
  low_confidence_claims?: { claim: string; reason: string }[];
  contradictions?: { topic: string; sources: string[] }[];
  [k: string]: unknown;
};

export type TLowClaim = { claim: string; reason?: string };

export type TContra = { topic: string; sources?: unknown };
