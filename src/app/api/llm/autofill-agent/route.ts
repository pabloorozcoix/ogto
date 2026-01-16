import { NextResponse } from "next/server";
import { streamText } from "ai";
import { localOllama, OLLAMA_MODEL } from "@/lib/localOllama";

type TAutofillRequest = {
  goal_title?: unknown;
  model?: unknown;
};

type TAutofillResponse = {
  agent_name: string;
  agent_role: string;
  goal_system_prompt: string;
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function fallbackFromGoalTitle(goalTitle: string): TAutofillResponse {
  const title = goalTitle.trim();
  const agentName = title.length > 0 ? `Agent: ${title}` : "Research Agent";
  return {
    agent_name: agentName,
    agent_role: "Research assistant",
    goal_system_prompt: `You are a helpful agent. Your goal is: ${title || "(unspecified)"}.\n\nRules:\n- Be accurate and cite sources when applicable.\n- If unsure, say so and suggest how to verify.\n- Keep output concise and well-structured.`,
  };
}

function parseAutofillJson(raw: string, goalTitle: string): TAutofillResponse {
  const fenced = raw.match(/```(?:json)?\n([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  try {
    const parsed = JSON.parse(candidate) as Partial<TAutofillResponse>;
    const agent_name = typeof parsed.agent_name === "string" ? parsed.agent_name.trim() : "";
    const agent_role = typeof parsed.agent_role === "string" ? parsed.agent_role.trim() : "";
    const goal_system_prompt =
      typeof parsed.goal_system_prompt === "string" ? parsed.goal_system_prompt.trim() : "";

    if (agent_name.length < 2 || agent_role.length < 2 || goal_system_prompt.length < 2) {
      return fallbackFromGoalTitle(goalTitle);
    }

    return { agent_name, agent_role, goal_system_prompt };
  } catch {
    return fallbackFromGoalTitle(goalTitle);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TAutofillRequest;
    const goalTitle = safeString(body.goal_title).trim();
    const model = safeString(body.model).trim() || OLLAMA_MODEL;

    if (goalTitle.length < 2) {
      return NextResponse.json(
        { error: "goal_title must be at least 2 characters" },
        { status: 400 }
      );
    }

    const systemPrompt =
      "You generate agent configuration fields. Return ONLY strict JSON with keys: " +
      "agent_name (string), agent_role (string), goal_system_prompt (string).";

    const userPrompt = `Goal title: ${JSON.stringify(goalTitle)}\n\nConstraints:\n- agent_name: short, descriptive (2-60 chars)\n- agent_role: short role description (2-80 chars)\n- goal_system_prompt: detailed but concise instructions for the agent; include an output format section\n\nReturn ONLY JSON.`;

    const result = streamText({
      model: localOllama(model),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    let acc = "";
    for await (const chunk of result.textStream) acc += chunk;

    const response = parseAutofillJson(acc, goalTitle);
    return NextResponse.json({ ok: true, ...response });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Autofill error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
