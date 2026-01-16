import { NextResponse } from "next/server";
import { extractMarkdownFromHtml } from "./_extractMarkdown";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  console.log("Fetch URL Tool: Received POST request");
  try {
    const { url, agent_state_id, rationale } = await req.json();
    console.log("Fetch URL Tool: Parsed request body:", { url, agent_state_id });
    if (!url || typeof url !== "string") {
      console.error("Fetch URL Tool: Missing or invalid URL");
      return NextResponse.json({ success: false, message: "Fetch URL Tool: Missing or invalid URL." }, { status: 400 });
    }
    let planStepId = null;
    if (agent_state_id) {
      const { data: planStep, error: planStepError } = await supabase
        .from("plan_step")
        .insert({
          agent_state_id,
          rationale: rationale || `Fetch content for URL: ${url}`,
          tool_name: "fetch_url",
          args: { url },
          success_criteria: [],
          risks: []
        })
        .select()
        .single();
      if (planStepError) {
        console.error("Failed to insert plan_step:", planStepError);
      } else {
        planStepId = planStep.id;
      }
    }
    let toolResultId = null;
    let ok = false;
    let markdown = "";
    let errorMsg = null;
    try {
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        errorMsg = `Fetch URL Tool: Failed to fetch: ${res.statusText}`;
        throw new Error(errorMsg);
      }
      const html = await res.text();
      markdown = extractMarkdownFromHtml(html);
      ok = true;
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : "Fetch URL Tool: Unknown error";
      console.error("Fetch URL Tool: Error occurred:", errorMsg);
    }
    if (planStepId) {
      const { data: toolResult, error: toolResultError } = await supabase
        .from("tool_result")
        .insert({
          plan_step_id: planStepId,
          ok,
          data: ok ? { content: markdown } : null,
          error: errorMsg,
          meta: { url }
        })
        .select()
        .single();
      if (toolResultError) {
        console.error("Failed to insert tool_result:", toolResultError);
      } else {
        toolResultId = toolResult.id;
      }
    }
    if (ok) {
      return NextResponse.json({ success: true, content: markdown, url, plan_step_id: planStepId, tool_result_id: toolResultId });
    } else {
      return NextResponse.json({ success: false, message: errorMsg, url, plan_step_id: planStepId, tool_result_id: toolResultId });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Fetch URL Tool: Unknown error";
    console.error("Fetch URL Tool: Error occurred:", errorMessage);
    return NextResponse.json({ success: false, message: errorMessage });
  }
}
