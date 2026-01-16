import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { localOllama, OLLAMA_MODEL } from '@/lib/localOllama';
import { supabase } from '@/lib/supabase';
import { REFLECT_COVERAGE_SCORE_GAP_DIVISOR } from './constants';

import type { TContra, TLowClaim, TReflectRequestBody, TReflectionRow } from './types';

export async function POST(req: Request) {
  try {
    const body: TReflectRequestBody = await req.json();
    const { observation_id, observation, agent_state_id, prior_summary } = body;

    if (!observation_id || !observation) {
      return NextResponse.json({ error: 'Missing observation context' }, { status: 400 });
    }

  const systemPrompt = 'You are a reflection module. Given the observation and prior summary, return JSON with: critique, decision (PROGRESS|ADJUST|STOP), goal_satisfied (bool), memory_note (optional), updated_summary, unmet_criteria[], missing_facts[], low_confidence_claims[{claim,reason}], contradictions[{topic,sources[]}]. Focus on actionable gaps; leave arrays empty if none.';
  const userPrompt = `Observation: ${JSON.stringify(observation)}\nPrior Summary: ${prior_summary || '(none)'}\nReturn ONLY JSON with required keys.`;

    const result = streamText({
      model: localOllama(OLLAMA_MODEL),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    let acc = '';
    for await (const d of result.textStream) acc += d;

    function buildFallback(): TReflectionRow {
      return {
        critique: observation?.headline || 'Observation synthesized',
        decision: 'PROGRESS',
        goal_satisfied: true,
        memory_note: null,
        updated_summary: observation ? (Array.isArray(observation.details) ? (observation.details as unknown as string[]).join('\n') : (observation.details as string)) : (prior_summary || null),
        fallback: true
      };
    }

    // Attempt to isolate JSON
    const fenced = acc.match(/```(?:json)?\n([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : acc;
  let parsed: unknown = null;
  let reflectionRow: TReflectionRow | null = null;
    try {
      if (candidate.trim()) {
        parsed = JSON.parse(candidate);
        const p = (parsed && typeof parsed === 'object') ? parsed as Record<string, unknown> : {} as Record<string, unknown>;
        const asStringArray = (val: unknown): string[] => Array.isArray(val) ? val.filter(v => typeof v === 'string') as string[] : [];
        const asLowClaims = (val: unknown): { claim: string; reason: string }[] => Array.isArray(val)
          ? (val as unknown[])
              .filter((c): c is TLowClaim => {
                if (!c || typeof c !== 'object') return false;
                const rec = c as Record<string, unknown>;
                return typeof rec.claim === 'string';
              })
              .map(c => ({ claim: c.claim, reason: typeof c.reason === 'string' ? c.reason : 'unclear' }))
          : [];
        const asContradictions = (val: unknown): { topic: string; sources: string[] }[] => Array.isArray(val)
          ? (val as unknown[])
              .filter((c): c is TContra => {
                if (!c || typeof c !== 'object') return false;
                const rec = c as Record<string, unknown>;
                return typeof rec.topic === 'string';
              })
              .map(c => ({ topic: c.topic, sources: Array.isArray(c.sources) ? c.sources.filter(s => typeof s === 'string') as string[] : [] }))
          : [];
        const unmet = asStringArray(p.unmet_criteria);
        const missing = asStringArray(p.missing_facts);
        const lowClaims = asLowClaims(p.low_confidence_claims);
        const contradictions = asContradictions(p.contradictions);
        reflectionRow = {
          critique: (p.critique as string) || (p.headline as string) || 'No critique',
          decision: (p.decision as string) || null,
          goal_satisfied: p.goal_satisfied === undefined ? true : Boolean(p.goal_satisfied),
          memory_note: (p.memory_note as string) || null,
          updated_summary: (p.updated_summary as string) || (p.details as string) || prior_summary || (observation ? (Array.isArray(observation.details) ? (observation.details as unknown as string[]).join('\n') : (observation.details as string)) : null),
          fallback: false,
          unmet_criteria: unmet,
          missing_facts: missing,
          low_confidence_claims: lowClaims,
          contradictions
        };
      } else {
        reflectionRow = buildFallback();
      }
    } catch {
      reflectionRow = buildFallback();
    }

  let planStepId: string | null = null;
  let toolResultId: string | null = null;
  let reflectionId: string | null = null;

    if (agent_state_id) {
      try {
        const { data: planStep } = await supabase.from('plan_step').insert({
          agent_state_id,
          rationale: 'Reflection over observation',
          tool_name: 'reflect',
          args: { observation_id },
          success_criteria: [],
          risks: []
        }).select().single();
        if (planStep?.id) {
          planStepId = planStep.id;
          const { data: toolResult } = await supabase.from('tool_result').insert({
            plan_step_id: planStepId,
            ok: true,
            data: { reflection: reflectionRow },
            error: null,
            meta: { model: OLLAMA_MODEL }
          }).select().single();
          if (toolResult?.id) {
            toolResultId = toolResult.id;
            const { data: reflection } = await supabase.from('reflection').insert({
              observation_id,
              critique: reflectionRow.critique,
              decision: reflectionRow.decision,
              goal_satisfied: reflectionRow.goal_satisfied,
              memory_note: reflectionRow.memory_note,
              updated_summary: reflectionRow.updated_summary,
              // store gaps in decision JSON via meta field if schema extended later
            }).select().single();
            if (reflection?.id) {
              reflectionId = reflection.id;
              if (reflectionRow.updated_summary) {
                await supabase.from('agent_state').update({
                  summary: reflectionRow.updated_summary,
                  updated_at: new Date().toISOString(),
                  status: reflectionRow.goal_satisfied ? 'complete' : 'active'
                }).eq('id', agent_state_id);
                // If not satisfied and there are gaps, optionally compute provisional coverage_score
                if (!reflectionRow.goal_satisfied) {
                  const totalGaps = (reflectionRow.unmet_criteria?.length || 0) + (reflectionRow.missing_facts?.length || 0);
                  const coverageScore =
                    totalGaps === 0
                      ? 1
                      : Math.max(
                          0,
                          1 -
                            Math.min(
                              1,
                              totalGaps / REFLECT_COVERAGE_SCORE_GAP_DIVISOR
                            )
                        );
                  await supabase.from('agent_state').update({ coverage_score: coverageScore }).eq('id', agent_state_id);
                }
              }
            }
          }
        }
      } catch (persistErr) {
        console.warn('[Reflect] Persistence error, continuing with fallback reflection', persistErr);
      }
    }

    return NextResponse.json({
      reflection: reflectionRow,
      plan_step_id: planStepId,
      tool_result_id: toolResultId,
      reflection_id: reflectionId
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Reflection error';
    // Final safety fallback
    return NextResponse.json({
      reflection: {
        critique: 'Reflection failed, using fallback',
        decision: 'ADJUST',
        goal_satisfied: false,
        memory_note: null,
        updated_summary: null,
        fallback: true,
        error: msg
      }
    }, { status: 200 });
  }
}
