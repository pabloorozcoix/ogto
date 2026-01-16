import { NextResponse } from "next/server";
import fetch from "node-fetch";
import { MAX_WEB_SEARCH_RESULTS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  console.log("Received POST request");
  const { q, agent_state_id, rationale, start } = await request.json();
  console.log("Search query:", q);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !engineId) {
    console.error("Missing Google Search API credentials.");
    return NextResponse.json({ success: false, results: [], message: "Missing Google Search API credentials." }, { status: 500 });
  }
  try {
    const parsedStart = typeof start === "number" ? start : Number(start);
    const safeStart = Number.isFinite(parsedStart) && parsedStart >= 1 ? Math.floor(parsedStart) : 1;
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(q)}&num=${MAX_WEB_SEARCH_RESULTS}&start=${safeStart}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Google Search API error:", res.statusText);
      return NextResponse.json({ success: false, results: [], message: `Google Search API error: ${res.statusText}` }, { status: 500 });
    }
    const data = (await res.json()) as { items?: Array<{ title: string; link: string; snippet: string }> };
    const items = Array.isArray(data.items) ? data.items : [];
    const results = items.map((item) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      source: "google"
    }));
    // DB: Insert plan_step
    let planStepId = null;
    if (agent_state_id) {
      const { data: planStep, error: planStepError } = await supabase
        .from("plan_step")
        .insert({
          agent_state_id,
          rationale: rationale || `Web search for query: ${q} (start=${safeStart})`,
          tool_name: "web_search",
          args: { q, start: safeStart },
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
    // DB: Insert tool_result
    let toolResultId = null;
    if (planStepId) {
      const { data: toolResult, error: toolResultError } = await supabase
        .from("tool_result")
        .insert({
          plan_step_id: planStepId,
          ok: true,
          data: { results },
          error: null,
          meta: { q, start: safeStart }
        })
        .select()
        .single();
      if (toolResultError) {
        console.error("Failed to insert tool_result:", toolResultError);
      } else {
        toolResultId = toolResult.id;
      }
    }
    return NextResponse.json({ success: true, results, plan_step_id: planStepId, tool_result_id: toolResultId, message: "Live Google search results." });
  } catch (err) {
    console.error("Error during Google Search API call:", err);
    return NextResponse.json({ success: false, results: [], message: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
