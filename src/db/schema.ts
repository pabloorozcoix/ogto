import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  jsonb,
  boolean,
  timestamp,
  index,
  customType,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";




const vector1536 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value) {
    const trimmed = value.trim();
    const withoutBrackets = trimmed.replace(/^\[/, "").replace(/\]$/, "");
    if (!withoutBrackets) return [];
    return withoutBrackets.split(",").map((v) => Number(v.trim()));
  },
});

export const agent_ctx = pgTable("agent_ctx", {
  id: uuid("id").primaryKey().defaultRandom(),
  agent_name: text("agent_name").notNull(),
  agent_role: text("agent_role").notNull(),
  goal_title: text("goal_title").notNull(),
  goal_system_prompt: text("goal_system_prompt").notNull(),
  model: text("model").notNull(),
  model_temperature: numeric("model_temperature").notNull(),
  model_output_format: text("model_output_format").notNull(),
  model_max_tokens: integer("model_max_tokens").notNull(),
  model_max_iterations: integer("model_max_iterations").notNull(),
  budget_max_cost: numeric("budget_max_cost"),
  budget_max_tokens: integer("budget_max_tokens"),
  budget_max_execution_time: integer("budget_max_execution_time"),
  budget_max_steps: integer("budget_max_steps"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const agent_state = pgTable(
  "agent_state",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agent_ctx_id: uuid("agent_ctx_id").references(() => agent_ctx.id),
    iterations_completed: integer("iterations_completed").notNull(),
    steps_used: integer("steps_used").notNull(),
    tokens_used: integer("tokens_used").notNull(),
    cost_used: numeric("cost_used").notNull(),
    elapsed_ms: integer("elapsed_ms").notNull(),
    summary: text("summary"),
    memory_refs: text("memory_refs").array(),
    status: text("status"),
    coverage_score: numeric("coverage_score"),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    idx_agent_state_agent_ctx: index("idx_agent_state_agent_ctx").on(t.agent_ctx_id),
    idx_agent_state_status: index("idx_agent_state_status").on(t.status),
  })
);

export const memory = pgTable("memory", {
  id: uuid("id").primaryKey().defaultRandom(),
  agent_state_id: uuid("agent_state_id").references(() => agent_state.id),
  text: text("text").notNull(),
  tags: text("tags").array(),
  source: text("source"),
  step_id: uuid("step_id"),
  embedding: vector1536("embedding"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const plan_step = pgTable(
  "plan_step",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agent_state_id: uuid("agent_state_id").references(() => agent_state.id),
    rationale: text("rationale").notNull(),
    tool_name: text("tool_name").notNull(),
    args: jsonb("args").notNull(),
    success_criteria: text("success_criteria").array(),
    risks: text("risks").array(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    idx_plan_step_agent_state: index("idx_plan_step_agent_state").on(t.agent_state_id),
  })
);

export const tool_result = pgTable(
  "tool_result",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    plan_step_id: uuid("plan_step_id").references(() => plan_step.id),
    ok: boolean("ok").notNull(),
    data: jsonb("data"),
    error: text("error"),
    meta: jsonb("meta"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    idx_tool_result_plan_step: index("idx_tool_result_plan_step").on(t.plan_step_id),
  })
);

export const observation = pgTable(
  "observation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tool_result_id: uuid("tool_result_id").references(() => tool_result.id),
    headline: text("headline").notNull(),
    details: text("details").notNull(),
    artifacts: text("artifacts").array(),
    quality: text("quality"),
    counters: jsonb("counters"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    idx_observation_tool_result: index("idx_observation_tool_result").on(t.tool_result_id),
  })
);

export const reflection = pgTable(
  "reflection",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    observation_id: uuid("observation_id").references(() => observation.id),
    critique: text("critique").notNull(),
    decision: text("decision"),
    goal_satisfied: boolean("goal_satisfied").notNull(),
    memory_note: text("memory_note"),
    updated_summary: text("updated_summary"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    idx_reflection_observation: index("idx_reflection_observation").on(t.observation_id),
  })
);

export const claim_confidence_log = pgTable(
  "claim_confidence_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agent_state_id: uuid("agent_state_id").references(() => agent_state.id),
    observation_id: uuid("observation_id"),
    artifact_index: integer("artifact_index").notNull(),
    claim_index: integer("claim_index").notNull(),
    statement: text("statement").notNull(),
    heuristic_confidence: numeric("heuristic_confidence"),
    llm_confidence: numeric("llm_confidence"),
    blended_confidence: numeric("blended_confidence"),
    rationale: text("rationale"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    idx_claim_confidence_agent_state: index("idx_claim_confidence_agent_state").on(t.agent_state_id),
    idx_claim_confidence_observation: index("idx_claim_confidence_observation").on(t.observation_id),
  })
);

// Indexes that require pgvector operator classes / ordering are kept as raw SQL
// to mirror `drizzle/migrations/init_db.sql` closely.
export const rawSql = {
  idx_memory_embedding: sql`CREATE INDEX IF NOT EXISTS idx_memory_embedding ON public.memory USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);`,
  idx_claim_confidence_agent_state_created_at: sql`CREATE INDEX IF NOT EXISTS idx_claim_confidence_agent_state_created_at ON public.claim_confidence_log(agent_state_id, created_at DESC);`,
};
