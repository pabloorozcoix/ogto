import { streamText } from 'ai';
import { localOllama, OLLAMA_MODEL } from "@/lib/localOllama";
import { supabase } from "@/lib/supabase";
import { TEXT_SUMMARY_MAX_OUTPUT_TOKENS } from "./constants";




export async function POST(req: Request) {
    console.log('[get_text_summary] Received POST request');
    let planStepId: string | null = null;
    let toolResultId: string | null = null;
    try {
        const { text, agent_state_id, rationale } = await req.json();
        if (!text || typeof text !== 'string') {
            return new Response('Missing text', { status: 400 });
        }
        
        if (agent_state_id) {
            const { data: planStep, error: planStepError } = await supabase
                .from('plan_step')
                .insert({
                    agent_state_id,
                    rationale: rationale || 'Summarize fetched content',
                    tool_name: 'get_text_summary',
                        
                    args: { text_length: text.length },
                    success_criteria: [],
                    risks: []
                })
                .select()
                .single();
            if (planStepError) {
                console.error('[get_text_summary] Failed to insert plan_step', planStepError);
            } else if (planStep?.id) {
                planStepId = planStep.id;
            }
        }

        const encoder = new TextEncoder();
        let summary = '';
        let errorMsg: string | null = null;
        let toolResultPersisted = false;

        const result = streamText({
            model: localOllama(OLLAMA_MODEL),
            
            maxOutputTokens: TEXT_SUMMARY_MAX_OUTPUT_TOKENS,
            messages: [
                { role: 'system', content: 'You are a concise senior assistant that returns clean markdown summaries.' },
                { role: 'user', content: `Summarize the following content in markdown focusing on key facts, entities, metrics, and actionable insights. If the text is noisy, extract signal only.\n\nTarget length: ~1,200 words (as close as possible within the output token limit). Prefer density over filler; do not exceed the limit.\n\n${text}` }
            ]
        });

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                controller.enqueue(encoder.encode(JSON.stringify({ event: 'start', plan_step_id: planStepId }) + '\n'));
                try {
                    for await (const delta of result.textStream) {
                        summary += delta;
                        controller.enqueue(encoder.encode(JSON.stringify({ event: 'delta', chunk: delta }) + '\n'));
                    }
                } catch (modelErr) {
                    errorMsg = modelErr instanceof Error ? modelErr.message : 'Model error';
                    controller.enqueue(encoder.encode(JSON.stringify({ event: 'error', message: errorMsg }) + '\n'));
                }
                const trimmed = summary.trim();
                const ok = trimmed.length > 0 && !errorMsg;
                // Persist tool_result once at end if we have a planStepId
                if (planStepId && !toolResultPersisted) {
                    try {
                        const { data: toolResult, error: toolResultError } = await supabase
                          .from('tool_result')
                          .insert({
                              plan_step_id: planStepId,
                              ok,
                              data: ok ? { summary: trimmed } : null,
                              error: errorMsg,
                              meta: { model: OLLAMA_MODEL, chars_in: text.length, chars_out: trimmed.length }
                          })
                          .select()
                          .single();
                        if (!toolResultError && toolResult?.id) {
                            toolResultId = toolResult.id;
                            toolResultPersisted = true;
                        }
                    } catch (persistErr) {
                        console.error('[get_text_summary] Persist error', persistErr);
                    }
                }
                controller.enqueue(encoder.encode(JSON.stringify({
                    event: 'final',
                    summary: trimmed,
                    ok,
                    error: errorMsg,
                    plan_step_id: planStepId,
                    tool_result_id: toolResultId
                }) + '\n'));
                controller.close();
            }
        });
        return new Response(stream, {
            headers: {
                'Content-Type': 'application/x-ndjson',
                'x-plan-step-id': planStepId || '',
                'x-tool-result-id': toolResultId || ''
            }
        });
    } catch (err) {
        console.error('[get_text_summary] Unexpected error', err);
        return new Response('Internal Server Error', { status: 500 });
    }
}
