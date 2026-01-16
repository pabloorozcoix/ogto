import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function isUuid(value: string) {
  return /^[0-9a-fA-F-]{36}$/.test(value);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  if (!isUuid(runId)) {
    return NextResponse.json({ ok: false, error: "Invalid runId" }, { status: 400 });
  }

  // Delete dependent rows first (schema does not specify ON DELETE CASCADE).
  // Order matters due to foreign keys:
  // agent_state -> plan_step -> tool_result -> observation -> reflection
  try {
    const { data: planSteps, error: planStepsErr } = await supabase
      .from("plan_step")
      .select("id")
      .eq("agent_state_id", runId);
    if (planStepsErr) throw planStepsErr;

    const planStepIds = (planSteps ?? []).map((p) => p.id).filter(Boolean);

    let toolResultIds: string[] = [];
    if (planStepIds.length > 0) {
      const { data: toolResults, error: toolResultsErr } = await supabase
        .from("tool_result")
        .select("id")
        .in("plan_step_id", planStepIds);
      if (toolResultsErr) throw toolResultsErr;
      toolResultIds = (toolResults ?? []).map((t) => t.id).filter(Boolean);
    }

    let observationIds: string[] = [];
    if (toolResultIds.length > 0) {
      const { data: observations, error: observationsErr } = await supabase
        .from("observation")
        .select("id")
        .in("tool_result_id", toolResultIds);
      if (observationsErr) throw observationsErr;
      observationIds = (observations ?? []).map((o) => o.id).filter(Boolean);
    }

    if (observationIds.length > 0) {
      const { error: reflectionDelErr } = await supabase
        .from("reflection")
        .delete()
        .in("observation_id", observationIds);
      if (reflectionDelErr) throw reflectionDelErr;
    }

    if (toolResultIds.length > 0) {
      const { error: observationDelErr } = await supabase
        .from("observation")
        .delete()
        .in("tool_result_id", toolResultIds);
      if (observationDelErr) throw observationDelErr;
    }

    if (planStepIds.length > 0) {
      const { error: toolResultDelErr } = await supabase
        .from("tool_result")
        .delete()
        .in("plan_step_id", planStepIds);
      if (toolResultDelErr) throw toolResultDelErr;

      const { error: planStepDelErr } = await supabase
        .from("plan_step")
        .delete()
        .eq("agent_state_id", runId);
      if (planStepDelErr) throw planStepDelErr;
    }

    // Direct children of agent_state
    const { error: claimDelErr } = await supabase
      .from("claim_confidence_log")
      .delete()
      .eq("agent_state_id", runId);
    if (claimDelErr) throw claimDelErr;

    const { error: memoryDelErr } = await supabase
      .from("memory")
      .delete()
      .eq("agent_state_id", runId);
    if (memoryDelErr) throw memoryDelErr;

    // Finally, delete the run
    const { error: agentStateDelErr } = await supabase
      .from("agent_state")
      .delete()
      .eq("id", runId);
    if (agentStateDelErr) throw agentStateDelErr;

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : "Failed to delete run";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
