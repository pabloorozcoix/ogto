"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Loader } from "@/components/ui/Loader";
import { OLLAMA_MODEL } from "@/lib/localOllama";
import { JSON_PRETTY_PRINT_SPACES } from "@/lib/constants";
import { useAgents } from "./hooks/useAgents";
import { Controller, useWatch } from "react-hook-form";
import {
  AGENTS_FORM_DEFAULT_VALUES,
  AGENT_TEXT_MIN_LEN,
  MODEL_TEMPERATURE_MAX,
  MODEL_TEMPERATURE_MIN,
  MODEL_TEMPERATURE_STEP,
} from "./constants";
import { useAgentsFormSchema } from "./hooks/useAgentsFormSchema";
import { AGENTS_HELP_DOCUMENTATION } from "./helpDocumentation";

export function AgentsComponent() {
  const form = useAgentsFormSchema(AGENTS_FORM_DEFAULT_VALUES);

  const goalTitle = useWatch({ control: form.control, name: "goal_title" });
  const model = useWatch({ control: form.control, name: "model" });

  const [autofillLoading, setAutofillLoading] = React.useState(false);
  const [autofillError, setAutofillError] = React.useState<string | null>(null);
  const lastAutofilledTitleRef = React.useRef<string>("");
  const initializedTitleRef = React.useRef(false);
  const debounceTimerRef = React.useRef<number | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const title = (goalTitle || "").trim();

    // Do not run on initial page load; only after the user changes the goal title.
    if (!initializedTitleRef.current) {
      initializedTitleRef.current = true;
      lastAutofilledTitleRef.current = title;
      setAutofillLoading(false);
      setAutofillError(null);
      return;
    }

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (title.length < AGENT_TEXT_MIN_LEN) {
      setAutofillLoading(false);
      setAutofillError(null);
      lastAutofilledTitleRef.current = "";
      abortRef.current?.abort();
      abortRef.current = null;
      return;
    }

    if (title === lastAutofilledTitleRef.current) return;

    debounceTimerRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setAutofillLoading(true);
      setAutofillError(null);

      try {
        const res = await fetch("/api/llm/autofill-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ goal_title: title, model: model || OLLAMA_MODEL }),
        });
        const json = (await res.json().catch(() => null)) as
          | null
          | { ok?: boolean; error?: string; agent_name?: string; agent_role?: string; goal_system_prompt?: string };

        if (!res.ok || !json || json.ok === false) {
          setAutofillError(json?.error || `HTTP ${res.status}`);
          return;
        }

        if (typeof json.agent_name === "string") {
          form.setValue("agent_name", json.agent_name, { shouldValidate: true, shouldDirty: true });
        }
        if (typeof json.agent_role === "string") {
          form.setValue("agent_role", json.agent_role, { shouldValidate: true, shouldDirty: true });
        }
        if (typeof json.goal_system_prompt === "string") {
          form.setValue("goal_system_prompt", json.goal_system_prompt, { shouldValidate: true, shouldDirty: true });
        }

        lastAutofilledTitleRef.current = title;
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setAutofillError(e instanceof Error ? e.message : "Autofill failed");
      } finally {
        setAutofillLoading(false);
      }
    }, 450);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [goalTitle, model, form]);

  const {
    register,
    handleSubmit,
    errors,
    isValid,
    control,
    modelTemperatureValue,
    config,
    tab,
    setTab,
    onSubmit,
  } = useAgents(form);
  return (
    <Card className="max-w-2xl mx-auto">
      {autofillLoading && <Loader />}
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Tabs value={tab} onValueChange={setTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>
          <TabsContent value="form" selectedValue={tab}>
            
            <Card className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-400">
                Agent Information
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-neutral-300 mb-1">
                    Agent Name
                  </label>
                  <Input
                    type="text"
                    {...register("agent_name")}
                    readOnly
                    aria-readonly="true"
                    required
                    placeholder="Enter agent name"
                    title="Agent Name"
                    className="bg-neutral-950 text-neutral-200"
                  />
                  {errors.agent_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.agent_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">
                    Agent Role
                  </label>
                  <Input
                    type="text"
                    {...register("agent_role")}
                    readOnly
                    aria-readonly="true"
                    required
                    placeholder="Enter agent role"
                    title="Agent Role"
                    className="bg-neutral-950 text-neutral-200"
                  />
                  {errors.agent_role && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.agent_role.message}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            
            <Card className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-400">
                Goal Definition
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-neutral-300 mb-1">
                    Goal Title
                  </label>
                  <Input
                    type="text"
                    {...register("goal_title")}
                    required
                    placeholder="Enter goal title"
                    title="Goal Title"
                  />
                  <div className="text-xs mt-1">
                    {autofillLoading ? (
                      <span className="text-blue-300">Autofilling agent fields…</span>
                    ) : autofillError ? (
                      <span className="text-red-400">Autofill error: {autofillError}</span>
                    ) : (
                      <span className="text-neutral-500">Agent fields are auto-generated from Goal Title.</span>
                    )}
                  </div>
                  {errors.goal_title && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.goal_title.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">
                    Goal System Prompt
                  </label>
                  <Textarea
                    {...register("goal_system_prompt")}
                    readOnly
                    aria-readonly="true"
                    required
                    rows={3}
                    placeholder="Enter system prompt instructions"
                    title="Goal System Prompt"
                    className="bg-neutral-950 text-neutral-200"
                  />
                  {errors.goal_system_prompt && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.goal_system_prompt.message}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            
            <Card className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-400">
                Model Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-300 mb-1">Model</label>
                  <Select {...register("model")} required title="Model">
                    <option value={OLLAMA_MODEL}>{OLLAMA_MODEL}</option>
                  </Select>
                  {errors.model && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.model.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">
                    Model Temperature
                  </label>
                  <div className="flex items-center gap-4 py-2 min-h-[40px] bg-neutral-950 rounded-lg px-2">
                    <Slider
                      min={MODEL_TEMPERATURE_MIN}
                      max={MODEL_TEMPERATURE_MAX}
                      step={MODEL_TEMPERATURE_STEP}
                      value={
                        typeof modelTemperatureValue === "number"
                          ? modelTemperatureValue
                          : MODEL_TEMPERATURE_MIN
                      }
                      onChange={(e) => {
                        const value =
                          typeof e === "number" ? e : Number(e.target.value);
                        form.setValue("model_temperature", value, {
                          shouldValidate: true,
                        });
                      }}
                      className="w-2/3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:border-blue-300 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:outline-none [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-blue-700 [&::-webkit-slider-thumb]:ring-offset-2 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:ease-in-out [&::-webkit-slider-runnable-track]:bg-blue-900 [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-lg"
                    />
                    <span className="px-2 py-1 rounded bg-blue-900 text-blue-200 font-mono text-sm border border-blue-700 shadow">
                      {modelTemperatureValue}
                    </span>
                  </div>
                  <div className="text-xs text-blue-400 mt-1">
                    Temperature: {modelTemperatureValue}
                  </div>
                  {errors.model_temperature && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.model_temperature.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">
                    Model Output Format
                  </label>
                  <Select
                    {...register("model_output_format")}
                    required
                    title="Model Output Format"
                  >
                    <option value="markdown">Markdown</option>
                    <option value="json">JSON</option>
                    <option value="html">HTML</option>
                    <option value="plain text">Plain Text</option>
                  </Select>
                  {errors.model_output_format && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.model_output_format.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">
                    Model Max Tokens
                  </label>
                  <Controller
                    name="model_max_tokens"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        className="w-full"
                        title="Model Max Tokens"
                        value={String(field.value || "8000")}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        required
                      >
                        <option value="128">
                          128 — ~100 words. Labels, classifications, yes/no,
                          tiny JSON objects.
                        </option>
                        <option value="256">
                          256 — ~190 words. Short answers, micro-summaries,
                          small JSON payloads.
                        </option>
                        <option value="512">
                          512 — ~380 words. Paragraph summaries, simple plans,
                          function args.
                        </option>
                        <option value="1024">
                          1024 — ~770 words. Detailed answers, multi-paragraph
                          summaries.
                        </option>
                        <option value="2048">
                          2048 — ~1.5k words. Long responses, structured
                          reports.
                        </option>
                        <option value="4096">
                          4096 — ~3k words. Multi-section outputs, code +
                          explanation.
                        </option>
                        <option value="8000">
                          8000 — ~6k words. Your current default; long docs and
                          verbose JSON.
                        </option>
                        <option value="16384">
                          16384 — ~12k words. Only if the model supports &gt;16k
                          context.
                        </option>
                      </Select>
                    )}
                  />
                  {errors.model_max_tokens && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.model_max_tokens.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">
                    Model Max Iterations
                  </label>
                  <Input
                    type="number"
                    min={1}
                    {...register("model_max_iterations", {
                      valueAsNumber: true,
                    })}
                    required
                    placeholder="Max reasoning cycles"
                    title="Model Max Iterations"
                  />
                  {errors.model_max_iterations && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.model_max_iterations.message}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            
            <Card className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-400">
                Budget Constraints
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-300 mb-1">
                    Budget Max Cost ($)
                  </label>
                  <Input
                    type="text"
                    {...register("budget_max_cost")}
                    required
                    placeholder="Max cost in USD"
                    title="Budget Max Cost"
                  />
                  {errors.budget_max_cost && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.budget_max_cost.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">
                    Budget Max Tokens
                  </label>
                  <Input
                    type="text"
                    {...register("budget_max_tokens")}
                    required
                    placeholder="Cumulative token limit"
                    title="Budget Max Tokens"
                  />
                  {errors.budget_max_tokens && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.budget_max_tokens.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">
                    Budget Max Execution Time (ms)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    {...register("budget_max_execution_time", {
                      valueAsNumber: true,
                      setValueAs: (v) =>
                        v === "" || v === undefined ? 0 : Number(v),
                    })}
                    required
                    placeholder="Max execution time (ms)"
                    title="Budget Max Execution Time"
                  />
                  {errors.budget_max_execution_time && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.budget_max_execution_time.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">
                    Budget Max Steps
                  </label>
                  <Input
                    type="number"
                    min={1}
                    {...register("budget_max_steps", { valueAsNumber: true })}
                    required
                    placeholder="Max steps"
                    title="Budget Max Steps"
                  />
                  {errors.budget_max_steps && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.budget_max_steps.message}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="config" selectedValue={tab}>
            <Card className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-400">
                Config Preview
              </h2>
              <pre className="bg-neutral-950 text-green-400 rounded p-4 text-xs overflow-x-auto">
                {JSON.stringify(config, null, JSON_PRETTY_PRINT_SPACES)}
              </pre>
            </Card>
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
              >{AGENTS_HELP_DOCUMENTATION}</ReactMarkdown>
            </div>

          </TabsContent>
        </Tabs>
        <Button type="submit" disabled={!isValid}>
          Create Agent Run
        </Button>
      </form>
    </Card>
  );
}
