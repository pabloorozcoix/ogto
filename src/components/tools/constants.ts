
import type { TToolGroup, TToolInputOutput } from "./types";

export const TOOLS: TToolGroup[] = [
  {
    group: "Web Tools",
    tools: [
      {
        name: "web_search",
        type: "web",
        desc: "Performs Google Custom Search API queries",
        tags: "search, web, google",
        shortDesc: "Performs Google Custom Search API queries",
        longDesc:
          "Uses Google Custom Search API to fetch web results. Requires API key and Engine ID. Returns structured results or error messages. Results include title, url, snippet, and source. Handles missing credentials and API errors gracefully. Pagination is controlled via the start parameter.",
        when: "Every LOOP cycle starts with a web search using the goal_title as the query",
        input: {
          q: { type: "string", required: true, desc: "Search query string (usually goal_title)" },
          start: { type: "number", required: false, desc: "Pagination start index (default: 1). Formula: 1 + (cycle × 10)" },
          agent_state_id: { type: "string", required: false, desc: "Run ID for database persistence" },
          rationale: { type: "string", required: false, desc: "Reason for this search (logged to plan_step)" },
        } satisfies TToolInputOutput,
        output: {
          success: { type: "boolean", desc: "True if search succeeded" },
          results: { type: "array", desc: "Array of { title, url, snippet, source: 'google' }" },
          message: { type: "string", desc: "Error or status message" },
          plan_step_id: { type: "string", desc: "Database ID of the plan_step record" },
          tool_result_id: { type: "string", desc: "Database ID of the tool_result record" },
        } satisfies TToolInputOutput,
      },
      {
        name: "fetch_url",
        type: "web",
        desc: "Fetches and extracts clean content from web URLs",
        tags: "web, fetch, content",
        shortDesc: "Fetches and extracts clean content from web URLs",
        longDesc:
          "Fetches web pages and converts HTML to clean markdown using intelligent content extraction. Handles complex web pages with proper timeout management. Features semantic HTML selectors and comprehensive error recovery. Persists results to database when agent_state_id is provided.",
        when: "After web_search returns URLs, fetch_url retrieves full content from each",
        input: {
          url: { type: "string", required: true, desc: "Web page URL to fetch" },
          agent_state_id: { type: "string", required: false, desc: "Run ID for database persistence" },
          rationale: { type: "string", required: false, desc: "Reason for this fetch (logged to plan_step)" },
        } satisfies TToolInputOutput,
        output: {
          success: { type: "boolean", desc: "True if fetch succeeded" },
          title: { type: "string", desc: "Extracted page title" },
          content: { type: "string", desc: "Markdown content extracted from HTML" },
          url: { type: "string", desc: "Source URL (echoed back)" },
          fetchedAt: { type: "string", desc: "ISO timestamp of fetch" },
          plan_step_id: { type: "string", desc: "Database ID of the plan_step record" },
          tool_result_id: { type: "string", desc: "Database ID of the tool_result record" },
        } satisfies TToolInputOutput,
      },
      {
        name: "get_hyperlinks",
        type: "web",
        desc: "Extracts all hyperlinks from webpages with filtering capabilities",
        tags: "web, scraping, links",
        shortDesc: "Extracts all hyperlinks from webpages with filtering capabilities",
        longDesc:
          "Link extraction tool that fetches web pages and extracts all hyperlinks with anchor text. Features domain filtering, duplicate removal, and relative-to-absolute URL conversion. Useful for discovering related content sources.",
        when: "When agents need to discover related links from web pages (not used in main LOOP)",
        input: {
          url: { type: "string", required: true, desc: "Web page URL to extract links from" },
          maxLinks: { type: "number", required: false, desc: "Maximum links to return (1-100, default: 100)" },
          filterDomains: { type: "array", required: false, desc: "Only include links from these domains" },
          excludeDomains: { type: "array", required: false, desc: "Exclude links from these domains" },
        } satisfies TToolInputOutput,
        output: {
          url: { type: "string", desc: "Source URL (echoed back)" },
          title: { type: "string", desc: "Page title" },
          links: { type: "array", desc: "Array of { text, href, title }" },
          totalLinks: { type: "number", desc: "Total number of links found" },
          fetchedAt: { type: "string", desc: "ISO timestamp of extraction" },
        } satisfies TToolInputOutput,
      },
      {
        name: "get_text_summary",
        type: "web",
        desc: "Generates AI-powered summaries of text content using local Ollama",
        tags: "web, summary, llm, streaming",
        shortDesc: "Generates AI-powered summaries using local Ollama LLM",
        longDesc:
          "Streams AI-powered summaries from local Ollama (gpt-oss:20b). Takes raw text (usually from fetch_url), generates ~1,200 word markdown summaries focusing on key facts, entities, metrics, and actionable insights. Returns Server-Sent Events (SSE) stream with delta chunks.",
        when: "After fetch_url retrieves content, get_text_summary condenses it for the Observe phase",
        input: {
          text: { type: "string", required: true, desc: "Raw text content to summarize" },
          agent_state_id: { type: "string", required: false, desc: "Run ID for database persistence" },
          rationale: { type: "string", required: false, desc: "Reason for summary (logged to plan_step)" },
        } satisfies TToolInputOutput,
        output: {
          event: { type: "string", desc: "SSE event type: 'start' | 'delta' | 'done' | 'error'" },
          chunk: { type: "string", desc: "Streamed text chunk (on 'delta' events)" },
          plan_step_id: { type: "string", desc: "Database ID of the plan_step record (on 'start')" },
          tool_result_id: { type: "string", desc: "Database ID of the tool_result record (on 'done')" },
          summary: { type: "string", desc: "Complete summary text (on 'done')" },
          message: { type: "string", desc: "Error message (on 'error')" },
        } satisfies TToolInputOutput,
      },
    ],
  },
  {
    group: "Agent Management Tools",
    tools: [
      {
        name: "start_agent",
        type: "agent",
        desc: "Creates new sub-agents with specific configurations",
        tags: "agent, start, orchestration",
        shortDesc: "Creates new sub-agents with specific configurations",
        longDesc:
          "Creates child agents for specialized tasks. Returns a new agent ID and status. Enables hierarchical multi-agent workflows. Currently returns stub response (not used in main LOOP).",
        when: "When creating sub-agents for specialized tasks or parallel processing",
        input: {
          name: { type: "string", required: true, desc: "Name for the new agent" },
          initialGoal: { type: "string", required: true, desc: "Goal/task for the agent to accomplish" },
          description: { type: "string", required: false, desc: "Description of the agent's purpose" },
          model: { type: "string", required: false, desc: "LLM model to use (default: gpt-oss:20b)" },
          temperature: { type: "number", required: false, desc: "Model temperature (0-1)" },
          maxTokens: { type: "number", required: false, desc: "Max tokens per response" },
          maxIterations: { type: "number", required: false, desc: "Max LOOP iterations" },
          tools: { type: "array", required: false, desc: "Array of tool names to enable" },
          parentId: { type: "string", required: false, desc: "Parent agent ID for hierarchy" },
        } satisfies TToolInputOutput,
        output: {
          AgentId: { type: "string", desc: "Unique ID of the created agent" },
          status: { type: "string", desc: "Agent status: 'started' | 'error'" },
          message: { type: "string", desc: "Confirmation or error message" },
        } satisfies TToolInputOutput,
      },
      {
        name: "list_agents",
        type: "agent",
        desc: "Lists all active agents with filtering capabilities",
        tags: "agent, list, management",
        shortDesc: "Lists all active agents with filtering capabilities",
        longDesc:
          "Agent discovery and monitoring tool that provides visibility into the agent ecosystem. Features hierarchical filtering by parent relationships, status-based filtering, child count tracking, and last activity timestamps. Not yet implemented.",
        when: "When agents need to discover available sub-agents or check system status",
        input: {
          parentId: { type: "string", required: false, desc: "Filter by parent agent ID" },
          status: { type: "string", required: false, desc: "Filter by status: 'running' | 'completed' | 'error'" },
        } satisfies TToolInputOutput,
        output: {
          agents: { type: "array", desc: "Array of { id, name, status, parentId, childCount, lastActivity }" },
          total: { type: "number", desc: "Total number of agents matching filter" },
        } satisfies TToolInputOutput,
      },
      {
        name: "message_agent",
        type: "agent",
        desc: "Sends messages/instructions to specific agents",
        tags: "agent, message, communication",
        shortDesc: "Sends messages/instructions to specific agents",
        longDesc:
          "Inter-agent communication system enabling message passing between agents. Features typed messaging (instruction, query, result, error), metadata support, and message history tracking. Not yet implemented.",
        when: "When agents need to communicate with other agents in the system",
        input: {
          agentId: { type: "string", required: true, desc: "Target agent ID" },
          content: { type: "string", required: true, desc: "Message content" },
          type: { type: "string", required: false, desc: "Message type: 'instruction' | 'query' | 'result' | 'error'" },
          metadata: { type: "object", required: false, desc: "Additional metadata object" },
        } satisfies TToolInputOutput,
        output: {
          success: { type: "boolean", desc: "True if message was delivered" },
          message: { type: "string", desc: "Confirmation or error message" },
        } satisfies TToolInputOutput,
      },
      {
        name: "delete_agent",
        type: "agent",
        desc: "Deletes agents and their entire child hierarchy",
        tags: "agent, delete, cleanup",
        shortDesc: "Deletes agents and their entire child hierarchy",
        longDesc:
          "Comprehensive agent cleanup tool with cascading deletion. Features safety checks preventing deletion of running agents unless forced. Maintains system integrity by properly cleaning up relationships. Not yet implemented.",
        when: "When cleaning up completed agents or stopping failed processes",
        input: {
          agentId: { type: "string", required: true, desc: "Agent ID to delete" },
          force: { type: "boolean", required: false, desc: "Force delete even if running (default: false)" },
        } satisfies TToolInputOutput,
        output: {
          success: { type: "boolean", desc: "True if deletion succeeded" },
          message: { type: "string", desc: "Confirmation or error message" },
          deletedCount: { type: "number", desc: "Number of agents deleted (including children)" },
        } satisfies TToolInputOutput,
      },
    ],
  },
  {
    group: "System Tools",
    tools: [
      {
        name: "task_complete",
        type: "system",
        desc: "Marks tasks as completed and closes agents",
        tags: "task, complete, lifecycle",
        shortDesc: "Marks tasks as completed and closes agents",
        longDesc:
          "Task lifecycle management tool for reporting completion or errors. Features result data storage, error logging, and status tracking. Integrates with agent management for proper workflow completion. Not yet implemented.",
        when: "When agents finish their assigned tasks and need to report completion",
        input: {
          agentId: { type: "string", required: true, desc: "Agent ID reporting completion" },
          taskId: { type: "string", required: true, desc: "Task ID being completed" },
          result: { type: "object", required: false, desc: "Result data object (on success)" },
          error: { type: "string", required: false, desc: "Error message (on failure)" },
        } satisfies TToolInputOutput,
        output: {
          success: { type: "boolean", desc: "True if completion was recorded" },
          message: { type: "string", desc: "Confirmation message" },
        } satisfies TToolInputOutput,
      },
    ],
  },
];
