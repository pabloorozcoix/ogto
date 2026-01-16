import { useCallback } from 'react';
import type { TSummaryMetaMap, TSummariesMap, TUrlContent } from '@/components/runs/types';

import type { TBeginEnd } from './types';

export function useSummaries(setPending: (updater: (p: Record<string, boolean>) => Record<string, boolean>) => void, setSummaries: (updater: (s: TSummariesMap) => TSummariesMap) => void, setSummaryMeta: (updater: (m: TSummaryMetaMap) => TSummaryMetaMap) => void, be: TBeginEnd) {
  const summarizeAll = useCallback(async (contents: TUrlContent[], agentStateId?: string) => {
    const summariesObj: TSummariesMap = {};
    for (const { url, content } of contents) {
      setPending(p => ({ ...p, [url]: true }));
      try {
        be.beginRequest();
        const res = await fetch('/api/tools/get_text_summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/x-ndjson' },
          body: JSON.stringify({ text: content, agent_state_id: agentStateId, rationale: `Summarize content from URL: ${url}` }),
        });
        if (!res.body) throw new Error('No summary stream body');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let partial = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (!line) continue;
            try {
              const evt = JSON.parse(line);
              if (evt.event === 'delta') {
                partial += evt.chunk;
                setSummaries(s => ({ ...s, [url]: partial }));
              } else if (evt.event === 'final') {
                const finalSummary = evt.summary || partial;
                summariesObj[url] = finalSummary;
                setSummaries(s => ({ ...s, [url]: finalSummary }));
                setSummaryMeta(m => ({ ...m, [url]: { plan_step_id: evt.plan_step_id, tool_result_id: evt.tool_result_id } }));
              }
            } catch {
              // swallow benign NDJSON parse failures; UI already sees partials
            }
          }
        }
        be.endRequest();
      } catch {
        summariesObj[url] = 'Summarization error';
        setSummaries(s => ({ ...s, [url]: 'Summarization error' }));
        be.endRequest();
      }
      setPending(p => ({ ...p, [url]: false }));
    }
    return summariesObj;
  }, [setPending, setSummaries, setSummaryMeta, be]);

  return { summarizeAll };
}
