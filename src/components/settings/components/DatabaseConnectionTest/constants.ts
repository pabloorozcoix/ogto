  export const CHECKS = [
    {
      label: "Environment Configuration",
      description: "All required environment variables are configured",
      key: "env",
    },
    {
      label: "Supabase Connection",
      description: "Supabase connection successful",
      key: "supabase",
    },
    {
      label: "Vector Store (pgvector)",
      description: "pgvector extension working properly",
      key: "pgvector",
    },
  ];