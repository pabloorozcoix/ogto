import { NextResponse } from "next/server";


export async function POST(req: Request) {
  const body = await req.json();
  const { name, initialGoal } = body;
  
  
  return NextResponse.json({
    AgentId: "stub-agent-id",
    status: "started",
    message: `Agent ${name} started with goal: ${initialGoal}`,
  });
}
