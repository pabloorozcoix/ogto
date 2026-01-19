
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";

import type { TUIArtifact, TUIClaim } from "./types";
import type { TObservation, TReflectState } from "@/components/runs/types";
import { Loader } from "@/components/ui/Loader";
import { DateTime } from "@/components/ui/DateTime";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useRunDetail } from "./hooks/useRunDetail";
import type { TLoopIterationBlock } from "./hooks/useRunDetail";
import {
  CONFIDENCE_DECIMALS,
  CONFIDENCE_HIGH_MIN,
  CONFIDENCE_LOW_MIN,
  CONFIDENCE_MED_MIN,
  RUN_DETAIL_ARTIFACT_SUMMARY_PREVIEW_CHARS,
} from "./constants";
import { JSON_PRETTY_PRINT_SPACES, MAX_WEB_SEARCH_RESULTS } from "@/lib/constants";
import { RUNS_HELP_DOCUMENTATION } from "./helpDocumentation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/toast";

export default function RunDetail({ params }: { params: Promise<{ runId: string }> }) {
  const router = useRouter();
  const {
    agentState,
    plan,
    loopBlocks,
    summaries,
    searchResultsWithTextSummary,
    summariesReady,
    pending,
    observation,
    reflect,
    outputMarkdown,
    outputError,
    loading,
    error,
    tab,
    setTab,
    runLoopCycle,
    isPending,
  } = useRunDetail(params);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const renderText = (value: unknown) => {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    try {
      return JSON.stringify(value, null, JSON_PRETTY_PRINT_SPACES);
    } catch {
      return String(value);
    }
  };

  if (!agentState) {
    if (error) {
      return (
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-300 mb-2">Failed to load run</h1>
            <div className="text-sm text-neutral-200 whitespace-pre-wrap">{error}</div>
            <button
              className="mt-4 text-xs px-3 py-2 rounded-md border border-neutral-700 bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
              onClick={() => router.push("/runs")}
            >
              Back to runs
            </button>
          </div>
        </div>
      );
    }
    return <div className="text-center py-8">Loading...</div>;
  }

  const handleDelete = async () => {
    if (!agentState?.id) return;
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/runs/${agentState.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        toast({
          title: "Failed to delete run",
          description: json?.error || `HTTP ${res.status}`,
          variant: "error",
        });
        return;
      }
      toast({ title: "Run deleted", variant: "success" });
      router.push("/runs");
    } catch (err: unknown) {
      toast({
        title: "Failed to delete run",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {isPending && <Loader />}
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList selectedValue={tab} onSelect={setTab} className="mb-4">
          <TabsTrigger value="agent" selectedValue={tab} onSelect={setTab}>🧑‍💼 Agent</TabsTrigger>
          <TabsTrigger value="config" selectedValue={tab} onSelect={setTab}>⚙️ Config</TabsTrigger>
          <TabsTrigger value="run" selectedValue={tab} onSelect={setTab}>🏃 Run</TabsTrigger>
          <TabsTrigger value="help" selectedValue={tab} onSelect={setTab}>❓ Help</TabsTrigger>
        </TabsList>
        <TabsContent value="agent" selectedValue={tab} className="">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 shadow mb-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-blue-400 mb-2">
                {agentState.agent_ctx?.goal_title || "Untitled Agent"}
              </h1>
              <button
                className="text-xs px-3 py-2 rounded-md border border-red-800 bg-red-950 text-red-200 hover:bg-red-900 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => setDeleteOpen(true)}
                disabled={isDeleting}
                aria-label="Delete this run"
              >
                Delete
              </button>
            </div>
            <div className="text-xs text-neutral-400 mb-2">Goal System Prompt</div>
            <MarkdownViewer
              markdown={renderText(agentState.agent_ctx?.goal_system_prompt)}
              placeholder="No system prompt defined."
            />
            <div className="text-xs text-neutral-500 mb-2 mt-4">Run ID: {agentState.id}</div>
            <div className="flex gap-4 text-sm text-neutral-400 mb-2">
              <span>Iterations: {agentState.iterations_completed}</span>
              <span>Steps: {agentState.steps_used}</span>
              <span>Tokens: {agentState.tokens_used}</span>
              <span>Cost: ${agentState.cost_used}</span>
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Last updated: <DateTime value={agentState.updated_at} />
            </div>
            <div className="mt-4 text-neutral-200">
              <strong>Summary:</strong> {renderText(agentState.summary)}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 shadow">
            <h2 className="text-xl font-bold text-blue-300 mb-2">Latest Output</h2>
            {outputError && (
              <div className="bg-red-900 text-red-200 border border-red-700 rounded p-3 mb-4">
                <strong>Error:</strong> {outputError}
              </div>
            )}
            <div className="text-xs text-neutral-400 mb-2">Rendered Markdown</div>
            <MarkdownViewer markdown={renderText(outputMarkdown)} placeholder="No output generated yet." />
          </div>
        </TabsContent>
        <TabsContent value="config" selectedValue={tab} className="">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Config Preview</h2>
            {(() => {
              const configPreview = {
                agent_information: {
                  agent_name: agentState.agent_ctx?.agent_name ?? "",
                  agent_role: agentState.agent_ctx?.agent_role ?? ""
                },
                goal_definition: {
                  goal_title: agentState.agent_ctx?.goal_title ?? "",
                  goal_system_prompt: agentState.agent_ctx?.goal_system_prompt ?? ""
                },
                model_configuration: {
                  model: agentState.agent_ctx?.model ?? "",
                  model_temperature: agentState.agent_ctx?.model_temperature ?? "",
                  model_output_format: agentState.agent_ctx?.model_output_format ?? "",
                  model_max_tokens: agentState.agent_ctx?.model_max_tokens ?? "",
                  model_max_iterations: agentState.agent_ctx?.model_max_iterations ?? ""
                },
                budget_constraints: {
                  budget_max_cost: agentState.agent_ctx?.budget_max_cost ?? "",
                  budget_max_tokens: agentState.agent_ctx?.budget_max_tokens ?? "",
                  budget_max_execution_time: agentState.agent_ctx?.budget_max_execution_time ?? "",
                  budget_max_steps: agentState.agent_ctx?.budget_max_steps ?? ""
                }
              };
              return (
                <pre className="bg-neutral-950 text-green-400 rounded p-4 text-sm overflow-x-auto font-mono">
                  {JSON.stringify(configPreview, null, JSON_PRETTY_PRINT_SPACES)}
                </pre>
              );
            })()}
          </div>
        </TabsContent>
        <TabsContent value="run" selectedValue={tab} className="">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 shadow mb-6">
            <h2 className="text-xl font-bold text-indigo-400 mb-2">LOOP Strategy</h2>
            {error && (
              <div className="bg-red-900 text-red-200 border border-red-700 rounded p-3 mb-4">
                <strong>Error:</strong> {error}
              </div>
            )}
            <button
              id="run-detail-run-loop-button"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
              onClick={() => runLoopCycle()}
              disabled={loading || !agentState?.id || !!error}
            >
              {loading ? "Running LOOP..." : "Run LOOP"}
            </button>
            
            {plan && (
              <div className="mb-4">
                <h3 className="text-lg font-bold text-blue-300 mb-2">Plan</h3>
                <div><strong>Query:</strong> {plan.query}</div>
                <div className="mt-2">
                  <div className="text-xs text-neutral-400 mb-2">System Prompt</div>
                  <MarkdownViewer markdown={renderText(plan.systemPrompt)} placeholder="No system prompt defined." />
                </div>
                <div className="mt-2"><strong>Agent Name:</strong> {plan.agentName}</div>
              </div>
            )}

            {loopBlocks.length > 0 && (
              <div className="space-y-6">
                {loopBlocks.map((block: TLoopIterationBlock) => (
                  <div key={block.id} className="border border-neutral-800 rounded-lg p-4 bg-neutral-950">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="text-sm font-semibold text-indigo-200">
                        Iteration {block.iteration}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-neutral-400 truncate max-w-[280px]">{block.query}</div>
                        <div className="text-[11px] text-neutral-500">
                          start {block.searchStart}–{block.searchStart + MAX_WEB_SEARCH_RESULTS - 1}
                        </div>
                      </div>
                    </div>

                    {block.fetchedContents.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-indigo-300 mb-2">Fetched Contents & Summaries</h3>
                        {block.fetchedContents.map(({ url, content }) => (
                          <div key={url} className="mb-2">
                            <div className="text-xs text-blue-400 mb-1">{url}</div>
                            <div className="bg-neutral-950 text-neutral-200 rounded p-2 mb-1 text-xs max-h-32 overflow-y-auto">{content}</div>
                            <div className="bg-neutral-950 text-green-400 rounded p-2 mb-1 text-xs whitespace-pre-wrap">
                              <strong>Summary:</strong>{" "}
                              {summaries[url]
                                ? renderText(summaries[url])
                                : (pending[url] ? "Summarizing..." : "Summary queued")}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {block.observation && block.reflect && (
                      <ObserveReflectBlock
                        observation={block.observation}
                        reflect={block.reflect}
                        renderText={renderText}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {summariesReady && searchResultsWithTextSummary && searchResultsWithTextSummary.length > 0 && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 shadow mt-4">
                <h3 className="text-lg font-bold text-green-400 mb-2">Web Search Results with Summaries</h3>
                <pre className="bg-neutral-900 text-green-300 rounded p-4 text-xs overflow-x-auto font-mono mb-4">
                  {JSON.stringify(searchResultsWithTextSummary.map(r => ({...r, summary: typeof r.summary === 'string' ? r.summary : JSON.stringify(r.summary)})), null, JSON_PRETTY_PRINT_SPACES)}
                </pre>
              </div>
            )}

            {/* OUTPUT (Markdown blog post) */}
            {summariesReady && observation && reflect?.goal_satisfied && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 shadow mt-4">
                <h3 className="text-lg font-bold text-blue-300 mb-2">Output</h3>
                {outputError && (
                  <div className="bg-red-900 text-red-200 border border-red-700 rounded p-3 mb-4">
                    <strong>Error:</strong> {outputError}
                  </div>
                )}
                <div className="text-xs text-neutral-400 mb-2">Rendered Markdown</div>
                <MarkdownViewer markdown={renderText(outputMarkdown || (loading ? "Generating output..." : ""))} placeholder="" />
              </div>
            )}

            {/* REFLECT */}
            {/* (Old individual reflect panel removed in favor of combined JSON) */}
          </div>
        </TabsContent>
        <TabsContent value="help" selectedValue={tab}>
          <div className="w-full min-h-[400px] bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-lg p-6 text-sm overflow-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-blue-400 mt-2 mb-4">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-blue-300 mt-6 mb-3 border-b border-neutral-700 pb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold text-indigo-300 mt-5 mb-2">{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-base font-semibold text-neutral-100 mt-4 mb-2">{children}</h4>
                ),
                p: ({ children }) => (
                  <p className="text-neutral-200 leading-7 mb-3">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 space-y-1 text-neutral-200 mb-4">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 space-y-1 text-neutral-200 mb-4">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-neutral-200">{children}</li>
                ),
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300">
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-neutral-50">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-neutral-300">{children}</em>
                ),
                code: (props) =>
                  (props as React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }).inline ? (
                    <code className="bg-neutral-800 text-green-400 px-1.5 py-0.5 rounded text-[13px] font-mono">
                      {props.children}
                    </code>
                  ) : (
                    <code className="text-[13px] font-mono">{props.children}</code>
                  ),
                pre: ({ children }) => (
                  <pre className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 overflow-x-auto text-[13px] font-mono mb-4 text-green-400">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 my-4 text-neutral-300 italic">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full border-collapse text-sm">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-neutral-700 bg-neutral-800 px-3 py-2 text-left text-neutral-100 font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-neutral-700 px-3 py-2 text-neutral-200">
                    {children}
                  </td>
                ),
                hr: () => <hr className="border-neutral-700 my-6" />,
              }}
            >{RUNS_HELP_DOCUMENTATION}</ReactMarkdown>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this run?"
        description="This will permanently delete the run and its related data."
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        destructive
        confirmDisabled={isDeleting}
        onCancel={() => {
          if (!isDeleting) setDeleteOpen(false);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function MarkdownViewer({
  markdown,
  placeholder,
}: {
  markdown: string;
  placeholder: string;
}) {
  const text = (markdown || "").trim();
  return (
    <div
      className="w-full min-h-[260px] bg-neutral-900 text-neutral-100 border border-neutral-800 rounded p-4 text-sm overflow-auto"
      aria-label="Output markdown"
      title="Output markdown"
    >
      {text.length === 0 ? (
        <div className="text-neutral-500 text-sm">{placeholder}</div>
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-neutral-100 mt-2 mb-3">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-neutral-100 mt-4 mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold text-neutral-100 mt-4 mb-2">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-neutral-200 leading-6 mb-3">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-5 space-y-1 text-neutral-200 mb-3">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 space-y-1 text-neutral-200 mb-3">{children}</ol>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-blue-300 underline"
              >
                {children}
              </a>
            ),
            pre: ({ children }) => (
              <pre className="bg-neutral-950 border border-neutral-800 rounded p-3 overflow-x-auto text-[12px] font-mono mb-3">
                {children}
              </pre>
            ),
            code: (props) =>
              (props as React.ComponentPropsWithoutRef<"code"> & { inline?: boolean })
                .inline ? (
                <code className="bg-neutral-800 px-1 py-0.5 rounded text-[12px] font-mono">
                  {props.children}
                </code>
              ) : (
                <code className="text-[12px] font-mono">{props.children}</code>
              ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-3">
                <table className="w-full border-collapse text-xs">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-neutral-800 bg-neutral-950 px-2 py-1 text-left text-neutral-200">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-neutral-800 px-2 py-1 text-neutral-200">{children}</td>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-neutral-700 pl-3 text-neutral-200 mb-3">
                {children}
              </blockquote>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      )}
    </div>
  );
}

function ObserveReflectBlock({
  observation,
  reflect,
  renderText,
}: {
  observation: TObservation;
  reflect: TReflectState;
  renderText: (value: unknown) => string;
}) {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 shadow mt-4">
      <h3 className="text-lg font-bold text-purple-400 mb-2">Observe & Reflect</h3>

      <details className="mb-4">
        <summary className="cursor-pointer text-sm text-purple-300">Raw JSON</summary>
        <pre className="bg-neutral-900 text-purple-200 rounded p-4 text-xs overflow-x-auto font-mono mt-2">
          {JSON.stringify({ observation, reflect }, null, JSON_PRETTY_PRINT_SPACES)}
        </pre>
      </details>

      <div className="mb-4">
        <h4 className="font-semibold text-indigo-300 mb-2">Artifacts & Claims</h4>
        <div className="text-[10px] text-neutral-400 mb-3 flex flex-wrap gap-3">
          <span><span className="inline-block w-3 h-3 bg-green-600 mr-1 align-middle" /> High ≥ 0.80</span>
          <span><span className="inline-block w-3 h-3 bg-blue-600 mr-1 align-middle" /> Medium 0.60–0.79</span>
          <span><span className="inline-block w-3 h-3 bg-yellow-600 mr-1 align-middle" /> Low 0.40–0.59</span>
          <span><span className="inline-block w-3 h-3 bg-red-700 mr-1 align-middle" /> Very Low &lt; 0.40</span>
        </div>

        {Array.isArray(observation?.artifacts) && observation.artifacts.length > 0 ? (
          <div className="space-y-4">
            {(observation.artifacts as unknown as TUIArtifact[]).map((a: TUIArtifact, idx: number) => (
              <div key={idx} className="border border-neutral-800 rounded p-3 bg-neutral-900">
                <div className="text-sm font-semibold text-blue-300 mb-1">{a.title}</div>
                {a.source_url && <div className="text-xs text-neutral-500 mb-1 truncate">{a.source_url}</div>}
                <div className="text-xs text-neutral-300 mb-2 whitespace-pre-wrap">
                  {renderText(a.summary).slice(0, RUN_DETAIL_ARTIFACT_SUMMARY_PREVIEW_CHARS)}
                </div>
                <div className="text-xs text-amber-300 mb-2">Reason: {a.relevance_reason || ''}</div>
                {a.claims && a.claims.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-green-400 mb-1">Claims ({a.claims.length})</div>
                    <ul className="space-y-1">
                      {a.claims.map((c: TUIClaim, ci: number) => {
                        const conf = typeof c.confidence === 'number' ? c.confidence : 0;
                        const tier =
                          conf >= CONFIDENCE_HIGH_MIN
                            ? 'high'
                            : conf >= CONFIDENCE_MED_MIN
                              ? 'med'
                              : conf >= CONFIDENCE_LOW_MIN
                                ? 'low'
                                : 'verylow';
                        const color = tier === 'high' ? 'bg-green-700 text-green-100' : tier === 'med' ? 'bg-blue-700 text-blue-100' : tier === 'low' ? 'bg-yellow-700 text-yellow-100' : 'bg-red-800 text-red-200';
                        return (
                          <li key={ci} className="text-xs">
                            <div className={`inline-block px-2 py-0.5 rounded mr-2 font-mono ${color}`}>{conf.toFixed(CONFIDENCE_DECIMALS)}</div>
                            <span className="text-neutral-200">{c.statement}</span>
                            {c.rationale && (
                              <div className="mt-1 ml-4 text-[10px] text-neutral-400 italic">{c.rationale}</div>
                            )}
                            {typeof c.heuristic_confidence === 'number' && typeof c.llm_confidence === 'number' && (
                              <div className="ml-4 mt-0.5 text-[10px] text-neutral-500">heu {c.heuristic_confidence.toFixed(CONFIDENCE_DECIMALS)} | llm {c.llm_confidence.toFixed(CONFIDENCE_DECIMALS)}</div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-neutral-500">No artifacts</div>
        )}
      </div>
    </div>
  );
}
