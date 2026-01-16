import { ToolsComponent } from "@/components/tools";

export default function ToolsPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold mb-4">Tools</h1>
      <p className="text-neutral-400 mb-8">
        Explore and manage all available tools for web search, content extraction, summarization, agent orchestration, and system automation. Use these tools to search the web, fetch and analyze content, manage and communicate with agents, and automate system tasks.
      </p>
      <ToolsComponent />
    </section>
  );
}
