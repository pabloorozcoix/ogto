export type TObserveRequestBody = {
  summaries: Record<string, string>;
  fetchedContents: { url: string; content: string }[];
  plan?: { query?: string; [k: string]: unknown } | unknown;
  agentState?: unknown;
  summaryMeta?: Record<
    string,
    { plan_step_id?: string; tool_result_id?: string }
  >;
  agent_state_id?: string;
  
  searchResults?: Array<{
    url: string;
    title?: string;
    summary?: string;
  }>;
};

export type TArtifactClaim = {
  statement: string;
  
  confidence: number;
  
  heuristic_confidence?: number;
  
  llm_confidence?: number;
  
  rationale?: string;
};

export type TObservationArtifact = {
  title: string;
  summary: string;
  relevance_reason: string;
  claims?: TArtifactClaim[];
  source_url?: string;
};

export type TObservationJSON = {
  headline: string;
  details: string;
  artifacts?: (TObservationArtifact | string)[];
  quality?: string | null;
  counters?: Record<string, number> | null;
  [extra: string]: unknown;
};

export type TLlmClaimEval = {
  id: string;
  llm_confidence?: number;
  rationale?: string;
};

export type TLlmEvalResponse = {
  claims?: TLlmClaimEval[];
};

export type TClaimConfidenceRow = {
  agent_state_id: string;
  observation_id: string | null;
  artifact_index: number;
  claim_index: number;
  statement: string;
  heuristic_confidence: number | null;
  llm_confidence: number | null;
  blended_confidence: number | null;
  rationale: string | null;
};
