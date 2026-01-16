import { useState, useTransition } from "react";

export function useDatabaseConnectionTest() {
  const [results, setResults] = useState<{
    env: boolean;
    supabase: boolean;
    pgvector: boolean;
    timings: Record<string, number>;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleTest() {
    startTransition(async () => {
      const start = Date.now();
      const envOk = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      let supabaseOk = false;
      let pgvectorOk = false;
      const timings: Record<string, number> = {};

      timings.env = Date.now() - start;

      const t1 = Date.now();
      try {
        const res = await fetch("/api/db/test-connection");
        const json = await res.json();
        supabaseOk = json.success;
      } catch {
        supabaseOk = false;
      }
      timings.supabase = Date.now() - t1;

      const t2 = Date.now();
      try {
        const res = await fetch("/api/db/test-pgvector");
        const json = await res.json();
        pgvectorOk = json.success;
      } catch {
        pgvectorOk = false;
      }
      timings.pgvector = Date.now() - t2;

      setResults({
        env: envOk,
        supabase: supabaseOk,
        pgvector: pgvectorOk,
        timings,
      });
    });
  }

  return { results, isPending, handleTest };
}
