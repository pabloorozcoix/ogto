import { useEffect, useState } from 'react';
import type { TAgentStateWithCtx } from '@/components/runs/types';

import type { TPlan } from './types';

export type { TPlan } from './types';

export function usePlan(agentState: TAgentStateWithCtx | null) {
  const [plan, setPlan] = useState<TPlan>(null);
  useEffect(() => {
    if (!agentState?.agent_ctx) return;
    const { agent_ctx } = agentState;
    setPlan({
      query: agent_ctx.goal_title || '',
      systemPrompt: agent_ctx.goal_system_prompt || '',
      agentName: agent_ctx.agent_name || 'Unknown Agent',
    });
  }, [agentState]);
  return plan;
}
