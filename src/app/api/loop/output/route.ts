import { NextResponse } from "next/server";
import { streamText } from "ai";
import { localOllama, OLLAMA_MODEL } from "@/lib/localOllama";
import { supabase } from "@/lib/supabase";
import {
  OUTPUT_DEFAULT_MAX_TOKENS,
  OUTPUT_MAX_TOKENS,
  OUTPUT_MIN_TOKENS,
  OUTPUT_TARGET_WORDS,
} from "./constants";

import type { TOutputRequestBody } from "./types";






export async function POST(req: Request) {
  try {
    const body: TOutputRequestBody = await req.json();
    const {
      agent_goal_title,
      search_results_with_summaries,
      agent_state_id,
      max_tokens,
    } = body;

    if (!agent_goal_title || typeof agent_goal_title !== "string") {
      return NextResponse.json({ error: "Missing agent_goal_title" }, { status: 400 });
    }
    if (!search_results_with_summaries) {
      return NextResponse.json(
        { error: "Missing search_results_with_summaries" },
        { status: 400 }
      );
    }

    
    let planStepId: string | null = null;
    let toolResultId: string | null = null;

    if (agent_state_id) {
      try {
        const { data: planStep, error: planStepError } = await supabase
          .from("plan_step")
          .insert({
            agent_state_id,
            rationale: `Generate final markdown output for goal: ${agent_goal_title}`,
            tool_name: "output",
            args: {
              goal_title: agent_goal_title,
            },
            success_criteria: [],
            risks: [],
          })
          .select()
          .single();
        if (!planStepError && planStep?.id) planStepId = planStep.id;
      } catch {
        // non-fatal
      }
    }

    const userPayload = {
      goal_title: agent_goal_title,
      search_results_with_summaries,
      generated_at: new Date().toISOString(),
    };

    const systemPrompt =
      `You are a senior technical writer (your goal is: ${agent_goal_title}). Produce a complete blog post in Markdown. ` +
      "Ground claims strictly in the provided sources/summaries. " +
      "If a claim is uncertain, qualify it. Do not invent facts or citations. " +
      `Target length: ~${OUTPUT_TARGET_WORDS.toLocaleString()} words (as close as possible within the output token limit). ` +
      "Structure: Title, TL;DR, Introduction, Key Findings (bullets), Deep Dive (sections), Conclusion, Sources (bulleted URLs). " +
      "Aim for a substantive long-form post (do not stop early).";

    // Ollama often defaults to a small generation length if max_tokens isn't provided.
    // Use a larger default and clamp to the maximum we support for this route.
    const requestedMaxTokens =
      typeof max_tokens === "number" && Number.isFinite(max_tokens)
        ? Math.floor(max_tokens)
        : OUTPUT_DEFAULT_MAX_TOKENS;
    // Note: this is an OUTPUT token target (generation length), not the model context window.
    const effectiveMaxTokens = Math.max(
      OUTPUT_MIN_TOKENS,
      Math.min(OUTPUT_MAX_TOKENS, requestedMaxTokens)
    );

    const result = streamText({
      model: localOllama(OLLAMA_MODEL),
      maxOutputTokens: effectiveMaxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    });

    const encoder = new TextEncoder();
    let markdown = "";
    let errorMsg: string | null = null;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ event: "start", plan_step_id: planStepId }) + "\n"
          )
        );

        try {
          for await (const delta of result.textStream) {
            markdown += delta;
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ event: "delta", chunk: delta }) + "\n"
              )
            );
          }
        } catch (modelErr) {
          errorMsg = modelErr instanceof Error ? modelErr.message : "Model error";
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ event: "error", message: errorMsg }) + "\n"
            )
          );
        }

        const trimmed = markdown.trim();
        const ok = trimmed.length > 0 && !errorMsg;

        if (planStepId) {
          try {
            const { data: toolResult, error: toolResultError } = await supabase
              .from("tool_result")
              .insert({
                plan_step_id: planStepId,
                ok,
                data: ok ? { markdown: trimmed } : null,
                error: errorMsg,
                meta: {
                  model: OLLAMA_MODEL,
                  goal_title: agent_goal_title,
                  chars_out: trimmed.length,
                },
              })
              .select()
              .single();
            if (!toolResultError && toolResult?.id) toolResultId = toolResult.id;
          } catch {
            // non-fatal
          }
        }

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              event: "final",
              markdown: trimmed,
              ok,
              error: errorMsg,
              plan_step_id: planStepId,
              tool_result_id: toolResultId,
            }) + "\n"
          )
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Output error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
