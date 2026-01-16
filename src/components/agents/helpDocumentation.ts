export const AGENTS_HELP_DOCUMENTATION = `# OGTO Agent Documentation

> Comprehensive guide to creating, configuring, and running AI agents in OGTO.

---

## Overview

OGTO (Open Goal-Task Orchestrator) is an AI agent framework that executes goal-oriented research tasks using a **LOOP strategy** (Learn-Observe-Optimize-Perform). Each agent is configured with a specific goal, model settings, and budget constraints, then autonomously executes web research cycles until the goal is satisfied or limits are reached.

### Key Concepts

- **Agent**: An autonomous AI entity configured to achieve a specific research goal
- **Run**: A single execution instance of an agent working toward its goal
- **Iteration**: One complete cycle of the LOOP strategy (search → fetch → summarize → observe → reflect)
- **Goal Satisfaction**: The agent's self-assessment of whether collected information adequately answers the goal

---

## Creating an Agent

When you create an agent, you configure four main areas:

| Section | Purpose |
|---------|---------|
| **Agent Information** | Identity fields (auto-generated from Goal Title) |
| **Goal Definition** | What the agent should research and accomplish |
| **Model Configuration** | LLM settings and behavioral parameters |
| **Budget Constraints** | Resource limits and execution controls |

---

## Form Fields

### Goal Title ⭐ (Primary Input)

The **Goal Title** is the most important field—it's the only field you need to fill in manually.

\`\`\`
Example: "Latest advancements in quantum computing 2025"
\`\`\`

**Behavior:**
- When you type or modify the Goal Title, an **LLM autofill request** is triggered (after 450ms debounce)
- The LLM automatically generates appropriate values for:
  - \`agent_name\` — A descriptive name for the agent
  - \`agent_role\` — The professional persona the agent adopts
  - \`goal_system_prompt\` — Detailed instructions guiding agent behavior

> 💡 **Tip:** Be specific in your Goal Title. "AI trends" is too vague; "Enterprise AI adoption trends in healthcare 2025" gives the LLM better context to generate useful agent configuration.

### Agent Name (Read-Only, Auto-Generated)

\`\`\`typescript
Field: agent_name
Type: string
Auto-generated: Yes
\`\`\`

The display name for your agent, automatically derived from the Goal Title. Examples:
- Goal: "Climate change impact on agriculture" → Agent: "Climate Agriculture Research Agent"
- Goal: "TypeScript best practices 2025" → Agent: "TypeScript Best Practices Agent"

### Agent Role (Read-Only, Auto-Generated)

\`\`\`typescript
Field: agent_role  
Type: string
Auto-generated: Yes
\`\`\`

The professional role or persona the agent adopts when conducting research. This influences communication style and approach. Examples:
- "Senior Research Analyst"
- "Technical Documentation Specialist"
- "Investigative Journalist"

### Goal System Prompt (Read-Only, Auto-Generated)

\`\`\`typescript
Field: goal_system_prompt
Type: string (multiline)
Auto-generated: Yes
\`\`\`

Detailed instructions that guide the agent's behavior throughout execution. The LLM generates a comprehensive prompt including:
- Research workflow steps
- Source quality rules
- Output format specifications
- Verification requirements

---

## Model Configuration

### Model

\`\`\`typescript
Field: model
Type: string
Default: "gpt-oss:20b" (local Ollama)
\`\`\`

The LLM that powers your agent. OGTO uses **Ollama** for local model inference, providing:
- **Privacy**: All inference runs locally on your machine
- **Cost**: No per-token API fees
- **Speed**: Low latency for streaming responses
- **Flexibility**: Support for various open-source models

Currently configured model: \`gpt-oss:20b\` — A capable 20B parameter model suitable for research tasks.

### Model Temperature

\`\`\`typescript
Field: model_temperature
Type: number
Range: 0.1 - 2.0
Default: 0.1
\`\`\`

Controls randomness and creativity in responses:

| Range | Behavior | Best For |
|-------|----------|----------|
| 0.1-0.3 | Focused, deterministic | Factual research, analysis |
| 0.4-0.7 | Balanced creativity | General tasks |
| 0.8-2.0 | High creativity, varied | Creative writing, brainstorming |

> 🔬 For research agents, **low temperature (0.1-0.3)** is recommended to ensure consistent, fact-focused outputs.

### Model Output Format

\`\`\`typescript
Field: model_output_format
Type: string
Options: "markdown" | "json" | "html" | "plain text"
Default: "markdown"
\`\`\`

The format for the agent's final synthesized output. Markdown is recommended as it supports:
- Headers and sections
- Lists and tables
- Links and citations
- Code blocks

### Model Max Tokens

\`\`\`typescript
Field: model_max_tokens
Type: number
Default: 8000
\`\`\`

Maximum tokens the model can generate per response. Token guidelines:

| Tokens | Approximate Output |
|--------|-------------------|
| 128 | ~100 words — Labels, classifications |
| 512 | ~380 words — Paragraph summaries |
| 2048 | ~1.5k words — Detailed reports |
| 8000 | ~6k words — Comprehensive analysis |
| 16384 | ~12k words — Long-form documentation |

### Model Max Iterations

\`\`\`typescript
Field: model_max_iterations
Type: number
Default: 2
\`\`\`

**Critical parameter** — Controls how many complete LOOP cycles the agent performs.

Each iteration:
1. Executes a paginated web search (using Google Custom Search)
2. Fetches content from discovered URLs
3. Summarizes each page's content
4. Observes patterns and extracts key findings
5. Reflects on goal satisfaction

**More iterations = deeper research but longer execution time.**

---

## Budget Constraints

### Max Cost

\`\`\`typescript
Field: budget_max_cost
Type: string (USD)
Default: "3.00"
\`\`\`

Maximum dollar amount for external API calls (e.g., Google Search API). With local Ollama inference, LLM costs are $0.

### Max Tokens

\`\`\`typescript
Field: budget_max_tokens
Type: string
Default: "60000"
\`\`\`

Cumulative token budget across all LLM calls during execution. Different from \`model_max_tokens\` — this is the total limit.

### Max Execution Time

\`\`\`typescript
Field: budget_max_execution_time
Type: number (milliseconds)
Default: 600000 (10 minutes)
\`\`\`

Hard timeout for the entire run. The agent stops gracefully when this limit is reached.

### Max Steps

\`\`\`typescript
Field: budget_max_steps
Type: number
Default: 2
\`\`\`

Maximum tool calls/actions across all iterations. Each web search, fetch, or summarize counts as a step.

---

## Control Cycles: The LOOP Strategy

OGTO agents use a **LOOP strategy** for iterative research:

### 🔄 LOOP Cycle Phases

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│  ITERATION N (repeated up to model_max_iterations)         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. SEARCH ──────────────────────────────────────────────  │
│     • Query: goal_title (same query, paginated)            │
│     • Formula: start = 1 + (cycle × MAX_WEB_SEARCH_RESULTS)│
│     • Results: 10 per cycle (MAX_WEB_SEARCH_RESULTS = 10)  │
│                                                             │
│  2. FETCH ───────────────────────────────────────────────  │
│     • Retrieve full content from discovered URLs           │
│     • Skip already-visited URLs (deduplication)            │
│     • Handle blocked/failed fetches gracefully             │
│                                                             │
│  3. SUMMARIZE ───────────────────────────────────────────  │
│     • LLM summarizes each page's content                   │
│     • Extracts key facts, quotes, and data                 │
│     • Preserves source attribution                         │
│                                                             │
│  4. OBSERVE ─────────────────────────────────────────────  │
│     • Streams analysis of accumulated summaries            │
│     • Identifies patterns across sources                   │
│     • Generates structured observation (headline, details) │
│                                                             │
│  5. REFLECT ─────────────────────────────────────────────  │
│     • Evaluates: Is the goal satisfied?                    │
│     • If YES → Generate final OUTPUT and stop              │
│     • If NO  → Continue to next iteration                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### Web Search Pagination

The agent uses the **same Goal Title** for every search but advances the \`start\` parameter:

\`\`\`typescript
// From src/lib/constants.ts
export const MAX_WEB_SEARCH_RESULTS = 10;

// Pagination formula (0-indexed cycle)
start = 1 + (cycle × MAX_WEB_SEARCH_RESULTS)
\`\`\`

| Cycle | Start | Results |
|-------|-------|---------|
| 0 | 1 | Results 1–10 |
| 1 | 11 | Results 11–20 |
| 2 | 21 | Results 21–30 |
| N | 1 + (N × 10) | Next batch |

This ensures broader coverage without repeating sources across cycles.

### Goal Satisfaction

After each iteration's Reflect phase, the agent determines if:
- **Satisfied**: Collected information adequately answers the goal → Generate final output
- **Not Satisfied**: Gaps remain → Continue to next iteration with fresh search results

---

## LLM Usage

OGTO uses **local Ollama** inference for all LLM operations:

### LLM Calls in a Single Run

| Operation | LLM Call | Purpose |
|-----------|----------|---------|
| Autofill Agent | 1× | Generate agent_name, agent_role, goal_system_prompt |
| Summarize | N× per iteration | Summarize each fetched URL's content |
| Observe | 1× per iteration | Analyze accumulated summaries |
| Reflect | 1× per iteration | Evaluate goal satisfaction |
| Output | 1× (final) | Generate formatted research report |

### Model: gpt-oss:20b

Current configuration uses GPT-OSS (20B parameters):
- **Context window**: 32k tokens
- **Strengths**: Strong reasoning, good at structured output
- **Local inference**: Runs via Ollama on your machine

---

## Tabs Reference

### Form Tab
The main configuration interface where you set the Goal Title and adjust model/budget parameters.

### Config Tab
Shows the live JSON configuration object that will be sent when creating the agent run. Useful for debugging and understanding the exact parameters.

### Help Tab
This documentation (you're reading it now!).

---

## Quick Start

1. **Enter a Goal Title** — Be specific about what you want to research
2. **Wait for autofill** — Agent name, role, and system prompt generate automatically
3. **Adjust iterations** — More iterations = deeper research (default: 2)
4. **Click "Create Agent Run"** — Starts the agent and redirects to the Runs page
5. **Monitor progress** — Watch the LOOP cycles execute in real-time

---

## Tips for Effective Research Agents

1. **Specific goals work best**: "Impact of AI on healthcare diagnostics in 2025" beats "AI in healthcare"
2. **Start with 2-3 iterations**: You can always create another run with more if needed
3. **Low temperature for facts**: Keep temperature at 0.1-0.3 for research accuracy
4. **Monitor the Run page**: See each iteration's search results, summaries, and observations as they happen
5. **Check the Output tab**: Final synthesized report appears when goal_satisfied becomes true

---

*OGTO v1.0 — Goal-Oriented Research Agent Framework*
`;
