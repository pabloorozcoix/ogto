export const SETTINGS_HELP_DOCUMENTATION = `# OGTO Settings Guide

> Complete reference for configuring and testing OGTO's external service connections.

---

## Overview

The **Settings** page provides diagnostic tools to verify that all external services required by OGTO are properly configured and accessible. Before running your first agent, ensure all connection tests pass.

### Service Dependencies

| Service | Purpose | Required |
|---------|---------|----------|
| **Ollama** | Local LLM inference | ✅ Yes |
| **Supabase** | Database persistence | ✅ Yes |
| **Google Custom Search** | Web research | ✅ Yes |

---

## Ollama Test

### What It Tests

The Ollama Test verifies your local LLM server is running and accessible via the AI SDK.

\`\`\`
Connection Flow:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │ ──▶ │  API Route   │ ──▶ │   Ollama     │
│              │     │ /api/ai/     │     │ localhost:   │
│              │ ◀── │ ollama-test  │ ◀── │   11434      │
└──────────────┘     └──────────────┘     └──────────────┘
\`\`\`

### Configuration

Ollama is configured in \`src/lib/localOllama.ts\`:

\`\`\`typescript
export const localOllama = createOpenAICompatible({
  name: 'ollama',
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'not-required',
});

export const OLLAMA_MODEL = 'gpt-oss:20b';
\`\`\`

### Model Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Base URL** | \`http://localhost:11434/v1\` | Ollama's OpenAI-compatible endpoint |
| **API Key** | \`not-required\` | Ollama doesn't need authentication |
| **Model** | \`gpt-oss:20b\` | Default model for all LLM operations |

### How to Use

1. Click **"Test Ollama Connection"**
2. The test sends a simple prompt to your local Ollama server
3. **Success**: Green text shows the model's response
4. **Failure**: Red error message indicates the issue

### Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| \`Connection refused\` | Ollama not running | Start Ollama: \`ollama serve\` |
| \`Model not found\` | Model not pulled | Pull model: \`ollama pull gpt-oss:20b\` |
| \`Timeout\` | Slow first load | Wait for model to load into memory |
| \`ECONNREFUSED\` | Wrong port/host | Check Ollama is on port 11434 |

### Prerequisites

1. **Install Ollama**: [https://ollama.ai](https://ollama.ai)
2. **Pull the model**:
   \`\`\`bash
   ollama pull gpt-oss:20b
   \`\`\`
3. **Start the server**:
   \`\`\`bash
   ollama serve
   \`\`\`
4. **Verify** it's running:
   \`\`\`bash
   curl http://localhost:11434/api/tags
   \`\`\`

---

## Supabase Database Test

### What It Tests

The Database Test verifies three critical components:

| Check | Description |
|-------|-------------|
| **Environment Configuration** | Required env vars are set |
| **Supabase Connection** | Can connect to PostgreSQL |
| **Vector Store (pgvector)** | pgvector extension works |

### Configuration

Database connection is configured via environment variables in \`.env.local\`:

\`\`\`bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Direct Postgres (for Drizzle)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
\`\`\`

### Test Results

Each check shows:
- ✅ **Pass** — Component working correctly
- ❌ **Fail** — Component needs attention
- **Timing** — Response time in milliseconds

### Environment Check

Verifies these variables are defined:
- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
- \`DATABASE_URL\`

### Supabase Connection Check

Tests the Supabase JS client can:
1. Connect to the Supabase instance
2. Execute a basic query
3. Return data successfully

### pgvector Check

Verifies the PostgreSQL pgvector extension:
1. Extension is installed
2. Vector operations work
3. Similarity search is functional

### Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| Environment ❌ | Missing env vars | Add to \`.env.local\` |
| Supabase ❌ | DB not running | Start: \`supabase start\` |
| pgvector ❌ | Extension missing | Enable in Supabase dashboard |
| Slow timing | Cold start | Normal on first query |

### Local Supabase Setup

1. **Install Supabase CLI**:
   \`\`\`bash
   npm install -g supabase
   \`\`\`

2. **Initialize project**:
   \`\`\`bash
   supabase init
   \`\`\`

3. **Start local services**:
   \`\`\`bash
   supabase start
   \`\`\`

4. **Apply migrations**:
   \`\`\`bash
   npx drizzle-kit push
   \`\`\`

5. **Get credentials** (shown after \`supabase start\`):
   - API URL: \`http://127.0.0.1:54321\`
   - Anon Key: Copy to \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
   - DB URL: \`postgresql://postgres:postgres@127.0.0.1:54322/postgres\`

---

## Google Search Config

### What It Tests

The Google Search Test verifies your Custom Search API configuration by executing a real search query.

\`\`\`
Search Flow:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │ ──▶ │  API Route   │ ──▶ │   Google     │
│  (query)     │     │  /api/tools/ │     │   Custom     │
│              │ ◀── │  web_search  │ ◀── │   Search API │
└──────────────┘     └──────────────┘     └──────────────┘
\`\`\`

### Configuration

Google Search requires two environment variables in \`.env.local\`:

\`\`\`bash
# Google Custom Search API
GOOGLE_API_KEY=your-google-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
\`\`\`

### How to Use

1. **Enter a search query** in the input field
2. Click **"Search Google"**
3. **Success**: JSON results display with titles, URLs, snippets
4. **Failure**: Red error message explains the issue

### Test Results Format

Successful searches return a JSON array:

\`\`\`json
[
  {
    "title": "Page Title",
    "link": "https://example.com/page",
    "snippet": "Description text from the page..."
  },
  ...
]
\`\`\`

### Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| \`401 Unauthorized\` | Invalid API key | Check \`GOOGLE_API_KEY\` |
| \`400 Bad Request\` | Invalid engine ID | Check \`GOOGLE_SEARCH_ENGINE_ID\` |
| \`403 Forbidden\` | API not enabled | Enable in Google Cloud Console |
| \`429 Too Many Requests\` | Quota exceeded | Wait or upgrade quota |
| Empty results | Query too specific | Try broader search terms |

### Setting Up Google Custom Search

#### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Note your project ID

#### Step 2: Enable Custom Search API

1. Navigate to **APIs & Services** → **Library**
2. Search for "Custom Search API"
3. Click **Enable**

#### Step 3: Create API Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the key to \`GOOGLE_API_KEY\`
4. (Optional) Restrict the key to Custom Search API only

#### Step 4: Create a Custom Search Engine

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com)
2. Click **Add** to create a new engine
3. Configure:
   - **Sites to search**: Select "Search the entire web"
   - **Search engine name**: Any name (e.g., "OGTO Research")
4. Click **Create**
5. Copy the **Search engine ID** to \`GOOGLE_SEARCH_ENGINE_ID\`

#### Step 5: Verify Configuration

After setting up, the test should return JSON results for any query.

### API Quotas & Costs

| Tier | Daily Queries | Cost |
|------|---------------|------|
| Free | 100/day | $0 |
| Paid | 10,000/day | $5 per 1,000 queries |

> 💡 **Tip:** The free tier (100 queries/day) is sufficient for development and light testing.

---

## Environment Variables Summary

### Required Variables

| Variable | Service | Example |
|----------|---------|---------|
| \`NEXT_PUBLIC_SUPABASE_URL\` | Supabase | \`http://127.0.0.1:54321\` |
| \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` | Supabase | \`eyJhbGci...\` |
| \`DATABASE_URL\` | Drizzle/Postgres | \`postgresql://...\` |
| \`GOOGLE_API_KEY\` | Google Search | \`AIzaSy...\` |
| \`GOOGLE_SEARCH_ENGINE_ID\` | Google Search | \`a1b2c3...\` |

### Optional Variables

| Variable | Service | Default |
|----------|---------|---------|
| \`SUPABASE_SERVICE_ROLE_KEY\` | Supabase Admin | — |

### Example .env.local

\`\`\`bash
# Supabase (Local)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Google Custom Search
GOOGLE_API_KEY=AIzaSyD...
GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5f6...
\`\`\`

---

## Verification Checklist

Before running your first agent, verify all tests pass:

- [ ] **Ollama Test** — Green response text
- [ ] **Database Test** — All three checks ✅
- [ ] **Google Search** — Returns JSON results

### All Tests Passing?

You're ready to:
1. Go to **Agents** page
2. Create a new agent with a goal
3. Run your first LOOP cycle!

---

## Quick Reference

### Start All Services

\`\`\`bash
# Terminal 1: Ollama
ollama serve

# Terminal 2: Supabase
supabase start

# Terminal 3: OGTO
npm run dev
\`\`\`

### Common Commands

| Command | Purpose |
|---------|---------|
| \`ollama serve\` | Start Ollama server |
| \`ollama pull gpt-oss:20b\` | Download default model |
| \`ollama list\` | List installed models |
| \`supabase start\` | Start local Supabase |
| \`supabase stop\` | Stop local Supabase |
| \`supabase status\` | Check Supabase status |
| \`npx drizzle-kit push\` | Apply DB migrations |

---

*OGTO v1.0 — Settings Configuration Reference*
`;
