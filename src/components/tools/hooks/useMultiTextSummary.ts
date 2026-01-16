import { useState } from "react";

export function useMultiTextSummary() {
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | null>>({});

  async function handleSummarize(url: string, text: string) {
    console.log("Starting handleSummarize for URL:", url);
    setPending(p => {
      const updated = { ...p, [url]: true };
      console.log("Updated pending state:", updated);
      return updated;
    });
    setSummaries(s => {
      const updated = { ...s, [url]: "" };
      console.log("Updated summaries state:", updated);
      return updated;
    });
    setError(e => {
      const updated = { ...e, [url]: null };
      console.log("Updated error state:", updated);
      return updated;
    });

    try {
      console.log("Sending fetch request for URL:", url);
      const res = await fetch("/api/tools/get_text_summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (value) {
          const chunk = decoder.decode(value);
          console.log("Received chunk for URL:", url, "Chunk:", chunk);
          setSummaries(prev => {
            const updated = { ...prev, [url]: (prev[url] || "") + chunk };
            console.log("Updated summaries state after chunk:", updated);
            return updated;
          });
        }
        done = readerDone;
      }

      setPending(p => {
        const updated = { ...p, [url]: false };
        console.log("Updated pending state after completion:", updated);
        return updated;
      });
    } catch (e) {
      console.error("Error in handleSummarize for URL:", url, e);
      setPending(p => {
        const updated = { ...p, [url]: false };
        console.log("Updated pending state after error:", updated);
        return updated;
      });
      setError(err => {
        const updated = { ...err, [url]: "Network error" };
        console.log("Updated error state after error:", updated);
        return updated;
      });
    }
  }

  console.log("Current state - Summaries:", summaries, "Pending:", pending, "Error:", error);

  return { summaries, pending, error, handleSummarize };
}
