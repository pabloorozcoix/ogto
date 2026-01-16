
import { NextResponse } from "next/server";
import { streamText } from "ai";
import { localOllama, OLLAMA_MODEL } from "@/lib/localOllama";
import { MAX_WEB_SEARCH_RESULTS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import {
  extractJSONBlock,
  parseObservationJSON,
  normalizeObservation,
} from "@/lib/observationParsing";
import {
  OBSERVE_ARTIFACT_MAX_CLAIMS,
  OBSERVE_ARTIFACT_SUMMARY_SNIPPET_CHARS,
  OBSERVE_BLEND_DIVISOR,
  OBSERVE_CLAIM_LONG_SENTENCE_THRESHOLD,
  OBSERVE_CLAIM_SENTENCES_MAX,
  OBSERVE_CONFIDENCE_DECIMALS,
  OBSERVE_DETAILS_MAX_CHARS,
  OBSERVE_GOAL_TERMS_MAX_SOURCES_LIST,
  OBSERVE_HEADLINE_MAX_CHARS,
  OBSERVE_HEURISTIC_BASE,
  OBSERVE_HEURISTIC_GOAL_MATCH_BASE_BONUS,
  OBSERVE_HEURISTIC_GOAL_MATCH_EXTRA_BONUS,
  OBSERVE_HEURISTIC_GOAL_MATCH_MAX_BONUS,
  OBSERVE_HEURISTIC_HEDGING_PENALTY,
  OBSERVE_HEURISTIC_HYPE_PENALTY,
  OBSERVE_HEURISTIC_KEEP_MIN,
  OBSERVE_HEURISTIC_LONG_LEN_PENALTY,
  OBSERVE_HEURISTIC_LONG_LEN_THRESHOLD,
  OBSERVE_HEURISTIC_MAX,
  OBSERVE_HEURISTIC_MIN,
  OBSERVE_HEURISTIC_NUMERIC_BONUS,
  OBSERVE_HEURISTIC_SHORT_LEN_PENALTY,
  OBSERVE_HEURISTIC_SHORT_LEN_THRESHOLD,
  OBSERVE_HEURISTIC_STALE_YEAR_PENALTY,
  OBSERVE_HEURISTIC_STALE_YEAR_THRESHOLD,
  OBSERVE_HEURISTIC_STRONG_VERB_BONUS,
  OBSERVE_LLM_CLAIM_SCORING_MAX_CLAIMS,
  OBSERVE_LLM_RATIONALE_MAX_CHARS,
} from "./constants";

import type {
  TArtifactClaim,
  TClaimConfidenceRow,
  TLlmEvalResponse,
  TObservationArtifact,
  TObservationJSON,
  TObserveRequestBody,
} from "./types";

export async function POST(req: Request) {
  try {
    console.log("[Observe] Received request");
    const body: TObserveRequestBody = await req.json();
    const {
      summaries,
      fetchedContents,
      searchResults,
      plan,
      agentState,
      summaryMeta,
      agent_state_id,
    } = body;
    console.log("[Observe] Parsed request body:", {
      summaryKeys: Object.keys(summaries || {}),
      fetchedCount: fetchedContents?.length,
      hasPlan: !!plan,
      hasAgentState: !!agentState,
      summaryMetaKeys: Object.keys(summaryMeta || {}),
      agent_state_id,
    });

    if (!summaries || typeof summaries !== "object") {
      console.error("[Observe] Missing or invalid summaries:", summaries);
      return NextResponse.json(
        { error: "Missing or invalid summaries" },
        { status: 400 }
      );
    }
    if (!Array.isArray(fetchedContents)) {
      console.error(
        "[Observe] Missing or invalid fetchedContents:",
        fetchedContents
      );
      return NextResponse.json(
        { error: "Missing or invalid fetchedContents" },
        { status: 400 }
      );
    }

    
    const systemPrompt = `You are a senior AI agent analyst. Your job is to OBSERVE and extract key findings, headlines, and artifacts from the agent's ACT results. Return a JSON object with headline, details, artifacts (array), quality, and counters.`;
    const summariesText = Object.entries(summaries)
      .map(
        ([url, summary]) =>
          `URL: ${url}\nSummary: ${
            typeof summary === "string" ? summary : "No summary"
          }`
      )
      .join("\n---\n");
    const planText = plan ? `Plan: ${JSON.stringify(plan)}` : "";
    const agentText = agentState
      ? `AgentState: ${JSON.stringify(agentState)}`
      : "";
    const userPrompt = `Given the following ACT results, perform the OBSERVE step.\n${summariesText}\n${planText}\n${agentText}\nReturn a JSON object with headline, details, artifacts (array), quality, and counters. Each artifact should align with a source summary.`;

    console.log("[Observe] System Prompt:", systemPrompt);
    console.log("[Observe] User Prompt:", userPrompt);

    // Call Ollama and stream response
    console.log("[Observe] Calling Ollama with model:", OLLAMA_MODEL);
    console.log("[Observe] systemPrompt:", systemPrompt);
    console.log("[Observe] userPrompt:", userPrompt);
    const llmStream = streamText({
      model: localOllama(OLLAMA_MODEL),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

  let accumulated = "";
  // Holds the final observation we will persist / emit.
  let finalNormalized: TObservationJSON | null = null;
  // Track the most recent partial so we can promote it if final parse fails.
  let lastPartialNormalized: TObservationJSON | null = null;
    let planStepId: string | null = null;
    let toolResultId: string | null = null;
    let observationId: string | null = null;

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(`{"event":"start"}\n`));
        try {
          for await (const delta of llmStream.textStream) {
            accumulated += delta;
            // Attempt incremental parse for early UI feedback
            const candidate = extractJSONBlock(accumulated);
            const parsed = candidate ? parseObservationJSON(candidate) : null;
            if (parsed) {
              const normalized = normalizeObservation(parsed);
              if (normalized) {
                // Keep reference for potential promotion later.
                lastPartialNormalized = normalized as TObservationJSON;
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      event: "partial",
                      observation: normalized,
                    }) + "\n"
                  )
                );
              }
            }
          }
        } catch (streamErr) {
          console.error("[Observe] Streaming error", streamErr);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ event: "error", message: "stream_error" }) + "\n"
            )
          );
        }
        // Final parse
        const parsed =
          parseObservationJSON(accumulated) ||
          parseObservationJSON(extractJSONBlock(accumulated) || "");
        const normalized = normalizeObservation(parsed);

        if (normalized) {
          finalNormalized = normalized as TObservationJSON;
        } else if (lastPartialNormalized) {
          // Promote last partial to final instead of failing outright.
          finalNormalized = {
            ...lastPartialNormalized,
            // Annotate that this was promoted from a partial (non-fatal parse failure).
            promoted_from_partial: true,
          } as TObservationJSON;
        } else {
          // Synthesize a fallback observation instead of emitting a terminal error
          const rawText = accumulated.trim();
            // Derive a headline from first non-empty line or first 120 chars
          const firstLine =
            rawText.split(/\r?\n/).find((l) => l.trim().length > 0) ||
            rawText.slice(0, OBSERVE_HEADLINE_MAX_CHARS);
          finalNormalized = {
            headline: firstLine.slice(0, OBSERVE_HEADLINE_MAX_CHARS),
            details: rawText.slice(0, OBSERVE_DETAILS_MAX_CHARS) || '(no details)',
            artifacts: [],
            quality: null,
            counters: null,
            fallback_from_raw: true,
            parse_error: true,
          } as TObservationJSON;
          console.warn('[Observe] JSON parse failed; emitted fallback observation');
        }

          // Build standardized artifact objects from summaries & search results
          try {
            const srIndex: Record<string, { title?: string; summary?: string }> = {};
            (searchResults || []).forEach(r => { if (r.url) srIndex[r.url] = { title: r.title, summary: r.summary }; });
            let goalQuery = '';
            if (plan && typeof plan === 'object' && 'query' in (plan as Record<string, unknown>)) {
              const qv = (plan as Record<string, unknown>)['query'];
              if (typeof qv === 'string') goalQuery = qv;
            }
            const goalTerms = goalQuery.toLowerCase().split(/\s+/).filter(Boolean);
            // Basic heuristic scoring for claims prior to LLM refinement
            const HEDGING = /\b(may|might|could|possibly|appears|suggests|seems|potentially|approximately|around)\b/i;
            const STRONG_VERB = /\b(announces?|confirms?|reports?|launch(es|ed)?|reveals?|shows?)\b/i;
            const HYPE = /\b(revolutionary|unprecedented|game[- ]?changing|cutting[- ]?edge|groundbreaking)\b/i;
            const NUMERIC = /[\d%$]/;
            const YEAR = /\b(19|20)\d{2}\b/;
            const computeHeuristic = (s: string): number => {
              let score = OBSERVE_HEURISTIC_BASE;
              if (NUMERIC.test(s)) score += OBSERVE_HEURISTIC_NUMERIC_BONUS;
              const lc = s.toLowerCase();
              const goalMatches = goalTerms.filter(t => lc.includes(t));
              if (goalMatches.length)
                score += Math.min(
                  OBSERVE_HEURISTIC_GOAL_MATCH_BASE_BONUS +
                    OBSERVE_HEURISTIC_GOAL_MATCH_EXTRA_BONUS *
                      (goalMatches.length - 1),
                  OBSERVE_HEURISTIC_GOAL_MATCH_MAX_BONUS
                );
              if (HEDGING.test(s)) score -= OBSERVE_HEURISTIC_HEDGING_PENALTY;
              if (HYPE.test(s)) score -= OBSERVE_HEURISTIC_HYPE_PENALTY;
              if (STRONG_VERB.test(s)) score += OBSERVE_HEURISTIC_STRONG_VERB_BONUS;
              const len = s.length;
              if (len < OBSERVE_HEURISTIC_SHORT_LEN_THRESHOLD)
                score -= OBSERVE_HEURISTIC_SHORT_LEN_PENALTY;
              if (len > OBSERVE_HEURISTIC_LONG_LEN_THRESHOLD)
                score -= OBSERVE_HEURISTIC_LONG_LEN_PENALTY;
              const years = s.match(YEAR);
              if (years) {
                const currentYear = new Date().getFullYear();
                const maxYear = Math.max(...years.map(y => parseInt(y, 10)));
                if (currentYear - maxYear > OBSERVE_HEURISTIC_STALE_YEAR_THRESHOLD)
                  score -= OBSERVE_HEURISTIC_STALE_YEAR_PENALTY;
              }
              score = Math.max(
                OBSERVE_HEURISTIC_MIN,
                Math.min(OBSERVE_HEURISTIC_MAX, score)
              );
              return parseFloat(score.toFixed(OBSERVE_CONFIDENCE_DECIMALS));
            };
            const makeClaims = (text: string): TArtifactClaim[] => {
              const sentences = text
                .split(/(?<=[.!?])\s+/)
                .slice(0, OBSERVE_CLAIM_SENTENCES_MAX)
                .filter((s) => s.trim().length > 0);
              const claims: TArtifactClaim[] = [];
              for (const sentence of sentences) {
                // Claim-like: numeric OR length threshold
                if (
                  !(
                    NUMERIC.test(sentence) ||
                    sentence.length > OBSERVE_CLAIM_LONG_SENTENCE_THRESHOLD
                  )
                )
                  continue;
                const heuristic_confidence = computeHeuristic(sentence);
                if (heuristic_confidence < OBSERVE_HEURISTIC_KEEP_MIN) continue; // discard very low
                claims.push({
                  statement: sentence.trim(),
                  confidence: heuristic_confidence, // temporary; may be blended later
                  heuristic_confidence,
                });
                if (claims.length >= OBSERVE_ARTIFACT_MAX_CLAIMS) break;
              }
              return claims;
            };
            const artifacts: TObservationArtifact[] = Object.entries(summaries || {}).map(([url, summaryValue]) => {
              const sr = srIndex[url] || {};
              const title = sr.title || url;
              const sumText = typeof summaryValue === 'string' ? summaryValue : JSON.stringify(summaryValue);
              const matched = goalTerms.filter((term: string) => sumText.toLowerCase().includes(term));
              const relevance_reason = matched.length > 0
                ? `Contains goal term(s): ${matched.join(', ')}`
                : goalTerms.length > 0
                  ? `Provides context relevant to goal: ${goalQuery}`
                  : 'Relevant to task context';
              const claims = makeClaims(sumText);
              return { title, summary: sumText, relevance_reason, claims: claims.length ? claims : undefined, source_url: url };
            });
            if (!finalNormalized.artifacts || finalNormalized.artifacts.length === 0) {
              finalNormalized.artifacts = artifacts;
            } else {
              // Replace simple string artifacts with structured ones if needed
              const alreadyStructured = Array.isArray(finalNormalized.artifacts) && finalNormalized.artifacts.every(a => typeof a === 'object' && a && 'title' in a);
              if (!alreadyStructured) {
                finalNormalized.artifacts = artifacts;
              }
            }
            // Update counters with artifacts & claims
            const claimCount = (finalNormalized.artifacts || []).reduce(
              (acc, a) => acc + ((a as TObservationArtifact).claims?.length || 0),
              0
            );
            finalNormalized.counters = {
              ...(finalNormalized.counters || {}),
              sources: Object.keys(summaries || {}).length,
              artifacts: (finalNormalized.artifacts || []).length,
              claims: claimCount,
            };

            // Optional: LLM-based confidence refinement
            const useLlmClaimScoring = process.env.OBS_USE_LLM_CLAIM_SCORING !== 'false';
            if (useLlmClaimScoring) {
              try {
                // Collect all claims with ids
                const allClaims: { id: string; statement: string; heuristic_confidence: number; source_url?: string; summary?: string }[] = [];
                (finalNormalized.artifacts as TObservationArtifact[]).forEach((art, ai) => {
                  art.claims?.forEach((c, ci) => {
                    allClaims.push({
                      id: `a${ai}_c${ci}`,
                      statement: c.statement,
                      heuristic_confidence: c.heuristic_confidence ?? c.confidence,
                      source_url: art.source_url,
                      summary: art.summary.slice(0, OBSERVE_ARTIFACT_SUMMARY_SNIPPET_CHARS),
                    });
                  });
                });
                if (allClaims.length > 0) {
                  // Batch into single prompt (limit to 40 claims to avoid context blowup)
                  const limitedClaims = allClaims.slice(
                    0,
                    OBSERVE_LLM_CLAIM_SCORING_MAX_CLAIMS
                  );
                  const systemEval = `You are a meticulous fact confidence evaluator. Output ONLY JSON with schema {claims: [{id, llm_confidence: number (0-1), rationale: string}]}. Be conservative; penalize hedging or unverifiable marketing language. Confidence is probability the statement is factually correct given typical reliable web sources in current year.`;
                  const userEval = JSON.stringify({
                    year: new Date().getFullYear(),
                    goal: goalQuery,
                    claims: limitedClaims.map(c => ({ id: c.id, statement: c.statement, heuristic_confidence: c.heuristic_confidence, source_url: c.source_url, summary_snippet: c.summary })),
                  });
                  const evalStream = streamText({
                    model: localOllama(OLLAMA_MODEL),
                    messages: [
                      { role: 'system', content: systemEval },
                      { role: 'user', content: userEval },
                    ],
                  });
                  let evalAccum = '';
                  for await (const d of evalStream.textStream) evalAccum += d;
                  // Attempt JSON extraction
                  const jsonMatch = evalAccum.match(/\{[\s\S]*$/); // crude: from first '{' to end
                  let parsedEval: TLlmEvalResponse | null = null;
                  try {
                    parsedEval = JSON.parse(jsonMatch ? jsonMatch[0] : evalAccum);
                  } catch {
                    console.warn('[Observe] LLM claim scoring JSON parse failed');
                  }
                  if (parsedEval && Array.isArray(parsedEval.claims)) {
                    const evalMap: Record<string, { llm_confidence: number; rationale?: string }> = {};
                    parsedEval.claims.forEach((r) => {
                      if (!r || typeof r.id !== 'string') return;
                      if (typeof r.llm_confidence === 'number') {
                        const llm_confidence = Math.min(1, Math.max(0, r.llm_confidence));
                        evalMap[r.id] = { llm_confidence, rationale: typeof r.rationale === 'string' ? r.rationale : undefined };
                      }
                    });
                    // Merge back & blend: final = 0.5 * heuristic + 0.5 * llm (could tune)
                    (finalNormalized.artifacts as TObservationArtifact[]).forEach((art, ai) => {
                      art.claims?.forEach((c, ci) => {
                        const key = `a${ai}_c${ci}`;
                        const found = evalMap[key];
                        if (found) {
                          c.llm_confidence = parseFloat(
                            found.llm_confidence.toFixed(OBSERVE_CONFIDENCE_DECIMALS)
                          );
                          const heuristic = c.heuristic_confidence ?? c.confidence;
                          c.confidence = parseFloat(
                            (
                              (heuristic + found.llm_confidence) /
                              OBSERVE_BLEND_DIVISOR
                            ).toFixed(OBSERVE_CONFIDENCE_DECIMALS)
                          );
                          if (found.rationale)
                            c.rationale = found.rationale.slice(
                              0,
                              OBSERVE_LLM_RATIONALE_MAX_CHARS
                            );
                        } else {
                          // Keep heuristic only
                          c.confidence = c.heuristic_confidence ?? c.confidence;
                        }
                      });
                    });
                    // Persist claim confidence logs if agent_state_id present
                    if (agent_state_id) {
                      try {
                        const rows: TClaimConfidenceRow[] = [];
                        (finalNormalized.artifacts as TObservationArtifact[]).forEach((art, ai) => {
                          art.claims?.forEach((c, ci) => {
                            rows.push({
                              agent_state_id,
                              observation_id: null, /* filled after observation row inserted; optional backfill */
                              artifact_index: ai,
                              claim_index: ci,
                              statement: c.statement,
                              heuristic_confidence: c.heuristic_confidence ?? null,
                              llm_confidence: c.llm_confidence ?? null,
                              blended_confidence: c.confidence ?? null,
                              rationale: c.rationale ?? null,
                            });
                          });
                        });
                        if (rows.length) {
                          await supabase.from('claim_confidence_log').insert(rows);
                        }
                      } catch (logErr) {
                        console.warn('[Observe] Failed to persist claim_confidence_log', logErr);
                      }
                    }
                  }
                }
              } catch (claimEvalErr) {
                console.warn('[Observe] LLM claim scoring failed', claimEvalErr);
              }
            }
          } catch (artifactErr) {
            console.warn('[Observe] Artifact structuring failed', artifactErr);
          }

        // Ensure non-empty semantic fields before persistence / emission
          // If artifacts ended up as simple strings (shouldn't after structuring), promote them to objects.
          if (Array.isArray(finalNormalized.artifacts) && finalNormalized.artifacts.length > 0) {
            const first = finalNormalized.artifacts[0];
            if (typeof first === 'string') {
              finalNormalized.artifacts = (finalNormalized.artifacts as string[]).map((u) => ({
                title: u,
                summary: summaries[u] || '',
                relevance_reason: 'Source reference',
                source_url: u,
              }));
            }
          }
        if (finalNormalized) {
          const summaryKeys = Object.keys(summaries || {});
          if (!finalNormalized.details || finalNormalized.details === '(no details)') {
            finalNormalized.details = `Synthesis over ${summaryKeys.length} sources. Key sources:\n` +
              summaryKeys
                .slice(0, OBSERVE_GOAL_TERMS_MAX_SOURCES_LIST)
                .map((u) => `- ${u}`)
                .join('\n');
          }
          if (!finalNormalized.artifacts || (Array.isArray(finalNormalized.artifacts) && finalNormalized.artifacts.length === 0)) {
            // Use top source URLs as artifacts (limit by configured MAX_WEB_SEARCH_RESULTS)
            finalNormalized.artifacts = summaryKeys.slice(0, MAX_WEB_SEARCH_RESULTS);
          }
            // Provide quality and simple counters if absent
          if (!finalNormalized.quality) {
            // Distinguish fallback vs normal based on presence of our marker flags
            const dynamicRef = finalNormalized as unknown as Record<string, unknown>;
            const isFallback = !!(dynamicRef['parse_error'] || dynamicRef['fallback_from_raw']);
            finalNormalized.quality = isFallback ? 'fallback' : 'ok';
          }
          if (!finalNormalized.counters) {
            finalNormalized.counters = { sources: summaryKeys.length } as Record<string, number>;
          }
        }

        // Persist after final parse
        if (agent_state_id) {
          const { data: planStep, error: planStepError } = await supabase
            .from("plan_step")
            .insert({
              agent_state_id,
              rationale: "Observation synthesis over summaries",
              tool_name: "observe",
              args: { summary_keys: Object.keys(summaries || {}) },
              success_criteria: [],
              risks: [],
            })
            .select()
            .single();
          if (!planStepError && planStep?.id) {
            planStepId = planStep.id;
            const { data: toolResult, error: toolResultError } = await supabase
              .from("tool_result")
              .insert({
                plan_step_id: planStepId,
                ok: true,
                data: { observation: finalNormalized },
                error: null,
                meta: { model: OLLAMA_MODEL },
              })
              .select()
              .single();
            if (!toolResultError && toolResult?.id) {
              toolResultId = toolResult.id;
              const { data: insertedObs, error: observationError } =
                await supabase
                  .from("observation")
                  .insert({
                    tool_result_id: toolResultId,
                    headline: finalNormalized.headline || "Observation",
                    details:
                      finalNormalized.details ||
                      JSON.stringify(finalNormalized),
                    artifacts: Array.isArray(finalNormalized.artifacts)
                      ? finalNormalized.artifacts
                      : [],
                    quality: finalNormalized.quality || null,
                    counters: finalNormalized.counters || null,
                  })
                  .select()
                  .single();
              if (!observationError && insertedObs?.id) {
                observationId = insertedObs.id;
                // Backfill observation_id for previously logged claim confidences (if any)
                try {
                  if (agent_state_id && observationId) {
                    const { error: backfillError } = await supabase
                      .from('claim_confidence_log')
                      .update({ observation_id: observationId })
                      .is('observation_id', null)
                      .eq('agent_state_id', agent_state_id);
                    if (backfillError) {
                      console.warn('[Observe] claim_confidence_log backfill failed', backfillError);
                    }
                  }
                } catch (bfErr) {
                  console.warn('[Observe] claim_confidence_log backfill exception', bfErr);
                }
              }
            }
          }
        }
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              event: "final",
              observation: finalNormalized,
              plan_step_id: planStepId,
              tool_result_id: toolResultId,
              observation_id: observationId,
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

    // Old persistence block removed (handled in streaming path)
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Observation error";
    console.error("[Observe] Error occurred:", errorMsg, e);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
