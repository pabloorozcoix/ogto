import { useState } from "react";

export function useFetchUrl() {
  const [content, setContent] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  async function handleFetch(url: string) {
    setIsPending(true);
    setError(null);
    setMessage("");
    setContent("");
    try {
      const res = await fetch("/api/tools/fetch_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setIsPending(false);
      setMessage(data.message || "");
      if (data.success) {
        setContent(data.content || "");
      } else {
        setError(data.message || "Unknown error");
      }
    } catch {
      setIsPending(false);
      setError("Network error");
    }
  }

  return { content, isPending, error, message, handleFetch };
}
