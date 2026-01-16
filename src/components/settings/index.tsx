
"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/Tabs";
import { Card } from "@/components/ui/Card";
import { DatabaseConnectionTest } from "./components/DatabaseConnectionTest";
import { OllamaConnectionTest } from "./components/OllamaConnectionTest";

import { GoogleSearchConfigTest } from "./components/GoogleSearchConfigTest";
import { SETTINGS_HELP_DOCUMENTATION } from "./helpDocumentation";

export function SettingsComponent() {
  const [tab, setTab] = useState("ollama");
  return (
    <Card>
      <h2 className="text-2xl font-bold mb-2">Settings</h2>
      <p className="text-neutral-400 mb-6">
        Explore and manage all available settings for AI agent connectivity, database integration, and diagnostics. Use these tools to verify your Ollama LLM and Supabase/Drizzle connections, monitor system health, and ensure your development environment is configured correctly.
      </p>
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="ollama">Ollama Test</TabsTrigger>
          <TabsTrigger value="db">Supabase Database Test</TabsTrigger>
          <TabsTrigger value="google">Google Search Config</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>
        <TabsContent value="ollama" selectedValue={tab}>
          <OllamaConnectionTest />
        </TabsContent>
        <TabsContent value="db" selectedValue={tab}>
          <DatabaseConnectionTest />
        </TabsContent>
        <TabsContent value="google" selectedValue={tab}>
          <GoogleSearchConfigTest />
        </TabsContent>
        <TabsContent value="help" selectedValue={tab}>
          <div className="w-full min-h-[400px] bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-lg p-6 text-sm overflow-auto mt-8">
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
            >{SETTINGS_HELP_DOCUMENTATION}</ReactMarkdown>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
