import { useCallback } from 'react';
import type { TSearchResult } from '@/components/runs/types';

import type { TTrackedFetch } from './types';

export function useSearch(trackedFetch: TTrackedFetch) {
  const runSearch = useCallback(async (query: string, agentStateId?: string, start?: number) => {
    const res = await trackedFetch('/api/tools/web_search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: query,
        agent_state_id: agentStateId,
        start,
        rationale: `Web search for query: ${query}${typeof start === 'number' ? ` (start=${start})` : ''}`,
      }),
    });
    const json = await res.json();
    const results: TSearchResult[] = json.results || [];
    const visitedUrls: string[] = results.map(r => r.url).filter((u): u is string => typeof u === 'string');
    return { results, visitedUrls };
  }, [trackedFetch]);

  return { runSearch };
}
