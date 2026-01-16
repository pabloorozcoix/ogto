import { useState } from "react";

export function useGetTextSummary() {
  const [summary, setSummary] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSummarize(text: string) {
    console.log("handleSummarize called with text:", text);
    setIsPending(true);
    setError(null);
    setSummary("");
    try {
      console.log("Sending request to /api/tools/get_text_summary...");
      const res = await fetch("/api/tools/get_text_summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      console.log("Response received:", res);

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        console.log("Chunk received:", value);
        if (value) {
          const chunk = decoder.decode(value);
          console.log("Decoded chunk:", chunk);
          setSummary(prev => {
            const updatedSummary = prev + chunk;
            console.log("Updated summary:", updatedSummary);
            return updatedSummary;
          });
        }
        done = readerDone;
        console.log("Reader done:", done);
      }
      setIsPending(false);
      console.log("Summarization complete.");
    } catch (e) {
      console.error("Error occurred:", e);
      setIsPending(false);
      setError("Network error");
    }
  }

  return { summary, isPending, error, handleSummarize };
}
