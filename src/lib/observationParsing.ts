

import type { TParsedObservationLike } from "./types";


export function extractJSONBlock(raw: string): string | null {
  if (!raw) return null;
  
  const fenced = raw.match(/```(?:json)?\n([\s\S]*?)```/i);
  const target = fenced ? fenced[1] : raw;
  const first = target.indexOf('{');
  const last = target.lastIndexOf('}');
  if (first === -1 || last === -1 || last < first) return null;
  return target.slice(first, last + 1);
}

export function parseObservationJSON(raw: string): TParsedObservationLike | null {
  const candidate = extractJSONBlock(raw) ?? raw;
  try {
    const parsed = JSON.parse(candidate) as TParsedObservationLike;
    return parsed;
  } catch {
    return null;
  }
}

export function normalizeObservation(parsed: TParsedObservationLike | null) {
  if (!parsed) return null;
  let artifacts: unknown[] = [];
  if (Array.isArray(parsed.artifacts)) {
    artifacts = parsed.artifacts; 
  } else if (parsed.artifacts !== undefined && parsed.artifacts !== null) {
    artifacts = [parsed.artifacts];
  }
  return {
    headline: parsed.headline || 'Observation',
    details: parsed.details || '(no details)',
    artifacts,
    quality: typeof parsed.quality === 'string' ? parsed.quality : null,
    counters: parsed.counters || null
  };
}
