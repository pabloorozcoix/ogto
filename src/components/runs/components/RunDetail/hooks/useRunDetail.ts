
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_OUTPUT_MAX_TOKENS, MAX_WEB_SEARCH_RESULTS } from "@/lib/constants";
import type {
  TAgentStateWithCtx,
  TObservation,
  TReflectState,
  TSearchResult,
  TSearchResultWithTextSummary,
  TSummariesMap,
  TUrlContent,
} from "@/components/runs/types";
import { BLOCKED_FETCH_MESSAGE, PHASES } from "@/components/runs/constants";
import { usePlan } from "./usePlan";
import { useSearch } from "./useSearch";
import { useFetchContents } from "./useFetchContents";
import { useSummaries } from "./useSummaries";
import { useObserve } from "./useObserve";
import { useReflect as useReflectHook } from "./useReflect";
import { useOutput } from "./useOutput";

export type TLoopIterationBlock = {
  id: string;
  iteration: number;
  query: string;
  searchStart: number;
  searchResults: TSearchResult[];
  fetchedContents: TUrlContent[];
  summaries: TSummariesMap;
  searchResultsWithTextSummary: TSearchResultWithTextSummary[];
  observation?: TObservation | null;
  reflect?: TReflectState | null;
};


export function useRunDetail(params: Promise<{ runId: string }>) {
  
  const [runId, setRunId] = useState<string | null>(null);
  const [agentState, setAgentState] = useState<TAgentStateWithCtx | null>(null);
  
  const plan = usePlan(agentState);
  
  const [searchResults, setSearchResults] = useState<TSearchResult[]>([]);
  const [fetchedContents, setFetchedContents] = useState<{ url: string; content: string }[]>([]);
  const [summaries, setSummaries] = useState<TSummariesMap>({});
  const [summaryMeta, setSummaryMeta] = useState<{ [url: string]: { plan_step_id?: string; tool_result_id?: string } }>({});
  const [searchResultsWithTextSummary, setSearchResultsWithTextSummary] = useState<TSearchResultWithTextSummary[]>([]);
  const [summariesReady, setSummariesReady] = useState<boolean>(false);

  const [loopBlocks, setLoopBlocks] = useState<TLoopIterationBlock[]>([]);
  
  const [pending, setPending] = useState<{ [url: string]: boolean }>({});
  
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'search' | 'fetch' | 'summarize' | 'observe' | 'reflect'>(PHASES.idle);
  const [error, setError] = useState<string | null>(null);
  
  const [reflect, setReflect] = useState<TReflectState | null>(null);
  const [observation, setObservation] = useState<TObservation | null>(null);
  const [streamingObservation, setStreamingObservation] = useState<TObservation | null>(null);
  
  const [outputMarkdown, setOutputMarkdown] = useState<string>("");
  const [outputError, setOutputError] = useState<string | null>(null);
  const [tab, setTab] = useState("agent");
  
  const [activeRequests, setActiveRequests] = useState(0);
  const isPending = activeRequests > 0;

  
  function beginRequest() { setActiveRequests(c => c + 1); }
  
  function endRequest() { setActiveRequests(c => Math.max(0, c - 1)); }

  
  
  async function trackedFetch(input: RequestInfo, init?: RequestInit) {
    beginRequest();
    try {
      return await fetch(input, init);
    } finally {
      endRequest();
    }
  }

  
  useEffect(() => {
    async function unwrapParams() {
      const p = await params;
      if (typeof p.runId === 'string' && /^[0-9a-fA-F-]{36}$/.test(p.runId)) {
        setRunId(p.runId);
        setError(null);
      } else {
        setRunId(null);
        setError('Invalid or missing runId');
        console.error('[useRunDetail] Invalid or missing runId', p);
      }
    }
    unwrapParams();
  }, [params]);

  
  useEffect(() => {
    if (!runId) return;
    async function fetchAgentState() {
      const { data, error } = await supabase
        .from("agent_state")
        .select("*, agent_ctx:agent_ctx_id(*)")
        .eq("id", runId)
        .maybeSingle();

      if (error) {
        const msg =
          typeof (error as { message?: unknown }).message === "string"
            ? String((error as { message?: unknown }).message)
            : "Failed to fetch run";
        setError(`Failed to fetch agent_state: ${msg}`);
        console.error("[useRunDetail] Failed to fetch agent_state", { error, data, runId });
        return;
      }

      if (!data) {
        setError("Run not found (it may have been deleted).");
        console.warn("[useRunDetail] agent_state not found", { runId });
        return;
      }

      setError(null);
      setAgentState(data as TAgentStateWithCtx);
    }
    fetchAgentState();
  }, [runId]);

  
  const { runSearch } = useSearch(trackedFetch);
  const { fetchContents } = useFetchContents(trackedFetch, (updater) => setPending(updater));
  const { summarizeAll } = useSummaries(
    (updater) => setPending(updater),
    (updater) => setSummaries((prev) => updater(prev as TSummariesMap)),
    (updater) => setSummaryMeta((prev) => updater(prev)),
    { beginRequest, endRequest }
  );
  const { runObserve } = useObserve(
    (o) => setStreamingObservation(o),
    (o) => setObservation(o),
    (updater) => setError((prev) => updater(prev)),
    { beginRequest, endRequest }
  );
  const { runReflect } = useReflectHook(trackedFetch);
  const { runOutput } = useOutput(
    (updater) => setOutputMarkdown((prev) => updater(prev)),
    (updater) => setOutputError((prev) => updater(prev)),
    { beginRequest, endRequest }
  );

  
  
  useEffect(() => {
    const agentStateId = agentState?.id;
    if (!agentStateId) return;
    
    if (outputMarkdown.trim().length > 0) return;

    let cancelled = false;

    async function loadPersistedOutput() {
      try {
        const { data: steps, error: stepErr } = await supabase
          .from("plan_step")
          .select("id, created_at")
          .eq("agent_state_id", agentStateId)
          .eq("tool_name", "output")
          .order("created_at", { ascending: false })
          .limit(1);
        if (cancelled) return;
        if (stepErr || !steps || steps.length === 0) return;

        const stepId = steps[0]?.id as string | undefined;
        if (!stepId) return;

        const { data: results, error: resultErr } = await supabase
          .from("tool_result")
          .select("data, ok, created_at")
          .eq("plan_step_id", stepId)
          .order("created_at", { ascending: false })
          .limit(1);
        if (cancelled) return;
        if (resultErr || !results || results.length === 0) return;

        const first = results[0] as { ok?: boolean; data?: unknown };
        if (first?.ok === false) return;
        const data = first?.data;
        const md =
          data && typeof data === "object" && data !== null
            ? (data as Record<string, unknown>).markdown
            : null;
        if (typeof md === "string" && md.trim().length > 0) {
          setOutputMarkdown(md);
        }
      } catch {
        
      }
    }

    loadPersistedOutput();
    return () => {
      cancelled = true;
    };
  }, [agentState?.id, outputMarkdown]);

  
  
  
  
  
  
  
  
  
  async function runLoopCycle(overrideQuery?: string) {
    console.log("[useRunDetail] LOOP cycle started");
    setLoading(true);
    setPhase(PHASES.search);
    setError(null);
    setSearchResults([]);
    setFetchedContents([]);
    setSummaries({});
    setSearchResultsWithTextSummary([]);
    setPending({});
    setReflect(null);
    setObservation(null);
    setSummariesReady(false);
    setOutputMarkdown("");
    setOutputError(null);
    setLoopBlocks([]);
    try {
      const baseQuery =
        agentState?.agent_ctx?.goal_title && agentState.agent_ctx.goal_title.trim()
          ? agentState.agent_ctx.goal_title.trim()
          : (overrideQuery?.trim() || plan?.query || "").trim();
      if (!baseQuery) throw new Error("LOOP: Missing base query");

      const maxIterations = agentState?.agent_ctx?.model_max_iterations ?? 5;
      const visitedUrlsSet = new Set<string>();

      let allSearchResults: TSearchResult[] = [];
      let allContents: TUrlContent[] = [];
      let allSummaries: TSummariesMap = {};
      let allSearchResultsWithTextSummary: TSearchResultWithTextSummary[] = [];

      for (let i = 0; i < maxIterations; i++) {
        const iterationNumber = i + 1;
        const searchStart = 1 + i * MAX_WEB_SEARCH_RESULTS;
        setPhase(PHASES.search);
        console.log("[useRunDetail] ACT: web_search", { q: baseQuery, start: searchStart });

        const blockId = `${Date.now()}-${iterationNumber}`;
        setLoopBlocks((prev) =>
          prev.concat({
            id: blockId,
            iteration: iterationNumber,
            query: baseQuery,
            searchStart,
            searchResults: [],
            fetchedContents: [],
            summaries: {},
            searchResultsWithTextSummary: [],
            observation: null,
            reflect: null,
          })
        );

        const { results } = await runSearch(baseQuery, agentState?.id, searchStart);
        const rawBatchSearchResults = Array.isArray(results) ? results : [];
        const batchSearchResults = rawBatchSearchResults.filter((r) => {
          const u = r?.url;
          if (!u || typeof u !== "string") return false;
          if (visitedUrlsSet.has(u)) return false;
          visitedUrlsSet.add(u);
          return true;
        });

        allSearchResults = allSearchResults.concat(batchSearchResults);
        setSearchResults(allSearchResults);
        setLoopBlocks((prev) =>
          prev.map((b) => (b.id === blockId ? { ...b, searchResults: batchSearchResults } : b))
        );

        const urls = batchSearchResults.map((r) => r.url).filter(Boolean);
        setPhase(PHASES.fetch);
        const batchContents: TUrlContent[] = await fetchContents(urls as string[], agentState?.id);
        allContents = allContents.concat(batchContents);
        setFetchedContents(allContents);
        setLoopBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, fetchedContents: batchContents } : b));

        setPhase(PHASES.summarize);
        const batchSummaries: TSummariesMap = await summarizeAll(batchContents, agentState?.id);
        allSummaries = { ...allSummaries, ...batchSummaries };
        setSummaries(allSummaries);
        setLoopBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, summaries: batchSummaries } : b));

        const blockedSet = new Set(
          batchContents
            .filter((c) => c.content && c.content.includes(BLOCKED_FETCH_MESSAGE))
            .map((c) => c.url)
        );
        const batchSearchResultsWithTextSummary: TSearchResultWithTextSummary[] = batchSearchResults
          .filter((result) => !blockedSet.has(result.url))
          .map((result) => ({
            ...result,
            summary:
              typeof batchSummaries[result.url] === "string"
                ? batchSummaries[result.url]
                : JSON.stringify(batchSummaries[result.url] || ""),
          }));
        allSearchResultsWithTextSummary = allSearchResultsWithTextSummary.concat(batchSearchResultsWithTextSummary);
        setSearchResultsWithTextSummary(allSearchResultsWithTextSummary);
        setLoopBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, searchResultsWithTextSummary: batchSearchResultsWithTextSummary } : b));

        setSummariesReady(true);

        setPhase(PHASES.observe);
        console.log("[useRunDetail] OBSERVE (stream) start", {
          iteration: iterationNumber,
          query: baseQuery,
          start: searchStart,
          agent_state_id: agentState?.id,
        });
        const { finalObservation, observationId } = await runObserve({
          summaries: allSummaries,
          fetchedContents: allContents,
          plan,
          agentState,
          summaryMeta,
          agent_state_id: agentState?.id,
        });
        setLoopBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, observation: finalObservation ?? null } : b));

        setPhase(PHASES.reflect);
        if (observationId && finalObservation) {
          const { reflectState, error: reflectError } = await runReflect({
            observationId,
            observation: finalObservation,
            agentStateId: agentState?.id,
            priorSummary: agentState?.summary || null,
          });

          if (reflectError) {
            setError(reflectError);
            setLoopBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, reflect: null } : b));
            break;
          }

          if (reflectState) {
            setReflect(reflectState);
            setLoopBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, reflect: reflectState } : b));
            setAgentState((s) => (s ? { ...s, summary: reflectState.updated_summary } : s));

            if (reflectState.goal_satisfied) {
              try {
                await runOutput({
                  agent_goal_title: agentState?.agent_ctx?.goal_title || baseQuery,
                  search_results_with_summaries: allSearchResultsWithTextSummary,
                  agent_state_id: agentState?.id,
                  max_tokens: DEFAULT_OUTPUT_MAX_TOKENS,
                });
              } catch {
                setOutputError(() => "Output generation failed");
              }
              break;
            }

            // Not satisfied: continue to next paginated batch of the same base query.
            continue;
          }
        } else if (!observationId && finalObservation) {
          // If observe was not persisted, assume satisfied to avoid infinite loop.
          const reflectState: TReflectState = {
            goal_satisfied: true,
            critique: finalObservation.headline,
            updated_summary: finalObservation.details,
          };
          setReflect(reflectState);
          setLoopBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, reflect: reflectState } : b));
          setAgentState((s) => (s ? { ...s, summary: reflectState.updated_summary } : s));

          try {
            await runOutput({
              agent_goal_title: agentState?.agent_ctx?.goal_title || baseQuery,
              search_results_with_summaries: allSearchResultsWithTextSummary,
              agent_state_id: agentState?.id,
              max_tokens: DEFAULT_OUTPUT_MAX_TOKENS,
            });
          } catch {
            setOutputError(() => "Output generation failed");
          }
          break;
        }

        if (i === maxIterations - 1) {
          setError(`Goal not satisfied after ${maxIterations} iterations`);
        }
      }

      // Update steps_used from DB once per overall loop.
      if (agentState?.id) {
        const recount = await supabase
          .from("plan_step")
          .select("id")
          .eq("agent_state_id", agentState.id);
        if (!recount.error) {
          const stepsUsed = recount.data?.length || 0;
          setAgentState((s) => (s ? { ...s, steps_used: stepsUsed } : s));
        }
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "LOOP cycle error";
      setError(errMsg);
      console.error("[useRunDetail] LOOP cycle error", e);
    }
    setLoading(false);
    setPhase(PHASES.idle);
    console.log("[useRunDetail] LOOP cycle finished");
  }

  
  return {
    agentState,
    plan,
    searchResults,
    fetchedContents,
    summaries,
    searchResultsWithTextSummary,
    summariesReady,
    pending,
    observation,
    streamingObservation,
    reflect,
    outputMarkdown,
    outputError,
    loading,
    phase,
    error,
    tab,
    setTab,
    runLoopCycle,
    isPending,
    loopBlocks,
  };
}
