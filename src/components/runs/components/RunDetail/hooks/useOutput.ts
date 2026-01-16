import { useCallback } from "react";

import type { TBeginEnd, TRunOutputArgs } from "./types";

export function useOutput(
  setOutputMarkdown: (updater: (prev: string) => string) => void,
  setOutputError: (updater: (prev: string | null) => string | null) => void,
  be: TBeginEnd
) {
  const runOutput = useCallback(
    async (args: TRunOutputArgs) => {
      let finalMarkdown = "";
      try {
        be.beginRequest();
        setOutputError(() => null);
        setOutputMarkdown(() => "");

        const res = await fetch("/api/loop/output", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/x-ndjson",
          },
          body: JSON.stringify(args),
        });

        if (!res.ok) {
          const text = await res.text();
          setOutputError(() => text || `Output API error (${res.status})`);
          return { markdown: "" } as const;
        }

        if (!res.body) {
          setOutputError(() => "No output stream body");
          return { markdown: "" } as const;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let partial = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (!line) continue;
            try {
              const evt = JSON.parse(line);
              if (evt.event === "delta" && typeof evt.chunk === "string") {
                partial += evt.chunk;
                setOutputMarkdown(() => partial);
              } else if (evt.event === "final") {
                const final = typeof evt.markdown === "string" ? evt.markdown : partial;
                finalMarkdown = final;
                setOutputMarkdown(() => final);
                if (evt.ok === false && evt.error) {
                  setOutputError(() => String(evt.error));
                }
              } else if (evt.event === "error" && evt.message) {
                setOutputError(() => String(evt.message));
              }
            } catch {
              // tolerate benign NDJSON parse errors
            }
          }
        }
      } catch {
        setOutputError(() => "Output generation failed");
      } finally {
        be.endRequest();
      }

      return { markdown: finalMarkdown } as const;
    },
    [be, setOutputError, setOutputMarkdown]
  );

  return { runOutput };
}
