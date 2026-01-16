"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TOOLS } from "./constants";
import { ToolModal } from "./ToolModal";
import { Card } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useTools } from "./hooks/useTools";
import type { TTool, TToolGroup } from "./types";
import { TOOLS_HELP_DOCUMENTATION } from "./helpDocumentation";

export function ToolsComponent() {
  const { typeBadgeColor } = useTools();
  const [selectedTool, setSelectedTool] = useState<TTool | null>(null);
  const [tab, setTab] = useState("catalog");

  // Tools currently invoked by the run loop UX (Runs -> RunDetail hooks).
  const RUN_LOOP_TOOLS = new Set(["web_search", "fetch_url", "get_text_summary"]);

  // Tools that have corresponding API route implementations.
  const IMPLEMENTED_TOOLS = new Set([
    "web_search",
    "fetch_url",
    "get_hyperlinks",
    "get_text_summary",
    "start_agent",
  ]);

  return (
    <Card>
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>
        <TabsContent value="catalog" selectedValue={tab}>
          <div className="space-y-10 mt-6">
            {TOOLS.map((group: TToolGroup) => (
              <div key={group.group}>
                <h2 className="text-xl font-bold mb-4 text-white">{group.group}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.tools.map((tool: TTool) => (
                    (() => {
                      const isImplemented = IMPLEMENTED_TOOLS.has(tool.name);
                      const isUsedInRunLoop = RUN_LOOP_TOOLS.has(tool.name);
                      const isInactive = !isImplemented || !isUsedInRunLoop;
                      const inactiveClass = !isImplemented
                        ? "bg-neutral-950/60 border-dashed border-neutral-800 hover:border-neutral-700"
                        : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-600";

                      return (
                    <button
                      key={tool.name}
                      className={`rounded p-6 border shadow text-left w-full focus:outline-none ${
                        isInactive
                          ? inactiveClass
                          : "bg-neutral-800 border-neutral-700 hover:border-blue-500"
                      }`}
                      onClick={() => setSelectedTool(tool)}
                      type="button"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-semibold text-white">
                          {tool.name}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded uppercase ${typeBadgeColor(
                            tool.type
                          )}`}
                        >
                          {tool.type}
                        </span>
                      </div>
                      <div className="text-sm text-neutral-300 mb-2">
                        {tool.desc}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(tool.tags ? tool.tags.split(",") : []).map((tag: string) => (
                          <span
                            key={tag.trim()}
                            className="text-xs bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </button>
                      );
                    })()
                  ))}
                </div>
              </div>
            ))}
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
            >{TOOLS_HELP_DOCUMENTATION}</ReactMarkdown>
          </div>
        </TabsContent>
      </Tabs>
      {selectedTool && (
        <ToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
      )}
    </Card>
  );
}
