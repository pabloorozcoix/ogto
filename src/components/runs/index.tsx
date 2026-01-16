import React from "react";
import { useRuns } from "./hooks/useRuns";
import { DateTime } from "@/components/ui/DateTime";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function RunsComponent() {
  const { runs, handleSelectRun, deleteRun, deletingRunId } = useRuns();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [selectedRunId, setSelectedRunId] = React.useState<string | null>(null);

  const openDeleteConfirm = (runId: string) => {
    setSelectedRunId(runId);
    setConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    if (deletingRunId) return;
    setConfirmOpen(false);
    setSelectedRunId(null);
  };

  const confirmDelete = async () => {
    if (!selectedRunId) return;
    await deleteRun(selectedRunId);
    setConfirmOpen(false);
    setSelectedRunId(null);
  };

  const selectedRun = selectedRunId ? runs.find((r) => r.id === selectedRunId) : null;
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-400">Agent Runs</h1>
      <div className="grid gap-4">
        {runs.map(run => (
          <div key={run.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 shadow cursor-pointer hover:border-blue-500" onClick={() => handleSelectRun(run.id)}>
            <div className="flex items-start justify-between gap-4">
              <div className="font-bold text-lg text-blue-300 mb-2">{run.agent_ctx?.goal_title || "Untitled Agent"}</div>
              <button
                className="text-xs px-3 py-2 rounded-md border border-red-800 bg-red-950 text-red-200 hover:bg-red-900 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openDeleteConfirm(run.id);
                }}
                disabled={!!deletingRunId}
                aria-label={`Delete run ${run.id}`}
              >
                Delete
              </button>
            </div>
            <div className="text-neutral-400 text-sm mb-1">Run ID: {run.id}</div>
            <div className="flex gap-4 text-xs text-neutral-500 mb-1">
              <span>Iterations: {run.iterations_completed}</span>
              <span>Steps: {run.steps_used}</span>
              <span>Tokens: {run.tokens_used}</span>
              <span>Cost: ${run.cost_used}</span>
            </div>
            <div className="text-xs text-neutral-500">
              Last updated: <DateTime value={run.updated_at} />
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this run?"
        description={
          selectedRun
            ? `This will permanently delete “${selectedRun.agent_ctx?.goal_title || "Untitled Agent"}” and its related data.`
            : "This will permanently delete the run and its related data."
        }
        confirmLabel={deletingRunId ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        destructive
        confirmDisabled={!!deletingRunId}
        onCancel={closeDeleteConfirm}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
