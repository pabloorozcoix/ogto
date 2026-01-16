export type TUIClaim = {
  statement: string;
  confidence: number;
  heuristic_confidence?: number;
  llm_confidence?: number;
  rationale?: string;
};

export type TUIArtifact = {
  title: string;
  source_url?: string;
  summary?: string;
  relevance_reason?: string;
  claims?: TUIClaim[];
};
