"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { WebToolWorkflow } from "@/components/tools/WebToolWorkflow";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { HOME_HELP_DOCUMENTATION } from "./helpDocumentation";

export default function Home() {
  const [tab, setTab] = useState("overview");
  return (
    <div className="font-sans grid grid-rows-[auto_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <section className="row-start-1 w-full max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-4">OGTO – Open Goal-Task Orchestrator</h1>
        <p className="text-neutral-400 mb-6">
          Build, execute, and monitor AI research agents in real time. OGTO uses a modular architecture separating UI, AI runtime logic, and data persistence for scalable experimentation and observability.
        </p>
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" selectedValue={tab}>
            <div className="mt-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Navigation</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <a href="/agents" className="bg-neutral-900 border border-neutral-800 rounded p-3 hover:border-blue-500">
                    <div className="font-semibold text-blue-400">🤖 Agents</div>
                    <div className="text-neutral-400 text-xs">Create & configure research agents</div>
                  </a>
                  <a href="/runs" className="bg-neutral-900 border border-neutral-800 rounded p-3 hover:border-blue-500">
                    <div className="font-semibold text-blue-400">⚡ Runs</div>
                    <div className="text-neutral-400 text-xs">Monitor execution & view output</div>
                  </a>
                  <a href="/tools" className="bg-neutral-900 border border-neutral-800 rounded p-3 hover:border-blue-500">
                    <div className="font-semibold text-blue-400">🛠️ Tools</div>
                    <div className="text-neutral-400 text-xs">Browse tool catalog</div>
                  </a>
                  <a href="/settings" className="bg-neutral-900 border border-neutral-800 rounded p-3 hover:border-blue-500">
                    <div className="font-semibold text-blue-400">⚙️ Settings</div>
                    <div className="text-neutral-400 text-xs">Test service connections</div>
                  </a>
                </div>
              </div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Use Cases</h2>
                <div className="text-xs space-y-1 text-neutral-300">
                  <div className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2">
                    <span className="text-blue-400">Tech Research:</span> "Best frameworks for production-grade AI agents in 2025"
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2">
                    <span className="text-blue-400">Trend Analysis:</span> "What's hype vs reality in generative AI adoption 2025"
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2">
                    <span className="text-blue-400">Competitive Intel:</span> "How do LangChain, CrewAI, and AutoGen compare"
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Quick Start</h2>
                <ol className="list-decimal list-inside text-neutral-300 space-y-2 text-sm">
                  <li><strong>Settings</strong> — Verify Ollama, Database, and Google Search connections</li>
                  <li><strong>Agents</strong> — Enter a Goal Title, wait for autofill, click Create</li>
                  <li><strong>Runs</strong> — Click Run LOOP, watch iterations, view final output</li>
                </ol>
              </div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">LOOP Strategy</h2>
                <p className="text-xs text-neutral-400 mb-2">
                  A <strong>Run</strong> executes iterations until <code>goal_satisfied = true</code> or limits reached.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded">Search</span>
                  <span className="text-neutral-500">→</span>
                  <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded">Fetch</span>
                  <span className="text-neutral-500">→</span>
                  <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded">Summarize</span>
                  <span className="text-neutral-500">→</span>
                  <span className="bg-purple-900/50 text-purple-300 px-2 py-1 rounded">Observe</span>
                  <span className="text-neutral-500">→</span>
                  <span className="bg-purple-900/50 text-purple-300 px-2 py-1 rounded">Reflect</span>
                  <span className="text-neutral-500">→</span>
                  <span className="bg-green-900/50 text-green-300 px-2 py-1 rounded">Output</span>
                </div>
              </div>
              <div className="mt-8">
                <WebToolWorkflow />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="help" selectedValue={tab}>
            <div className="w-full min-h-[400px] bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-lg p-6 text-sm overflow-auto mt-6">
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
              >{HOME_HELP_DOCUMENTATION}</ReactMarkdown>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
