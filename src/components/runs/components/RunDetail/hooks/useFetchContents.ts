import { useCallback } from 'react';
import type { TUrlContent } from '@/components/runs/types';

import type { TTrackedFetch } from './types';

export function useFetchContents(trackedFetch: TTrackedFetch, setPending: (updater: (p: Record<string, boolean>) => Record<string, boolean>) => void) {
  const fetchContents = useCallback(async (urls: string[], agentStateId?: string) => {
    const acc: TUrlContent[] = [];
    for (const url of urls) {
      setPending(p => ({ ...p, [url]: true }));
      try {
        const res = await trackedFetch('/api/tools/fetch_url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, agent_state_id: agentStateId, rationale: `Fetch content for URL: ${url}` }),
        });
        const json = await res.json();
        acc.push({ url, content: json.content || json.message || 'Unknown error' });
      } catch {
        acc.push({ url, content: 'Unknown error' });
      }
      setPending(p => ({ ...p, [url]: false }));
    }
    return acc;
  }, [trackedFetch, setPending]);

  return { fetchContents };
}
