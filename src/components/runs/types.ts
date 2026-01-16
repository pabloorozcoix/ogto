import { PHASES } from "./constants";

export type TSearchResult = {
	title: string;
	url: string;
	snippet: string;
	source: string;
};

export type TSearchResultWithTextSummary = TSearchResult & {
	summary: string;
};


export type TArtifactClaim = {
	statement: string;
	heuristic_confidence?: number; 
	confidence?: number; 
	llm_confidence?: number; 
	rationale?: string; 
};

export type TArtifact = {
	title?: string;
	sourceUrl?: string;
	claims?: TArtifactClaim[];
	meta?: Record<string, unknown>;
};

export type TObservation = {
	headline: string;
	details: string;
	counters?: Record<string, number>;
	artifacts?: TArtifact[]; 
	quality?: string | null;
	extra?: Record<string, unknown>; 
};

export type TReflectState = {
	goal_satisfied: boolean;
	critique: string;
	updated_summary: string;
	unmet_criteria?: string[];
	missing_facts?: string[];
	low_confidence_claims?: { claim: string; reason: string }[];
	contradictions?: { topic: string; sources: string[] }[];
};
export type TAgentCtx = {
	id: string;
	model: string;
	agent_name: string;
	agent_role: string;
	created_at: string;
	goal_title: string;
	budget_max_cost: number;
	budget_max_steps: number;
	model_max_tokens: number;
	budget_max_tokens: number;
	model_temperature: number;
	goal_system_prompt: string;
	model_output_format: string;
	model_max_iterations: number;
	budget_max_execution_time: number;
};

export type TAgentRun = {
	id: string;
	agent_ctx_id: string;
	iterations_completed: number;
	steps_used: number;
	tokens_used: number;
	cost_used: number;
	elapsed_ms: number;
	summary: string;
	memory_refs: string[];
	updated_at: string;
	agent_ctx: TAgentCtx;
};


export type TAgentStateWithCtx = TAgentRun;


export type TUrlContent = { url: string; content: string };
export type TSummariesMap = { [url: string]: string };
export type TSummaryMetaMap = { [url: string]: { plan_step_id?: string; tool_result_id?: string } };
export type TPhase = typeof PHASES[keyof typeof PHASES];
