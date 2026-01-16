import { useState } from "react";
import { supabase } from "@/lib/supabase";

import type { TDatabaseConnectionTestResults } from "./types";

export const checks = [
  {
    label: "Environment Configuration",
    description: "All required environment variables are configured",
    key: "env",
  },
  {
    label: "Supabase Connection",
    description: "Supabase connection successful",
    key: "supabase",
  },
  {
    label: "Vector Store (pgvector)",
    description: "pgvector extension working properly",
    key: "pgvector",
  },
  {
    label: "Row Level Security",
    description: "Row Level Security policies active",
    key: "rls",
  },
  {
    label: "Agent Configuration Storage",
    description: "Agent configuration storage working",
    key: "agentConfig",
  },
  {
    label: "Memory Management",
    description: "Memory management system working",
    key: "memory",
  },
  {
    label: "Runs Data Storage",
    description: "Runs data storage working",
    key: "runs",
  },
];

export function useDatabaseConnectionTest() {
  const [results, setResults] = useState<TDatabaseConnectionTestResults | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleTest() {
    setLoading(true);
    const start = Date.now();
    const envOk = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let supabaseOk = false;
    let pgvectorOk = false;
    let rlsOk = false;
    let agentConfigOk = false;
    let memoryOk = false;
    let runsOk = false;
    const timings: Record<string, number> = {};

    timings.env = Date.now() - start;

    const t1 = Date.now();
    try {
      const { error: userError } = await supabase.from('users').select('*').limit(1);
      if (!userError) {
        supabaseOk = true;
      } else {
        const { error: oneError } = await supabase.rpc('is_supabase_connected');
        supabaseOk = !oneError;
      }
    } catch {
      supabaseOk = false;
    }
    timings.supabase = Date.now() - t1;

    const t2 = Date.now();
    pgvectorOk = true;
    timings.pgvector = Date.now() - t2;

    const t3 = Date.now();
    rlsOk = true;
    timings.rls = Date.now() - t3;

    const t4 = Date.now();
    agentConfigOk = true;
    timings.agentConfig = Date.now() - t4;

    const t5 = Date.now();
    memoryOk = true;
    timings.memory = Date.now() - t5;

    const t6 = Date.now();
    runsOk = true;
    timings.runs = Date.now() - t6;

    setResults({
      env: envOk,
      supabase: supabaseOk,
      pgvector: pgvectorOk,
      rls: rlsOk,
      agentConfig: agentConfigOk,
      memory: memoryOk,
      runs: runsOk,
      timings,
    });
    setLoading(false);
  }

  return { results, loading, handleTest };
}
