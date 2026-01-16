import { useCallback } from 'react';
import type { TObservation, TReflectState } from '@/components/runs/types';

import type { TTrackedFetch } from './types';

export function useReflect(trackedFetch: TTrackedFetch) {
  const runReflect = useCallback(async (args: {
    observationId: string;
    observation: TObservation;
    agentStateId?: string;
    priorSummary?: string | null;
  }) => {
    const { observationId, observation, agentStateId, priorSummary } = args;
    const reflectRes = await trackedFetch('/api/loop/reflect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        observation_id: observationId,
        observation,
        agent_state_id: agentStateId,
        prior_summary: priorSummary || null,
      }),
    });
    const reflectJson = await reflectRes.json();
    if (reflectRes.status !== 200) {
      return { error: reflectJson.error || 'Reflection API error' } as const;
    }
    const reflection = reflectJson.reflection;
    const reflectState: TReflectState = {
      goal_satisfied: !!reflection.goal_satisfied,
      critique: reflection.critique,
      updated_summary: reflection.updated_summary || observation.details,
    };

    return { reflectState } as const;
  }, [trackedFetch]);

  return { runReflect };
}
