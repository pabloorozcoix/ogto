import { z } from "zod";
import type { TAgentFormValues } from "../types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AGENT_TEXT_MIN_LEN,
  MODEL_TEMPERATURE_MAX,
  MODEL_TEMPERATURE_MIN,
  REQUIRED_MIN_LEN,
} from "../constants";

export const agentSchema = z.object({
  agent_name: z
    .string()
    .min(
      AGENT_TEXT_MIN_LEN,
      `Agent name is required and must be at least ${AGENT_TEXT_MIN_LEN} characters.`
    ),
  agent_role: z
    .string()
    .min(
      AGENT_TEXT_MIN_LEN,
      `Agent role is required and must be at least ${AGENT_TEXT_MIN_LEN} characters.`
    ),
  goal_title: z
    .string()
    .min(
      AGENT_TEXT_MIN_LEN,
      `Goal title is required and must be at least ${AGENT_TEXT_MIN_LEN} characters.`
    ),
  goal_system_prompt: z
    .string()
    .min(
      AGENT_TEXT_MIN_LEN,
      `Goal system prompt is required and must be at least ${AGENT_TEXT_MIN_LEN} characters.`
    ),
  model: z.string().min(REQUIRED_MIN_LEN, "Model is required."),
  model_temperature: z
    .number()
    .min(MODEL_TEMPERATURE_MIN, `Temperature must be at least ${MODEL_TEMPERATURE_MIN}.`)
    .max(MODEL_TEMPERATURE_MAX, `Temperature must be at most ${MODEL_TEMPERATURE_MAX}.`),
  model_output_format: z
    .string()
    .min(REQUIRED_MIN_LEN, "Output format is required."),
  model_max_tokens: z
    .number()
    .min(REQUIRED_MIN_LEN, "Max tokens must be at least 1."),
  model_max_iterations: z
    .number()
    .min(REQUIRED_MIN_LEN, "Max iterations must be at least 1."),
  budget_max_cost: z
    .string()
    .min(REQUIRED_MIN_LEN, "Budget max cost is required."),
  budget_max_tokens: z
    .string()
    .min(REQUIRED_MIN_LEN, "Budget max tokens is required."),
  budget_max_execution_time: z
    .number()
    .min(REQUIRED_MIN_LEN, "Execution time must be at least 1 ms."),
  budget_max_steps: z
    .number()
    .min(REQUIRED_MIN_LEN, "Max steps must be at least 1."),
});

export const useAgentsFormSchema = (defaultValues: TAgentFormValues) => {
  const form = useForm<TAgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues,
    mode: "onChange",
  });

  return form;
};
