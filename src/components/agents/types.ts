import { z } from "zod";
import { agentSchema } from "./hooks/useAgentsFormSchema";

export type TAgentFormValues = z.infer<typeof agentSchema>;

