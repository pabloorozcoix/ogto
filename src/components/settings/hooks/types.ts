export type TDatabaseConnectionTestResults = {
  env: boolean;
  supabase: boolean;
  pgvector: boolean;
  rls: boolean;
  agentConfig: boolean;
  memory: boolean;
  runs: boolean;
  timings: Record<string, number>;
};
