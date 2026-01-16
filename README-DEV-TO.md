## TL;DR

I built **OGTO** (Open Goal-Task Orchestrator) — an AI research agent that:

- 🔍 Searches Google for your research topic
- 📄 Fetches and reads web pages
- 🧠 Summarizes content using a local LLM (Ollama).
- 🔄 Iterates until it has enough information
- 📝 Generates a comprehensive research report

**No OpenAI API key needed.** Everything runs locally with Ollama and Open Source **Consumer Small Language Models**.

[GitHub Repository](https://github.com/your-username/ogto) | [Live Demo (localhost)](http://localhost:3000)

---

## The Problem

Every week, I spend hours researching topics for work:

- "What are the best practices for AI agent architectures in 2025?"
- "How do RAG and fine-tuning compare for enterprise use cases?"
- "What's the current state of AI regulation in Europe?"

The workflow is always the same:

1. Google search
2. Open 10 tabs
3. Skim articles
4. Take notes
5. Repeat with different keywords
6. Synthesize everything into a report

**This is exactly what AI agents should automate.**

---

## The Solution: OGTO

OGTO implements a simple but effective **LOOP strategy**:

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

Each phase:

| Phase | What Happens |
|-------|--------------|
| **Search** | Queries Google Custom Search API |
| **Fetch** | Downloads and extracts content from URLs |
| **Summarize** | Local LLM condenses each page (~1,200 words) |
| **Observe** | Identifies patterns across all summaries |
| **Reflect** | Asks: "Is my goal satisfied?" |
| **Output** | Generates final markdown report |

---

## The Secret Sauce: Pagination

Here's what makes OGTO actually useful — **it doesn't stop at the first 10 results**.

Each cycle searches for fresh results using the same query but advancing the `start` parameter:

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

This means with 3 iterations, OGTO reads and summarizes content from **30 different sources**.

---

## Tech Stack

I went with a "local-first" architecture:

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **LLM** | Ollama (local, gpt-oss:20b) |
| **Database** | Supabase (local) + Drizzle ORM |
| **Search** | Google Custom Search API |
| **Vector Store** | pgvector (1536 dimensions) |
| **State** | Jotai + React Hook Form |
| **Styling** | Tailwind CSS v4 + shadcn/ui |

### Why Local?

1. **Privacy** — Your research stays on your machine
2. **Cost** — No per-token API charges for LLM
3. **Speed** — No network latency for inference
4. **Control** — Swap models anytime with `ollama pull`

---

## Show Me The Code

### Creating an Agent

```typescript
// POST /api/agents/create-run
const response = await fetch('/api/agents/create-run', {
  method: 'POST',
  body: JSON.stringify({
    agent_name: 'Research Assistant',
    agent_role: 'Senior Research Analyst',
    goal_title: 'Best frameworks for AI agents in 2025',
    goal_system_prompt: 'You are a senior research analyst...',
    model: 'gpt-oss:20b',
    model_temperature: 0.3,
    model_max_iterations: 3,
    budget_max_steps: 50,
    budget_max_tokens: 100000,
  })
});
```

### The LOOP Execution

```typescript
// Simplified from useRunDetail.ts
for (let cycle = 0; cycle < maxIterations; cycle++) {
  // 1. SEARCH with pagination
  const searchStart = 1 + cycle * MAX_WEB_SEARCH_RESULTS;
  const searchResults = await webSearch(goalTitle, searchStart);
  
  // 2. FETCH each URL
  const pages = await Promise.all(
    searchResults.map(r => fetchUrl(r.url))
  );
  
  // 3. SUMMARIZE each page
  const summaries = await Promise.all(
    pages.map(p => getTextSummary(p.content))
  );
  
  // 4. OBSERVE patterns
  const observation = await observe(summaries);
  
  // 5. REFLECT on goal
  const reflection = await reflect(observation, goalTitle);
  
  if (reflection.goal_satisfied) {
    // 6. OUTPUT final report
    return generateOutput(allSummaries);
  }
}
```

### Streaming Summaries with AI SDK

```typescript
// POST /api/tools/get_text_summary
import { streamText } from 'ai';
import { localOllama, OLLAMA_MODEL } from '@/lib/localOllama';

const result = streamText({
  model: localOllama(OLLAMA_MODEL),
  maxOutputTokens: 4096,
  messages: [
    { 
      role: 'system', 
      content: 'You are a concise assistant that returns clean markdown summaries.' 
    },
    { 
      role: 'user', 
      content: `Summarize the following content in markdown...
      
      ${text}` 
    }
  ]
});

// Stream response back to client
for await (const delta of result.textStream) {
  controller.enqueue(JSON.stringify({ event: 'delta', chunk: delta }));
}
```

---

## Database Schema

OGTO tracks everything in PostgreSQL:

```
agent_ctx (1) ──────► (N) agent_state
                          │
                          ├──► (N) memory
                          ├──► (N) plan_step ──► (N) tool_result ──► (N) observation ──► (N) reflection
                          └──► (N) claim_confidence_log
```

Every tool call is logged to `plan_step` → `tool_result`, creating a complete audit trail of the agent's reasoning.

The `memory` table uses **pgvector** for semantic search:

```sql
CREATE TABLE public.memory (
  id uuid PRIMARY KEY,
  agent_state_id uuid REFERENCES public.agent_state(id),
  text text NOT NULL,
  embedding vector(1536),  -- OpenAI-compatible embeddings
  created_at timestamptz DEFAULT now()
);

-- Fast approximate nearest neighbor search
CREATE INDEX idx_memory_embedding 
  ON public.memory 
  USING ivfflat (embedding vector_l2_ops);
```

---

## Getting Started (5 Minutes)

### Prerequisites

- Node.js 18+
- Docker (for Supabase)
- Ollama
- Google Custom Search API credentials

### Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-username/ogto.git
cd ogto
npm install

# 2. Start Ollama
ollama serve
ollama pull gpt-oss:20b

# 3. Start local Supabase
supabase start
npm run db:init

# 4. Configure environment
cp .env.example .env.local
# Add your Google Search API key and Engine ID

# 5. Run!
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create your first research agent.

---

## Use Cases

| Use Case | Example Goal |
|----------|--------------|
| **Tech Research** | "Best frameworks for production-grade AI agents in 2025" |
| **Trend Analysis** | "What's hype vs reality in generative AI adoption 2025" |
| **Competitive Intel** | "How do LangChain, CrewAI, and AutoGen compare" |
| **Market Research** | "Enterprise AI spending trends 2025-2027" |
| **Technical Deep Dive** | "RAG vs fine-tuning: when to use each approach" |
| **Industry Analysis** | "AI regulation landscape in EU, US, and Asia 2025" |

> 💡 **Pro tip:** Specific goals work best. "AI trends" is too vague; "Enterprise AI adoption trends in healthcare 2025" yields focused research.

---

## What I Learned

### 1. Local LLMs Are Production-Ready

With models like `gpt-oss:20b` running on Ollama, you get GPT-3.5-level performance without API costs. The latency is comparable to cloud APIs on M-series Macs.

### 2. The LOOP Pattern Is Surprisingly Effective

Most AI agent frameworks overcomplicate things. A simple loop of Search → Process → Reflect handles 90% of research tasks.

### 3. Pagination Is Everything

The difference between a toy demo and a useful tool is often just "do more iterations with fresh data."

### 4. Streaming UX Matters

Watching the agent work in real-time (streaming summaries, updating progress) makes the experience feel responsive even when processing takes minutes.

---

## What's Next

- [ ] **RAG retrieval** from accumulated memory
- [ ] **Multi-agent workflows** (parallel research tracks)
- [ ] **Citation graph** showing source relationships
- [ ] **Export to Notion/Obsidian**
- [ ] **Voice input** for goal creation

---

## Try It Yourself

The entire project is open source:

🔗 **GitHub:** [github.com/your-username/ogto](https://github.com/your-username/ogto)

If you find it useful:
- ⭐ Star the repo
- 🐛 Report issues
- 🤝 PRs welcome!

---

## Discussion

Have you built similar research automation tools? What patterns worked for you?

I'm especially curious about:
- How others handle "goal satisfaction" detection
- Strategies for avoiding duplicate/low-quality sources
- Ideas for multi-agent coordination

Drop a comment below! 👇

---

*Built with ❤️ using Next.js 15, Ollama, Supabase, and way too much coffee.*
