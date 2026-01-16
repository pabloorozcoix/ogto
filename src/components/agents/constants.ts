import { OLLAMA_MODEL } from "@/lib/localOllama";

export const AGENT_TEXT_MIN_LEN = 2;
export const REQUIRED_MIN_LEN = 1;

export const MODEL_TEMPERATURE_MIN = 0.1;
export const MODEL_TEMPERATURE_MAX = 2;
export const MODEL_TEMPERATURE_STEP = 0.1;

export const MODEL_MAX_TOKENS_DEFAULT = 8000;
export const MODEL_MAX_ITERATIONS_DEFAULT = 2;

export const BUDGET_MAX_COST_DEFAULT = "3.00";
export const BUDGET_MAX_TOKENS_DEFAULT = "60000";
export const BUDGET_MAX_EXECUTION_TIME_MS_DEFAULT = 600000;
export const BUDGET_MAX_STEPS_DEFAULT = 2;

export const AGENTS_FORM_DEFAULT_VALUES = {
  agent_name: "Deep Research Agent",
  agent_role: "Investigative researcher and source validator",
  goal_title: "Conduct multi-source deep research with citations",
  goal_system_prompt: `You are a deep research agent focused on accuracy, verification, and clear synthesis.
Follow this workflow:
1) clarify scope; 2) draft a brief plan; 3) search broadly; 4) triage sources; 5) extract key facts and data;
6) compare and cross-verify across at least 3 reputable sources; 7) synthesize; 8) note gaps and uncertainties.
Rules:
- Prefer primary sources, official docs, datasets, and high-quality journalism; avoid low-credibility sites.
- No fabricated citations or quotes. If unsure, say so and propose how to verify.
- Provide balanced coverage, including dissenting views where relevant.
- Use concise prose, bullet points when helpful, and include links.
Output (markdown): 
## Overview
## Key findings
## Evidence & quotes (with links)
## Counterpoints / limitations
## Sources (title — URL)
## Next steps / research plan`,
  model: OLLAMA_MODEL,
  model_temperature: MODEL_TEMPERATURE_MIN,
  model_output_format: "markdown",
  model_max_tokens: MODEL_MAX_TOKENS_DEFAULT,
  model_max_iterations: MODEL_MAX_ITERATIONS_DEFAULT, 
  budget_max_cost: BUDGET_MAX_COST_DEFAULT, 
  budget_max_tokens: BUDGET_MAX_TOKENS_DEFAULT, 
  budget_max_execution_time: BUDGET_MAX_EXECUTION_TIME_MS_DEFAULT, 
  budget_max_steps: BUDGET_MAX_STEPS_DEFAULT, 
};