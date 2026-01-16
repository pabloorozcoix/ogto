import { useState, useTransition } from "react";

export function useGoogleSearchConfigTest() {
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleTest() {
    startTransition(() => {
      setResult(null);
      setError("");
      fetch(`/api/web-search?q=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((json) => {
          if (json.success) {
            setResult(
              json.results ||
                json.message ||
                "Google Search API configuration is valid."
            );
          } else {
            setError(json.message || "Google Search API configuration failed.");
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Unknown error");
        });
    });
  }

  return { result, error, isPending, handleTest, query, setQuery };
}
