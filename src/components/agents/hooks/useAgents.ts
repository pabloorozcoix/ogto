import React from "react";
import { useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import type { TAgentFormValues } from "../types";
import { UseFormReturn } from "react-hook-form";

export function useAgents(form: UseFormReturn<TAgentFormValues>) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    control,
  } = form;

  const agentValues = useWatch({ control });

  const modelTemperatureValue = agentValues.model_temperature;

  const config = {
    agent_information: {
      agent_name: agentValues.agent_name,
      agent_role: agentValues.agent_role,
    },
    goal_definition: {
      goal_title: agentValues.goal_title,
      goal_system_prompt: agentValues.goal_system_prompt,
    },
    model_configuration: {
      model: agentValues.model,
      model_temperature: agentValues.model_temperature,
      model_output_format: agentValues.model_output_format,
      model_max_tokens: agentValues.model_max_tokens,
      model_max_iterations: agentValues.model_max_iterations,
    },
    budget_constraints: {
      budget_max_cost: agentValues.budget_max_cost,
      budget_max_tokens: agentValues.budget_max_tokens,
      budget_max_execution_time: agentValues.budget_max_execution_time,
      budget_max_steps: agentValues.budget_max_steps,
    },
  };

  const [tab, setTab] = React.useState("form");
  const router = useRouter();

  const onSubmit = async (data: typeof agentValues) => {
    console.log("[Create Agent Run] Button clicked");
    console.log("Submitted data:", data);
    try {
      
      const res = await fetch("/api/agents/create-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create agent run");
      }
      
      router.push("/runs");
    } catch (err) {
      console.error("Agent run creation error:", err);
      alert(
        "Failed to create agent run: " +
          (err instanceof Error ? err.message : String(err))
      );
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    isValid,
    control,
    agentValues,
    modelTemperatureValue,
    config,
    tab,
    setTab,
    onSubmit,
  };
}
