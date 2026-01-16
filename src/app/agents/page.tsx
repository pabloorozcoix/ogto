import { AgentsComponent } from "@/components/agents";

export default function AgentsPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold mb-4">Agents</h1>
      <p className="text-neutral-400 mb-8">Manage your AI agents here.</p>
      <AgentsComponent />
    </section>
  );
}
