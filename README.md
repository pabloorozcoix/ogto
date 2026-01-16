# OGTO — Open Goal-Task Orchestrator

> Build, execute, and monitor AI research agents in real time.

OGTO is a **goal-oriented AI agent framework** that executes autonomous web research using the LOOP strategy. Define a goal, and OGTO searches, fetches, summarizes, and synthesizes information until the research objective is satisfied.

## Key Features

- 🤖 **Autonomous Research** — Agents iterate until goal is satisfied
- 🔄 **LOOP Strategy** — Search → Fetch → Summarize → Observe → Reflect
- 🏠 **Local-First** — Runs entirely on your machine with Ollama
- 📊 **Real-Time Monitoring** — Watch iterations execute live
- 💾 **Full Trace Persistence** — Every step stored in Supabase

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **LLM** | Ollama (local, open-source models) |
| **Database** | Supabase + Drizzle ORM + pgvector |
| **Search** | Google Custom Search API |
| **State** | Jotai + React Hook Form + Zod 4 |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Testing** | Vitest |

---

## Prerequisites

- **Node.js** 20+ (recommended)
- **Docker Desktop** (required for local Supabase)
- **Supabase CLI** — [Installation Guide](https://supabase.com/docs/guides/local-development/cli/getting-started)
- **Ollama** — [Download](https://ollama.com)

---

## Installation & Setup

### Step 1: Clone & Install Dependencies

```bash
git clone <repository-url>
cd og2
npm install
```

### Step 2: Start Ollama & Pull Model

```bash
# Start Ollama server
ollama serve

# In another terminal, pull the default model
ollama pull gpt-oss:20b
```

> 💡 OGTO uses `gpt-oss:20b` by default — a capable 20B parameter open-source model. You can change this in `src/lib/localOllama.ts`.

### Step 3: Start Local Supabase

```bash
supabase start
```

This starts local services on default ports:
- **Supabase API**: `http://127.0.0.1:54321`
- **Postgres**: `localhost:54322`
- **Studio**: `http://127.0.0.1:54323`

After startup, run `supabase status` to see your local credentials.

### Step 4: Configure Environment Variables

Create `.env.local` in the project root:

```bash
# =============================================================================
# OGTO Environment Configuration
# =============================================================================
# NOTE: All variables use NEXT_PUBLIC_ prefix for simplicity in this local-first
# setup with open-source consumer models. For production deployments with paid
# APIs or sensitive credentials, migrate to server-only environment variables
# (remove NEXT_PUBLIC_ prefix) and access them only in API routes/server components.
# =============================================================================

# -----------------------------------------------------------------------------
# Supabase Configuration (Required)
# Get these values from `supabase status` after running `supabase start`
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>

# Database credentials for migrations and diagnostics
NEXT_PUBLIC_SUPABASE_POSTGRES_USER=postgres
NEXT_PUBLIC_SUPABASE_POSTGRES_PASSWORD=postgres

# Service role key for pgvector operations (from `supabase status`)
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key>

# -----------------------------------------------------------------------------
# Google Custom Search API (Required for web search)
# Setup guide: https://programmablesearchengine.google.com
# -----------------------------------------------------------------------------
NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID=<your-search-engine-id>
NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY=<your-google-api-key>

# -----------------------------------------------------------------------------
# Optional: OpenAI API Key (not required for local Ollama setup)
# -----------------------------------------------------------------------------
# OPENAI_API_KEY=<your-openai-key>
```

#### Why `NEXT_PUBLIC_` Variables?

This project is designed for **local-first development** with open-source models running on your machine. Since we're using a consumer open-source small language model (Ollama) and local Supabase, there are no paid API keys or sensitive credentials that require server-side protection.

**For future optimization:** When deploying to production or using paid APIs (OpenAI, Anthropic, etc.), migrate sensitive variables to server-only environment variables by:
1. Removing the `NEXT_PUBLIC_` prefix
2. Accessing them only in API routes (`/api/*`) or Server Components
3. Using Next.js runtime environment variables for dynamic configuration

### Step 5: Initialize Database

```bash
npm run db:init
```

This runs the migration script that:
- Enables required PostgreSQL extensions (`pgcrypto`, `vector`)
- Creates OGTO tables and indexes
- Prepares the database for agent execution traces

### Step 6: Start OGTO

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Quick Start (5 Minutes)

### 1. Verify Services (Settings Page)

Go to **Settings** and test all three connections:

| Test | Expected Result |
|------|-----------------|
| **Ollama Test** | Green response text |
| **Database Test** | All checks ✅ |
| **Google Search** | JSON results returned |

### 2. Create an Agent (Agents Page)

1. Enter a **Goal Title** (e.g., "Best frameworks for production-grade AI agents in 2025")
2. Wait for **auto-fill** — agent name, role, and system prompt generate automatically
3. Adjust **Max Iterations** if needed (default: 2)
4. Click **Create Agent Run**

### 3. Monitor Execution (Runs Page)

1. Click **Run LOOP** to start execution
2. Watch iterations execute in real-time:
   - Search → Fetch → Summarize → Observe → Reflect
3. View final markdown output when `goal_satisfied = true`

---

## The LOOP Strategy

A **Run** is a single execution of an agent working toward its goal. Each run consists of one or more **iterations** (cycles).

**What causes a cycle?** After each iteration, the agent reflects: *"Is my goal satisfied?"*
- **No** → Loop continues with fresh search results (paginated)
- **Yes** → Generate final output and stop

```
Goal Title
    │
    ▼
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ SEARCH  │ → │  FETCH  │ → │SUMMARIZE│ → │ OBSERVE │ → │ REFLECT │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
    │                                                        │
    │              goal_satisfied = false                    │
    └────────────────────────────────────────────────────────┘
                             │
                   goal_satisfied = true
                             │
                             ▼
                       ┌──────────┐
                       │  OUTPUT  │
                       └──────────┘
```

### LOOP Phases

| Phase | Tool | Description |
|-------|------|-------------|
| **Search** | `web_search` | Google Custom Search with pagination |
| **Fetch** | `fetch_url` | Retrieve page content (parallel) |
| **Summarize** | `get_text_summary` | LLM summarizes each page |
| **Observe** | — | Pattern analysis, artifact extraction |
| **Reflect** | — | Goal satisfaction evaluation |
| **Output** | — | Final markdown report generation |

### Search Pagination

Each cycle searches for fresh results using the **same goal_title** but advancing the `start` parameter:

```typescript
// From src/lib/constants.ts
export const MAX_WEB_SEARCH_RESULTS = 10;

// Pagination formula (0-indexed cycle)
start = 1 + (cycle × MAX_WEB_SEARCH_RESULTS)
```

| Cycle | Start | Results |
|-------|-------|---------|
| 0 | 1 | Results 1–10 |
| 1 | 11 | Results 11–20 |
| 2 | 21 | Results 21–30 |
| N | 1 + (N × 10) | Next batch |

> 💡 This ensures broader coverage without repeating sources across cycles.

---

## Use Cases & Example Goals

| Use Case | Example Goal Title |
|----------|-------------------|
| **Tech Research** | "Best frameworks for production-grade AI agents in 2025" |
| **Trend Analysis** | "What's hype vs reality in generative AI adoption 2025" |
| **Competitive Intel** | "How do LangChain, CrewAI, and AutoGen compare for enterprise" |
| **Market Research** | "Enterprise AI spending trends and forecasts 2025-2027" |
| **Technical Deep Dive** | "RAG vs fine-tuning: when to use each approach" |
| **Product Research** | "Top open-source LLMs for local deployment in 2025" |
| **Industry Analysis** | "AI regulation landscape in EU, US, and Asia 2025" |
| **How-To Guides** | "Best practices for building multi-agent systems" |

> 💡 **Tip:** Specific goals work best. "AI trends" is too vague; "Enterprise AI adoption trends in healthcare 2025" yields focused research.

---

## Key Concepts

| Concept | Definition |
|---------|------------|
| **Agent** | AI entity configured with a goal and model settings |
| **Run** | Single execution of an agent toward its goal |
| **Iteration** | One complete LOOP cycle |
| **Goal Satisfaction** | Agent's assessment that collected info answers the goal |
| **Artifact** | Structured data extracted from sources (claims, quotes) |

---

## Default Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| Model | `gpt-oss:20b` | Local Ollama LLM |
| Temperature | 0.1 | Low for factual research |
| Max Iterations | 2 | LOOP cycles per run |
| Max Steps | 2 | Tool calls budget |
| Max Tokens | 60,000 | Total token budget |
| Max Cost | $3.00 | API costs budget |
| Timeout | 10 min | Execution time limit |
| Search Results | 10 | Results per search query |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home
│   ├── agents/            # Agent creation
│   ├── runs/              # Execution monitoring
│   ├── tools/             # Tool catalog
│   ├── settings/          # Configuration
│   └── api/               # API routes
│       ├── tools/         # web_search, fetch_url, get_text_summary
│       ├── loop/          # observe, reflect, output
│       └── llm/           # autofill-agent
├── components/            # Feature components
│   ├── agents/            # Agent form, hooks, help docs
│   ├── runs/              # Run list, RunDetail, hooks
│   ├── tools/             # Tool catalog, modal
│   ├── settings/          # Connection tests
│   └── ui/                # Shared UI (Button, Card, Tabs, etc.)
├── db/                    # Drizzle schema
└── lib/                   # Utilities, Supabase client, constants
```

### Component Structure

Each feature uses a modular folder structure:

```
/components/Feature/
  index.tsx              # Main UI component
  hooks/
    useFeature.ts        # Core logic hook
    useFeatureForm.ts    # Form handling
  types.ts               # TypeScript types
  constants.ts           # Feature constants
  helpDocumentation.ts   # Markdown help content
```

---

## Navigation

| Page | Purpose | Key Actions |
|------|---------|-------------|
| 🏠 **Home** | Overview & quick start | Read docs, understand workflow |
| 🤖 **Agents** | Create research agents | Set goal, configure model, launch |
| ⚡ **Runs** | Monitor execution | Watch iterations, view output |
| 🛠️ **Tools** | Tool catalog | Browse available tools |
| ⚙️ **Settings** | Service configuration | Test Ollama, DB, Google API |

Each page has a **Help** tab with detailed documentation.

---

## Tools Reference

### Active in Run Loop

| Tool | Purpose | API Route |
|------|---------|-----------|
| `web_search` | Google Custom Search | `/api/tools/web_search` |
| `fetch_url` | Page content retrieval | `/api/tools/fetch_url` |
| `get_text_summary` | LLM summarization | `/api/tools/get_text_summary` |

### Implemented (Not in Loop)

| Tool | Purpose | API Route |
|------|---------|-----------|
| `get_hyperlinks` | Link extraction | `/api/tools/get_hyperlinks` |
| `start_agent` | Sub-agent creation | `/api/tools/start_agent` |

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run type-check` | Verify TypeScript types |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run test` | Run Vitest tests |
| `npm run db:init` | Initialize/reset database |
| `npx drizzle-kit push` | Apply Drizzle migrations |

### Service Commands

| Command | Purpose |
|---------|---------|
| `ollama serve` | Start Ollama LLM server |
| `ollama pull gpt-oss:20b` | Download default model |
| `ollama list` | List installed models |
| `supabase start` | Start local Supabase |
| `supabase stop` | Stop local Supabase |
| `supabase status` | Show URLs and credentials |

---

## Google Custom Search Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the **Custom Search API**

### Step 2: Create API Key

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy to `NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY`

### Step 3: Create Search Engine

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com)
2. Click **Add** to create a new engine
3. Select **"Search the entire web"**
4. Copy the **Search engine ID** to `NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID`

### API Quotas

| Tier | Daily Queries | Cost |
|------|---------------|------|
| Free | 100/day | $0 |
| Paid | 10,000/day | $5 per 1,000 queries |

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Ollama not connecting | Server not running | Run `ollama serve` |
| Model not found | Model not pulled | Run `ollama pull gpt-oss:20b` |
| Database errors | Supabase not running | Run `supabase start` |
| pgvector errors | Extension missing | Run `npm run db:init` |
| Search returns nothing | Invalid API credentials | Check Google keys in Settings |
| Agent fields empty | Autofill in progress | Wait for LLM response |
| Loop stops early | Step budget exceeded | Increase `budget_max_steps` |
| `pg_dump` version mismatch | Host/container mismatch | Run pg_dump inside container |

### Verification Checklist

Before running your first agent:

- [ ] Ollama server running (`ollama serve`)
- [ ] Model pulled (`ollama pull gpt-oss:20b`)
- [ ] Supabase running (`supabase start`)
- [ ] `.env.local` configured with all keys
- [ ] Database initialized (`npm run db:init`)
- [ ] All Settings tests passing ✅

---

## Development

### Testing

```bash
# Run all tests
npm run test

# Interactive UI
npm run test:ui

# Specific test
npm test -- -t "test name"
```

### Type Checking

```bash
npm run type-check
```

### Linting & Formatting

```bash
npm run lint:fix
npm run format
```

---

## Database Schema

OGTO uses PostgreSQL (via Supabase) with pgvector for semantic search. The schema is defined in `drizzle/migrations/init_db.sql`.

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OGTO Database Schema                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐                                                           │
│  │  agent_ctx   │  Agent configuration (immutable after creation)           │
│  │──────────────│                                                           │
│  │ id (PK)      │                                                           │
│  │ agent_name   │                                                           │
│  │ agent_role   │                                                           │
│  │ goal_title   │                                                           │
│  │ goal_system_ │                                                           │
│  │   prompt     │                                                           │
│  │ model        │                                                           │
│  │ model_temp   │                                                           │
│  │ model_max_*  │                                                           │
│  │ budget_max_* │                                                           │
│  └──────┬───────┘                                                           │
│         │ 1                                                                 │
│         │                                                                   │
│         ▼ N                                                                 │
│  ┌──────────────┐                                                           │
│  │ agent_state  │  Run state (mutable, tracks progress)                     │
│  │──────────────│                                                           │
│  │ id (PK)      │◄─────────────────────────────────────────────┐            │
│  │ agent_ctx_id │                                              │            │
│  │ iterations_  │                                              │            │
│  │   completed  │                                              │            │
│  │ steps_used   │                                              │            │
│  │ tokens_used  │                                              │            │
│  │ cost_used    │                                              │            │
│  │ summary      │                                              │            │
│  │ status       │                                              │            │
│  └──────┬───────┘                                              │            │
│         │ 1                                                    │            │
│         │                                                      │            │
│    ┌────┴────┬──────────────────────────┐                      │            │
│    │         │                          │                      │            │
│    ▼ N       ▼ N                        ▼ N                    │            │
│ ┌────────┐ ┌──────────┐          ┌─────────────────────┐       │            │
│ │ memory │ │plan_step │          │claim_confidence_log │       │            │
│ │────────│ │──────────│          │─────────────────────│       │            │
│ │ id     │ │ id (PK)  │          │ id (PK)             │       │            │
│ │ text   │ │ rationale│          │ agent_state_id (FK) │───────┘            │
│ │ tags   │ │ tool_name│          │ observation_id      │                    │
│ │ source │ │ args     │          │ statement           │                    │
│ │embedding│ │ success_ │          │ heuristic_confidence│                   │
│ │(vector)│ │  criteria│          │ llm_confidence      │                    │
│ └────────┘ └────┬─────┘          │ blended_confidence  │                    │
│                 │ 1              └─────────────────────┘                    │
│                 │                                                           │
│                 ▼ N                                                         │
│          ┌─────────────┐                                                    │
│          │ tool_result │  Result of tool execution                          │
│          │─────────────│                                                    │
│          │ id (PK)     │                                                    │
│          │ plan_step_id│                                                    │
│          │ ok          │                                                    │
│          │ data (jsonb)│                                                    │
│          │ error       │                                                    │
│          │ meta (jsonb)│                                                    │
│          └──────┬──────┘                                                    │
│                 │ 1                                                         │
│                 │                                                           │
│                 ▼ N                                                         │
│          ┌─────────────┐                                                    │
│          │ observation │  Pattern analysis output                           │
│          │─────────────│                                                    │
│          │ id (PK)     │                                                    │
│          │ tool_result │                                                    │
│          │   _id       │                                                    │
│          │ headline    │                                                    │
│          │ details     │                                                    │
│          │ artifacts   │                                                    │
│          │ quality     │                                                    │
│          └──────┬──────┘                                                    │
│                 │ 1                                                         │
│                 │                                                           │
│                 ▼ N                                                         │
│          ┌─────────────┐                                                    │
│          │ reflection  │  Goal satisfaction evaluation                      │
│          │─────────────│                                                    │
│          │ id (PK)     │                                                    │
│          │observation_ │                                                    │
│          │   id        │                                                    │
│          │ critique    │                                                    │
│          │ decision    │                                                    │
│          │goal_satisfied                                                    │
│          │ memory_note │                                                    │
│          └─────────────┘                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tables Reference

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `agent_ctx` | Agent configuration (immutable) | goal_title, model, budget limits |
| `agent_state` | Run execution state (mutable) | iterations_completed, tokens_used, summary |
| `memory` | Semantic memory with embeddings | text, embedding (vector), tags |
| `plan_step` | Planned tool invocation | tool_name, args, rationale |
| `tool_result` | Tool execution result | ok, data (jsonb), error |
| `observation` | Pattern analysis output | headline, artifacts, quality |
| `reflection` | Goal satisfaction evaluation | goal_satisfied, critique, decision |
| `claim_confidence_log` | Confidence tracking per claim | statement, heuristic/llm/blended confidence |

### Relationships

```
agent_ctx (1) ──────► (N) agent_state
                          │
                          ├──► (N) memory
                          ├──► (N) plan_step ──► (N) tool_result ──► (N) observation ──► (N) reflection
                          └──► (N) claim_confidence_log
```

**One agent_ctx → Many agent_states**: Each agent configuration can have multiple runs (executions).

**One agent_state → Many plan_steps**: Each run can have multiple tool invocations planned.

**One plan_step → Many tool_results**: Each planned step produces results (usually 1:1, but supports retries).

**Chain: tool_result → observation → reflection**: Each tool result is analyzed (observed), then evaluated (reflected).

---

## Vector Store (pgvector)

OGTO uses PostgreSQL's **pgvector** extension for semantic similarity search on agent memory.

### Schema

```sql
CREATE TABLE public.memory (
  id uuid PRIMARY KEY,
  agent_state_id uuid REFERENCES public.agent_state(id),
  text text NOT NULL,
  tags text[],
  source text,
  step_id uuid,
  embedding vector(1536),  -- OpenAI-compatible 1536-dimensional vector
  created_at timestamptz DEFAULT now()
);

-- IVFFlat index for fast approximate nearest neighbor search
CREATE INDEX idx_memory_embedding 
  ON public.memory 
  USING ivfflat (embedding vector_l2_ops) 
  WITH (lists = 100);
```

### How pgvector is Used

| Component | Usage |
|-----------|-------|
| **Settings** | `test_vector_extension()` RPC verifies pgvector is operational |
| **Memory** | Stores text embeddings for semantic search |
| **Future** | RAG retrieval, memory consolidation, similar run detection |

### Vector Operations

```sql
-- Semantic similarity search (L2 distance)
SELECT * FROM memory 
ORDER BY embedding <-> $query_vector 
LIMIT 10;

-- Cosine similarity (if using cosine ops)
SELECT * FROM memory 
ORDER BY embedding <=> $query_vector 
LIMIT 10;
```

### Diagnostic RPC

The Settings page tests pgvector via this function:

```sql
CREATE OR REPLACE FUNCTION public.test_vector_extension() 
RETURNS boolean AS $$
BEGIN
  PERFORM '[1,2,3]'::vector(3);
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

---

## Database Usage by Feature

### 🤖 Agents Page

**Creates:** `agent_ctx` + `agent_state`

When you click "Create Agent Run":

```
1. INSERT into agent_ctx (configuration)
   ├─ agent_name, agent_role
   ├─ goal_title, goal_system_prompt
   ├─ model, model_temperature, model_max_tokens
   └─ budget_max_cost, budget_max_tokens, budget_max_steps

2. INSERT into agent_state (initial run state)
   ├─ agent_ctx_id (FK)
   ├─ iterations_completed = 0
   ├─ steps_used = 0
   ├─ tokens_used = 0
   └─ cost_used = 0
```

### ⚡ Runs Page (List)

**Reads:** `agent_state` + `agent_ctx`

```sql
SELECT 
  agent_state.*,
  agent_ctx.*
FROM agent_state
JOIN agent_ctx ON agent_state.agent_ctx_id = agent_ctx.id
ORDER BY agent_state.updated_at DESC;
```

Displays: goal_title, iterations, steps, tokens, cost, last updated.

### 🏃 Single Run (RunDetail)

**Reads & Writes:** Full execution trace

#### During LOOP Execution:

```
Each Iteration:
│
├─ SEARCH: INSERT plan_step (tool_name='web_search', args={q, start})
│          INSERT tool_result (ok, data=[{title, url, snippet}...])
│
├─ FETCH:  INSERT plan_step (tool_name='fetch_url', args={url})
│          INSERT tool_result (ok, data={title, content})
│
├─ SUMMARIZE: INSERT plan_step (tool_name='get_text_summary')
│             INSERT tool_result (ok, data={summary, keyPoints})
│
├─ OBSERVE: INSERT observation (headline, details, artifacts)
│           INSERT claim_confidence_log (per claim)
│
├─ REFLECT: INSERT reflection (goal_satisfied, critique, decision)
│
└─ UPDATE agent_state:
   ├─ iterations_completed++
   ├─ steps_used += tool_calls
   ├─ tokens_used += llm_tokens
   └─ summary = updated_summary
```

#### After Goal Satisfied:

```sql
UPDATE agent_state 
SET status = 'completed', 
    summary = $final_output
WHERE id = $run_id;
```

### 🛠️ Tools Page

**Reads:** No direct database access (static catalog)

**Indirectly via API routes:**

| Tool | Tables Affected |
|------|-----------------|
| `web_search` | plan_step, tool_result |
| `fetch_url` | plan_step, tool_result |
| `get_text_summary` | plan_step, tool_result |
| `get_hyperlinks` | plan_step, tool_result |
| `start_agent` | agent_ctx, agent_state |

### ⚙️ Settings Page

**Reads:** System health checks

| Test | Database Operation |
|------|-------------------|
| **Supabase Connection** | Basic query to verify connectivity |
| **pgvector Test** | Calls `test_vector_extension()` RPC |
| **Google Search** | No DB access (external API only) |

---

## Execution Trace Example

A single iteration produces this database trace:

```
agent_ctx (id: abc-123)
└── agent_state (id: run-456)
    ├── iterations_completed: 1
    ├── steps_used: 7
    ├── tokens_used: 4500
    │
    ├── plan_step (web_search)
    │   └── tool_result (ok: true, data: [{title, url, snippet}...])
    │
    ├── plan_step (fetch_url) × 3
    │   └── tool_result (ok: true, data: {title, content})
    │
    ├── plan_step (get_text_summary) × 3
    │   └── tool_result (ok: true, data: {summary, keyPoints})
    │       └── observation (headline, artifacts[])
    │           ├── claim_confidence_log (claim 1)
    │           ├── claim_confidence_log (claim 2)
    │           └── reflection (goal_satisfied: false)
    │
    └── memory (optional semantic embeddings)
```

---

## Database Commands

```bash
# Initialize/reset database (destructive!)
npm run db:init

# Apply Drizzle migrations
npx drizzle-kit push

# Open Supabase Studio (GUI)
# http://127.0.0.1:54323

# Direct psql access
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Useful Queries

```sql
-- List all runs with their goals
SELECT s.id, c.goal_title, s.iterations_completed, s.status
FROM agent_state s
JOIN agent_ctx c ON s.agent_ctx_id = c.id
ORDER BY s.updated_at DESC;

-- Get full execution trace for a run
SELECT 
  ps.tool_name,
  tr.ok,
  tr.data,
  o.headline,
  r.goal_satisfied
FROM plan_step ps
LEFT JOIN tool_result tr ON tr.plan_step_id = ps.id
LEFT JOIN observation o ON o.tool_result_id = tr.id
LEFT JOIN reflection r ON r.observation_id = o.id
WHERE ps.agent_state_id = '<run-id>'
ORDER BY ps.created_at;

-- Count steps per tool
SELECT tool_name, COUNT(*) 
FROM plan_step 
GROUP BY tool_name;

-- Check claim confidence distribution
SELECT 
  ROUND(blended_confidence::numeric, 1) as confidence_bucket,
  COUNT(*)
FROM claim_confidence_log
GROUP BY confidence_bucket
ORDER BY confidence_bucket;
```

---

## License

MIT

---

*OGTO v1.0 — Open Goal-Task Orchestrator*
