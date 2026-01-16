import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { TAgentRun } from "../types";
import { toast } from "@/components/ui/toast";

export function useRuns() {
  const [runs, setRuns] = useState<TAgentRun[]>([]);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const router = useRouter();

  const fetchRuns = useCallback(async () => {
    const { data, error } = await supabase
      .from("agent_state")
      .select("*, agent_ctx:agent_ctx_id(*)")
      .order("updated_at", { ascending: false });
    console.log("Supabase runs data:", data);
    if (!error && data) setRuns(data);
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const handleSelectRun = useCallback((runId: string) => {
    router.push(`/runs/${runId}`);
  }, [router]);

  const deleteRun = useCallback(async (runId: string) => {
    if (!runId) return;
    if (deletingRunId) return;

    setDeletingRunId(runId);
    const prev = runs;
    setRuns((current) => current.filter((r) => r.id !== runId));

    try {
      const res = await fetch(`/api/runs/${runId}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setRuns(prev);
        toast({
          title: "Failed to delete run",
          description: json?.error || `HTTP ${res.status}`,
          variant: "error",
        });
        return;
      }
      toast({ title: "Run deleted", variant: "success" });
    } catch (err: unknown) {
      setRuns(prev);
      toast({
        title: "Failed to delete run",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setDeletingRunId(null);
    }
  }, [deletingRunId, runs]);

  return { runs, handleSelectRun, deleteRun, deletingRunId };
}
