import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("[API] Received agent run creation request:", data);
    
    const { data: agent, error: agentError } = await supabase
      .from("agent_ctx")
      .insert({
        goal_title: data.goal_title,
        goal_system_prompt: data.goal_system_prompt,
        model: data.model,
        model_temperature: data.model_temperature,
        model_output_format: data.model_output_format,
        model_max_tokens: data.model_max_tokens,
        model_max_iterations: data.model_max_iterations,
        budget_max_cost: data.budget_max_cost,
        budget_max_tokens: data.budget_max_tokens,
        budget_max_execution_time: data.budget_max_execution_time,
        budget_max_steps: data.budget_max_steps,
        agent_name: data.agent_name,
        agent_role: data.agent_role,
      })
      .select()
      .single();
    console.log("[API] Agent insert result:", { agent, agentError });
    if (agentError || !agent || !agent.id) {
      console.error("[API] Agent creation failed:", agentError);
      return NextResponse.json({ error: agentError?.message || "Agent creation failed" }, { status: 500 });
    }
    
    const { data: run, error: runError } = await supabase
      .from("agent_state")
      .insert({
        agent_ctx_id: agent.id,
        iterations_completed: 0,
        steps_used: 0,
        tokens_used: 0,
        cost_used: 0,
        elapsed_ms: 0,
        summary: "Run started.",
        memory_refs: [],
      })
      .select()
      .single();
    console.log("[API] Run insert result:", { run, runError });
    if (runError || !run || !run.id) {
      console.error("[API] Run creation failed:", runError);
      return NextResponse.json({ error: runError?.message || "Run creation failed" }, { status: 500 });
    }
    return NextResponse.json({ agent, run });
  } catch (err) {
    console.error("[API] Unexpected error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
