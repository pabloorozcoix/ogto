import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  console.log("[API] /api/llm/create called");
  const data = await req.json();
  console.log("[API] Received data:", data);
  
  if (!data.goal_title || !data.goal_system_prompt || !data.model) {
    console.error("[API] Missing required fields", data);
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  
  try {
    const { data: agent, error } = await supabase
      .from("agent_ctx")
      .insert([data])
      .select()
      .single();
    if (error) {
      console.error("[API] Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log("[API] Agent created:", agent);
    return NextResponse.json({ agent });
  } catch (err) {
    console.error("[API] Unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
