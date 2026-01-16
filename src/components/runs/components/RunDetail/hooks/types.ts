export type TBeginEnd = { beginRequest: () => void; endRequest: () => void };

export type TTrackedFetch = (
  input: RequestInfo,
  init?: RequestInit
) => Promise<Response>;

export type TPlan =
  | {
      query: string;
      systemPrompt: string;
      agentName: string;
    }
  | null;

export type TObservePayload = {
  summaries: Record<string, string>;
  fetchedContents: { url: string; content: string }[];
  plan: TPlan;
  agentState: unknown;
  summaryMeta: Record<string, { plan_step_id?: string; tool_result_id?: string }>;
  agent_state_id?: string;
};

export type TRunOutputArgs = {
  agent_goal_title: string;
  search_results_with_summaries: unknown;
  agent_state_id?: string;
  max_tokens?: number;
};
