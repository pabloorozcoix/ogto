import { useState } from "react";

import type { TWebSearchResult } from "./types";

function isWebSearchResult(value: unknown): value is TWebSearchResult {
  if (!value || typeof value !== "object") return false;
  const v = value as { title?: unknown; url?: unknown };
  return typeof v.title === "string" && typeof v.url === "string";
}

export function useWebSearch() {
  const [results, setResults] = useState<TWebSearchResult[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  async function handleSearch(q: string) {
    console.log("Search query:", q);
    setIsPending(true);
    setError(null);
    setMessage("");
    setResults([]);
    console.log("Initial state set: isPending =", isPending, "error =", error, "message =", message, "results =", results);

    try {
      const res = await fetch("/api/tools/web_search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q })
      });
      console.log("API response status:", res.status);

      const data: unknown = await res.json();
      console.log("API response data:", data);

      setIsPending(false);
      const nextMessage =
        typeof (data as { message?: unknown }).message === "string"
          ? (data as { message: string }).message
          : "";
      setMessage(nextMessage);
      console.log("Message set:", message);

      const success = (data as { success?: unknown }).success;
      if (success === true) {
        const rawResults = (data as { results?: unknown }).results;
        const nextResults = Array.isArray(rawResults)
          ? rawResults.filter(isWebSearchResult)
          : [];
        setResults(nextResults);
        console.log("Search results set:", results);
      } else {
        setError(nextMessage || "Unknown error");
        console.log("Error set:", error);
      }
    } catch (e) {
      setIsPending(false);
      const errorMessage = e instanceof Error ? e.message : "Network error";
      setError(errorMessage);
      console.log("Caught error:", errorMessage);
    }
  }

  console.log("Hook state: results =", results, "isPending =", isPending, "error =", error, "message =", message);

  return { results, isPending, error, message, handleSearch };
}
