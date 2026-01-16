import { useCallback } from 'react';
import type { TObservation } from '@/components/runs/types';

import type { TBeginEnd, TObservePayload } from './types';

export function useObserve(
  setStreamingObservation: (o: TObservation | null) => void,
  setObservation: (o: TObservation | null) => void,
  setError: (updater: (prev: string | null) => string | null) => void,
  be: TBeginEnd
) {
  const runObserve = useCallback(async (payload: TObservePayload) => {
    let finalObservation: TObservation | null = null;
    let observationId: string | null = null;
    try {
      be.beginRequest();
        const res = await fetch('/api/loop/observe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/x-ndjson' },
        body: JSON.stringify(payload),
      });
      if (!res.body) throw new Error('No response body for observe stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let lastPartial: TObservation | null = null;
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
            if (evt.event === 'partial' && evt.observation) {
              lastPartial = evt.observation as TObservation;
              setStreamingObservation(lastPartial);
            } else if (evt.event === 'final') {
              finalObservation = evt.observation as TObservation;
              observationId = evt.observation_id || null;
              setObservation(finalObservation);
              setStreamingObservation(null);
              setError(prev => (prev === 'parse_failed' ? null : prev));
            } else if (evt.event === 'error' && evt.message) {
              if (evt.message === 'parse_failed') {
                
                continue;
              }
              if (!finalObservation) setError(() => evt.message);
            }
          } catch {
            
          }
        }
      }
      if (!finalObservation && lastPartial) {
        finalObservation = lastPartial;
        setObservation(finalObservation);
        setStreamingObservation(null);
      }
      be.endRequest();
    } catch {
      setError(() => 'Observation streaming failed');
      be.endRequest();
    }
    return { finalObservation, observationId };
  }, [setStreamingObservation, setObservation, setError, be]);

  return { runObserve };
}
