export const RUNS_HELP_DOCUMENTATION = `# OGTO Run Execution Guide

> Complete reference for understanding how runs execute, what triggers cycle loops, and how to interpret run data.

---

## Overview

A **Run** is a single execution instance of an agent working toward its research goal. When you create an agent and click "Create Agent Run," OGTO generates a new run entry and redirects you to monitor its execution in real-time.

### Run Lifecycle

\`\`\`
Agent Created → Run Initialized → LOOP Cycles Execute → Goal Satisfied → Output Generated
\`\`\`

| State | Description |
|-------|-------------|
| **Initialized** | Run created, awaiting first LOOP cycle |
| **Running** | Actively executing a LOOP iteration |
| **Reflecting** | Evaluating if goal is satisfied |
| **Completed** | Goal satisfied, final output generated |
| **Stopped** | Limits reached or manually terminated |

---

## Run Tabs

### 🧑‍💼 Agent Tab

Displays the agent's identity and current run status:

| Field | Description |
|-------|-------------|
| **Goal Title** | The research objective (header) |
| **System Prompt** | The detailed instructions guiding the agent |
| **Run ID** | Unique UUID identifier for this run |
| **Iterations** | Number of completed LOOP cycles |
| **Steps** | Total tool calls made (search, fetch, summarize) |
| **Tokens** | Cumulative LLM tokens consumed |
| **Cost** | API costs incurred (Google Search, etc.) |
| **Summary** | Agent's running summary of findings |
| **Latest Output** | The final markdown report (when goal satisfied) |

### ⚙️ Config Tab

Shows the JSON configuration object for this run, including:

- \`agent_information\` — Name and role
- \`goal_definition\` — Title and system prompt
- \`model_configuration\` — Model, temperature, tokens, iterations
- \`budget_constraints\` — Cost, token, time, and step limits

### 🏃 Run Tab

The execution control center where you:

1. Click **"Run LOOP"** to start/continue execution
2. Watch iterations execute in real-time
3. See search results, fetched content, and summaries
4. Monitor observation and reflection phases
5. View the final output when goal is satisfied

---

## The LOOP Strategy

OGTO executes research using the **LOOP** strategy (Learn-Observe-Optimize-Perform):

### Cycle Phases

Each iteration follows this sequence:

\`\`\`
┌──────────────────────────────────────────────────────────────────┐
│  LOOP ITERATION                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐                                                 │
│  │   SEARCH    │  Google Custom Search API                       │
│  │             │  • Query: goal_title (paginated)                │
│  │             │  • Returns: MAX_WEB_SEARCH_RESULTS URLs         │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                 │
│  │   FETCH     │  Retrieve page content                          │
│  │             │  • Parallel fetches for all URLs                │
│  │             │  • Skip blocked/failed URLs                     │
│  │             │  • Deduplicate already-visited URLs             │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                 │
│  │  SUMMARIZE  │  LLM summarizes each page                       │
│  │             │  • Extracts key facts, quotes, data             │
│  │             │  • Preserves source attribution                 │
│  │             │  • Parallel processing                          │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                 │
│  │   OBSERVE   │  Pattern analysis (streaming)                   │
│  │             │  • Analyzes all accumulated summaries           │
│  │             │  • Extracts artifacts and claims                │
│  │             │  • Confidence scoring per claim                 │
│  │             │  • Generates structured observation             │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                 │
│  │   REFLECT   │  Goal evaluation                                │
│  │             │  • Is goal_satisfied? (true/false)              │
│  │             │  • If YES → Generate OUTPUT                     │
│  │             │  • If NO  → Continue to next iteration          │
│  └─────────────┘                                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
\`\`\`

### What Triggers a New Cycle?

A new LOOP cycle is triggered when **ALL** of these conditions are met:

1. **Goal not satisfied** — The Reflect phase determined more research is needed
2. **Iterations remaining** — \`iterations_completed < model_max_iterations\`
3. **Budget available** — Steps, tokens, cost, and time limits not exceeded

### What Stops the Loop?

The LOOP stops when **ANY** of these conditions is true:

| Condition | Description |
|-----------|-------------|
| \`goal_satisfied = true\` | Agent determined the research goal is met |
| \`iterations_completed >= model_max_iterations\` | Hit iteration limit (default: 2) |
| \`steps_used >= budget_max_steps\` | Hit step limit (default: 2) |
| \`tokens_used >= budget_max_tokens\` | Hit token budget (default: 60,000) |
| \`cost_used >= budget_max_cost\` | Hit cost budget (default: $3.00) |
| Execution time exceeded | Hit \`budget_max_execution_time\` (default: 10 min) |
| Error encountered | Unrecoverable error during any phase |

---

## Steps Explained

**Steps** count the number of tool invocations during a run:

| Tool | Step Count | Description |
|------|------------|-------------|
| \`web_search\` | 1 per call | Google Custom Search API query |
| \`fetch_url\` | 1 per URL | Retrieve page content |
| \`get_text_summary\` | 1 per URL | LLM summarization |

### Example Step Calculation

For an iteration with 3 search results:
- 1 web_search call → **1 step**
- 3 fetch_url calls → **3 steps**
- 3 get_text_summary calls → **3 steps**
- **Total: 7 steps per iteration**

With \`budget_max_steps = 2\`, this would exceed limits immediately. Adjust your budget accordingly!

---

## Search Pagination

The agent uses the **same goal_title** for every search but advances the \`start\` parameter to get fresh results:

\`\`\`typescript
// From src/lib/constants.ts
export const MAX_WEB_SEARCH_RESULTS = 10;

// Pagination formula (0-indexed cycle)
start = 1 + (cycle × MAX_WEB_SEARCH_RESULTS)
\`\`\`

| Cycle | Start Index | Results |
|-------|-------------|---------|
| 0 | 1 | Results 1–10 |
| 1 | 11 | Results 11–20 |
| 2 | 21 | Results 21–30 |
| N | 1 + (N × 10) | Next batch |

This pagination strategy:
- **Avoids duplicate sources** across cycles
- **Broadens coverage** with each iteration
- **Uses consistent query** (no query drift)

---

## Limits & Budget Constraints

### Default Limits

| Limit | Default | Description |
|-------|---------|-------------|
| \`model_max_iterations\` | 2 | Max LOOP cycles |
| \`budget_max_steps\` | 2 | Max tool calls |
| \`budget_max_tokens\` | 60,000 | Cumulative LLM tokens |
| \`budget_max_cost\` | $3.00 | API costs (Google Search) |
| \`budget_max_execution_time\` | 600,000ms (10 min) | Wall-clock timeout |

### Recommended Configurations

| Use Case | Iterations | Steps | Notes |
|----------|------------|-------|-------|
| Quick lookup | 1 | 10 | Fast, shallow research |
| Standard research | 2-3 | 25 | Balanced depth/speed |
| Deep dive | 5+ | 50+ | Comprehensive, slow |

> ⚠️ **Warning:** High iteration counts with many search results can quickly exhaust token/step budgets.

---

## Observation Phase

The **Observe** phase analyzes all accumulated summaries and produces:

### Artifacts

Structured data objects extracted from sources:

\`\`\`typescript
{
  title: string;      // Artifact name
  source_url: string; // Where it came from
  summary: string;    // Key content
  relevance_reason: string; // Why it matters
  claims: Claim[];    // Factual statements
}
\`\`\`

### Claims with Confidence

Each claim has a confidence score (0.0–1.0):

| Score Range | Label | Color | Interpretation |
|-------------|-------|-------|----------------|
| 0.80–1.00 | High | 🟢 Green | Strong evidence, multiple sources |
| 0.60–0.79 | Medium | 🔵 Blue | Good evidence, some verification |
| 0.40–0.59 | Low | 🟡 Yellow | Limited evidence, needs verification |
| 0.00–0.39 | Very Low | 🔴 Red | Weak/unverified, treat with caution |

Confidence is computed from:
- **Heuristic confidence** — Source quality, recency, specificity
- **LLM confidence** — Model's assessment of claim reliability

---

## Reflect Phase

After observing, the agent reflects on whether the goal is satisfied:

\`\`\`typescript
{
  goal_satisfied: boolean;  // Continue or stop?
  summary: string;          // Reflection reasoning
  gaps: string[];           // What's missing (if not satisfied)
}
\`\`\`

### Decision Logic

\`\`\`
IF goal_satisfied = true
  → Generate final OUTPUT markdown
  → STOP loop
ELSE IF budget/limits exceeded
  → STOP loop (incomplete)
ELSE
  → Continue to next iteration
\`\`\`

---

## Output Generation

When \`goal_satisfied = true\`, the agent generates a final markdown report:

### Output Structure

\`\`\`markdown
## Overview
[High-level summary of findings]

## Key Findings
[Main discoveries, numbered or bulleted]

## Evidence & Quotes
[Supporting data with citations]

## Counterpoints / Limitations
[Alternative views, gaps, uncertainties]

## Sources
[List of URLs with titles]

## Next Steps
[Suggestions for further research]
\`\`\`

### Output Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| \`model_output_format\` | "markdown" | Output format |
| \`model_max_tokens\` | 8,000 | Max tokens for output |

---

## Real-Time Monitoring

The Run tab provides live updates during execution:

### Visual Indicators

| Element | Meaning |
|---------|---------|
| **Loader overlay** | API request in progress |
| **"Running LOOP..."** button | Iteration executing |
| **Iteration block** | Completed cycle with results |
| **Streaming observation** | Observe phase in progress |

### Iteration Block Contents

Each completed iteration shows:

1. **Iteration number** and query
2. **Pagination range** (e.g., "start 1–10")
3. **Fetched Contents** — URLs and raw content
4. **Summaries** — LLM-generated summaries per URL
5. **Observe & Reflect** — Artifacts, claims, and goal assessment

---

## Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Loop stops after 1 iteration | \`budget_max_steps\` too low | Increase step budget |
| No search results | Invalid API key | Check Google API settings |
| "Blocked" fetch results | Site blocks scraping | Expected; agent continues |
| Goal never satisfied | Query too broad | Make goal_title more specific |
| High token usage | Long system prompt | Simplify goal_system_prompt |

### Debugging Tips

1. **Check Config tab** — Verify budget limits match expectations
2. **Expand "Raw JSON"** — See full observation/reflect data
3. **Monitor Steps counter** — Track against budget_max_steps
4. **Review summaries** — Ensure fetch/summarize succeeded

---

## API Routes Used

| Route | Purpose |
|-------|---------|
| \`/api/tools/web_search\` | Google Custom Search |
| \`/api/tools/fetch_url\` | Page content retrieval |
| \`/api/tools/get_text_summary\` | LLM summarization |
| \`/api/loop/observe\` | Pattern analysis |
| \`/api/loop/reflect\` | Goal evaluation |
| \`/api/loop/output\` | Final markdown generation |

---

## Best Practices

1. **Start small** — Test with 1-2 iterations before scaling up
2. **Specific goals** — Vague goals lead to unsatisfied loops
3. **Monitor tokens** — High iteration counts burn through budgets fast
4. **Check summaries** — Quality summaries = quality output
5. **Review artifacts** — Confidence scores indicate reliability

---

*OGTO v1.0 — Run Execution Reference*
`;
