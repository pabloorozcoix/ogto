export type TParsedObservationLike = {
  headline?: string;
  details?: string;
  artifacts?: unknown;
  quality?: unknown;
  counters?: Record<string, number> | null;
  [k: string]: unknown;
};
