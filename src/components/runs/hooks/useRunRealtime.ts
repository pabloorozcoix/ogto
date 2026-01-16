import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

import type { TAgentStateUpdate } from "./types";

export type { TAgentStateUpdate } from "./types";


export function useRunRealtime<TNewState extends Record<string, unknown> = TAgentStateUpdate>(
  runId: string,
  onUpdate: (newState: TNewState) => void
) {
  useEffect(() => {
    if (!runId) return;
    const channel = supabase
      .channel("agent_state_updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "agent_state", filter: `id=eq.${runId}` },
        payload => {
          const next = payload.new as TNewState | null;
          if (next) onUpdate(next);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [runId, onUpdate]);
}
