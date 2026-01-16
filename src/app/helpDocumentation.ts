export const HOME_HELP_DOCUMENTATION = `# OGTO Quick Start Guide

> Build, execute, and monitor AI research agents in real time.

---

## What is OGTO?

OGTO (Open Goal-Task Orchestrator) is a **goal-oriented AI agent framework** that executes autonomous web research using the LOOP strategy. Define a goal, and OGTO searches, fetches, summarizes, and synthesizes information until the research objective is satisfied.

---

## Navigation

| Page | Purpose | Key Actions |
|------|---------|-------------|
| 🏠 **Home** | Overview & quick start | Read docs, understand workflow |
| 🤖 **Agents** | Create research agents | Set goal, configure model, launch |
| ⚡ **Runs** | Monitor execution | Watch iterations, view output |
| 🛠️ **Tools** | Tool catalog | Browse available tools |
| ⚙️ **Settings** | Service configuration | Test Ollama, DB, Google API |

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

## 5-Minute Quick Start

### 1. Verify Services (Settings)

\`\`\`bash
# Start required services
ollama serve          # Local LLM
supabase start        # Database
npm run dev           # OGTO
\`\`\`

Go to **Settings** → Test all three connections (✅ required).

### 2. Create an Agent (Agents)

1. Enter a **Goal Title** (e.g., "Latest AI developments 2025")
2. Wait for auto-fill (agent name, role, system prompt)
3. Adjust iterations if needed (default: 2)
4. Click **Create Agent Run**

### 3. Monitor Execution (Runs)

1. Click **Run LOOP** to start
2. Watch iterations execute:
   - Search → Fetch → Summarize → Observe → Reflect
3. View final output when goal satisfied

---

## The LOOP Strategy

A **Run** is a single execution of an agent working toward its goal. Each run consists of one or more **cycles** (iterations).

**What causes a cycle?** After each cycle, the agent reflects: *"Is my goal satisfied?"*  
- **No** → Loop continues with fresh search results (paginated)
- **Yes** → Generate final output and stop

\`\`\`
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
\`\`\`

### Search Pagination

Each cycle uses the **same goal_title** but advances the \`start\` parameter for fresh results:

\`\`\`typescript
// From src/lib/constants.ts
export const MAX_WEB_SEARCH_RESULTS = 10;

// Formula: start = 1 + (cycle × MAX_WEB_SEARCH_RESULTS)
// Cycle 0: start=1  → Results 1–10
// Cycle 1: start=11 → Results 11–20
// Cycle 2: start=21 → Results 21–30
\`\`\`

---

## Key Concepts

| Concept | Definition |
|---------|------------|
| **Agent** | AI entity configured with a goal and model settings |
| **Run** | Single execution of an agent toward its goal |
| **Cycle** | One complete LOOP iteration |
| **Goal Satisfaction** | Agent's assessment that collected info answers the goal |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **LLM** | Ollama (local, gpt-oss:20b) |
| **Database** | Supabase + Drizzle ORM |
| **Search** | Google Custom Search API |
| **State** | Jotai + React Hook Form |
| **Styling** | Tailwind CSS v4 + shadcn/ui |

---

## Project Structure

\`\`\`
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home
│   ├── agents/            # Agent creation
│   ├── runs/              # Execution monitoring
│   ├── tools/             # Tool catalog
│   ├── settings/          # Configuration
│   └── api/               # API routes
│       ├── tools/         # web_search, fetch_url, etc.
│       ├── loop/          # observe, reflect, output
│       └── llm/           # autofill-agent
├── components/            # Feature components
│   ├── agents/
│   ├── runs/
│   ├── tools/
│   ├── settings/
│   └── ui/                # Shared UI components
├── db/                    # Drizzle schema
└── lib/                   # Utilities, Supabase client
\`\`\`

---

## Default Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| Model | gpt-oss:20b | Local Ollama LLM |
| Temperature | 0.1 | Low for factual research |
| Max Iterations | 2 | LOOP cycles |
| Max Steps | 2 | Tool calls |
| Max Tokens | 60,000 | Total budget |
| Max Cost | $3.00 | API costs |
| Timeout | 10 min | Execution limit |

---

## Help Tabs

Each section has detailed documentation:

- **Agents → Help**: Agent creation, fields, autofill, model config
- **Runs → Help**: LOOP phases, limits, pagination, troubleshooting  
- **Tools → Help**: Tool catalog, inputs/outputs, API routes
- **Settings → Help**: Ollama, Supabase, Google Search setup

---

## Common Commands

| Command | Purpose |
|---------|---------|
| \`npm run dev\` | Start development server |
| \`npm run type-check\` | Verify TypeScript |
| \`npm run lint:fix\` | Fix ESLint issues |
| \`npx drizzle-kit push\` | Apply DB migrations |
| \`ollama serve\` | Start Ollama |
| \`supabase start\` | Start local Supabase |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Ollama not connecting | Run \`ollama serve\` |
| Database errors | Run \`supabase start\` |
| Search returns nothing | Check Google API keys in Settings |
| Agent fields empty | Wait for autofill after typing goal |
| Loop stops early | Increase \`budget_max_steps\` |

---

*OGTO v1.0 — Goal-Oriented Research Agent Framework*
`;
