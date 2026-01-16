import type { Config } from "drizzle-kit";

export default {
    schema: "./src/db/schema.ts",
    out: "./drizzle/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: `postgres://${process.env.NEXT_PUBLIC_SUPABASE_POSTGRES_USER}:${process.env.NEXT_PUBLIC_SUPABASE_POSTGRES_PASSWORD}@localhost:54322/postgres`
    }
} satisfies Config;

