export const TOOLS_HELP_DOCUMENTATION = `# OGTO Tools Reference

> Complete catalog of all available tools, their purposes, and how they integrate with the LOOP strategy.

---

## Overview

OGTO provides a collection of specialized tools that agents use during research execution. Tools are categorized by function and can be active (used in the run loop) or available (implemented but not currently invoked).

### Tool Categories

| Category | Purpose | Tools |
|----------|---------|-------|
| **Web Tools** | Internet research and content extraction | 4 tools |
| **Agent Management** | Sub-agent orchestration | 4 tools |
| **System Tools** | Task lifecycle management | 1 tool |

### Tool Status Legend

| Style | Meaning |
|-------|---------|
| **Solid border, bright background** | Active in run loop |
| **Solid border, dim background** | Implemented but not in loop |
| **Dashed border, darkest background** | Not yet implemented |

---

## Web Tools

Web tools enable agents to search, fetch, and analyze content from the internet.

### web_search 🟢 Active

**Purpose:** Performs Google Custom Search API queries

\`\`\`
Run Loop Phase: SEARCH
API Route: /api/tools/web_search
\`\`\`

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| \`q\` | string | ✅ | Search query string |
| \`start\` | number | ❌ | Pagination start index (default: 1) |

| Output | Type | Description |
|--------|------|-------------|
| \`success\` | boolean | True if search succeeded |
| \`results\` | array | Array of \`{ title, url, snippet, source }\` |
| \`message\` | string | Error or status message |

**When Used:** Every LOOP cycle starts with a web search using the goal_title as the query.

**Pagination Formula:**
\`\`\`typescript
// From src/lib/constants.ts
export const MAX_WEB_SEARCH_RESULTS = 10;

// start = 1 + (cycle × MAX_WEB_SEARCH_RESULTS)
// Cycle 0: start=1  → Results 1–10
// Cycle 1: start=11 → Results 11–20
// Cycle 2: start=21 → Results 21–30
\`\`\`

---

### fetch_url 🟢 Active

**Purpose:** Fetches and extracts clean content from web URLs

\`\`\`
Run Loop Phase: FETCH
API Route: /api/tools/fetch_url
\`\`\`

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| \`url\` | string | ✅ | Web page URL to fetch |

| Output | Type | Description |
|--------|------|-------------|
| \`title\` | string | Page title |
| \`content\` | string | Markdown content |
| \`url\` | string | Source URL |
| \`fetchedAt\` | string | Timestamp |
| \`summary\` | string | Content summary |

**Features:**
- External Cloudflare Worker API with JSDOM fallback
- Converts HTML to clean markdown
- Intelligent content selection using semantic selectors
- Comprehensive error recovery

**When Used:** After web_search, each result URL is fetched in parallel.

---

### get_text_summary 🟢 Active

**Purpose:** Generates AI-powered summaries focused on specific questions

\`\`\`
Run Loop Phase: SUMMARIZE
API Route: /api/tools/get_text_summary
\`\`\`

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| \`url\` | string | ✅ | Web page URL |
| \`question\` | string | ✅ | Question to focus summary |
| \`maxLength\` | number | ❌ | Max summary length (50-2000 words) |
| \`includeQuotes\` | boolean | ❌ | Include quotes in summary |
| \`model\` | string | ❌ | AI model selection |

| Output | Type | Description |
|--------|------|-------------|
| \`summary\` | string | Generated summary |
| \`keyPoints\` | array | Key points extracted |
| \`quotes\` | array | Relevant quotes with context |
| \`confidence\` | number | Confidence score |
| \`wordCount\` | number | Summary word count |

**Features:**
- Multi-chunk processing for large documents
- Confidence scoring per summary
- Source attribution preservation
- Optimized for research workflows

**When Used:** After fetching, each page's content is summarized using the goal_title as the question.

---

### get_hyperlinks ⚪ Implemented

**Purpose:** Extracts all hyperlinks from webpages with filtering

\`\`\`
API Route: /api/tools/get_hyperlinks
Status: Implemented, not in run loop
\`\`\`

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| \`url\` | string | ✅ | Web page URL |
| \`maxLinks\` | number | ❌ | Maximum links (1-100) |
| \`filterDomains\` | array | ❌ | Domains to include |
| \`excludeDomains\` | array | ❌ | Domains to exclude |

| Output | Type | Description |
|--------|------|-------------|
| \`links\` | array | Links with text/href/title |
| \`totalLinks\` | number | Total link count |
| \`title\` | string | Page title |

**Use Case:** Web crawling workflows, discovering related content sources.

---

## Agent Management Tools

Tools for orchestrating multi-agent workflows and hierarchical agent structures.

### start_agent ⚪ Implemented

**Purpose:** Creates new ephemeral sub-agents with specific configurations

\`\`\`
API Route: /api/tools/start_agent
Status: Implemented, not in run loop
\`\`\`

| Input | Type | Description |
|-------|------|-------------|
| \`name\` | string | Agent name |
| \`description\` | string | Agent description |
| \`model\` | string | LLM model to use |
| \`temperature\` | number | Model temperature |
| \`maxTokens\` | number | Max output tokens |
| \`maxIterations\` | number | Max LOOP iterations |
| \`tools\` | array | Enabled tools |
| \`parentId\` | string | Parent agent ID |
| \`initialGoal\` | string | Starting goal |

| Output | Type | Description |
|--------|------|-------------|
| \`agentId\` | string | New agent's UUID |
| \`status\` | string | Agent status |
| \`success\` | boolean | Creation result |

**Use Case:** Creating specialized sub-agents for parallel research tracks.

---

### list_agents ⬜ Not Implemented

**Purpose:** Lists all active agents with filtering capabilities

| Input | Type | Description |
|-------|------|-------------|
| \`parentId\` | string | Filter by parent |
| \`status\` | string | Status filter |

| Output | Type | Description |
|--------|------|-------------|
| \`agents\` | array | Agent list with metadata |
| \`total\` | number | Total count |

**Use Case:** Agent discovery and system monitoring.

---

### message_agent ⬜ Not Implemented

**Purpose:** Sends messages/instructions to specific agents

| Input | Type | Description |
|-------|------|-------------|
| \`agentId\` | string | Target agent |
| \`content\` | string | Message content |
| \`type\` | string | instruction/query/result/error |
| \`metadata\` | object | Additional data |

**Use Case:** Inter-agent communication in multi-agent workflows.

---

### delete_agent ⬜ Not Implemented

**Purpose:** Deletes agents and their entire child hierarchy

| Input | Type | Description |
|-------|------|-------------|
| \`agentId\` | string | Agent to delete |
| \`force\` | boolean | Force delete running agents |

| Output | Type | Description |
|--------|------|-------------|
| \`deletedCount\` | number | Agents deleted |
| \`success\` | boolean | Operation result |

**Use Case:** Cleanup of completed or failed agent processes.

---

## System Tools

Tools for task lifecycle management and completion reporting.

### task_complete ⬜ Not Implemented

**Purpose:** Marks tasks as completed and closes agents

| Input | Type | Description |
|-------|------|-------------|
| \`agentId\` | string | Agent ID |
| \`taskId\` | string | Task ID |
| \`result\` | object | Result data |
| \`error\` | string | Error message |

**Use Case:** Proper task completion reporting and workflow termination.

---

## Run Loop Tool Flow

The LOOP strategy uses three tools in sequence:

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│  LOOP ITERATION                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. web_search ─────────────────────────────────────────   │
│     ├─ Input: goal_title + start (pagination)              │
│     └─ Output: Array of { title, url, snippet }            │
│                         │                                   │
│                         ▼                                   │
│  2. fetch_url (parallel) ───────────────────────────────   │
│     ├─ Input: Each URL from search results                 │
│     └─ Output: { title, content, url }                     │
│                         │                                   │
│                         ▼                                   │
│  3. get_text_summary (parallel) ────────────────────────   │
│     ├─ Input: URL + goal_title as question                 │
│     └─ Output: { summary, keyPoints, confidence }          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### Tool Execution Order

| Phase | Tool | Parallelism | Description |
|-------|------|-------------|-------------|
| Search | \`web_search\` | Single | One query per iteration |
| Fetch | \`fetch_url\` | Parallel | All URLs simultaneously |
| Summarize | \`get_text_summary\` | Parallel | All contents simultaneously |

---

## Tool Types

### Type Badges

| Type | Color | Description |
|------|-------|-------------|
| \`web\` | Blue | Internet/content tools |
| \`agent\` | Purple | Agent management |
| \`system\` | Gray | System operations |

### Tool Modal

Click any tool in the Catalog to view:
- Full description and purpose
- Input/output specifications
- When to use guidance
- Tags and categorization

---

## Adding New Tools

### Tool Definition Structure

\`\`\`typescript
{
  name: "tool_name",
  type: "web" | "agent" | "system",
  desc: "Short description",
  tags: "comma, separated, tags",
  shortDesc: "Brief description",
  longDesc: "Detailed description...",
  when: "When to use this tool",
  input: {
    param: { type: "string", required: true, desc: "..." }
  },
  output: {
    field: { type: "string", desc: "..." }
  }
}
\`\`\`

### Implementation Checklist

1. Add tool definition to \`constants.ts\`
2. Create API route in \`/api/tools/[tool_name]/route.ts\`
3. Add to \`IMPLEMENTED_TOOLS\` set
4. If used in loop, add to \`RUN_LOOP_TOOLS\` set
5. Create hook in \`RunDetail/hooks/\` if needed

---

## API Routes

| Tool | Route | Method |
|------|-------|--------|
| web_search | \`/api/tools/web_search\` | POST |
| fetch_url | \`/api/tools/fetch_url\` | POST |
| get_hyperlinks | \`/api/tools/get_hyperlinks\` | POST |
| get_text_summary | \`/api/tools/get_text_summary\` | POST |
| start_agent | \`/api/tools/start_agent\` | POST |

---

## Best Practices

1. **Check tool status** — Only active tools affect run execution
2. **Review inputs** — Ensure required parameters are understood
3. **Handle errors** — Tools return structured error messages
4. **Monitor performance** — Each tool call counts as a step
5. **Respect limits** — Tool calls consume budget (steps, tokens, cost)

---

*OGTO v1.0 — Tools Reference*
`;
