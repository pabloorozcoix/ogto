"use client";

import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { useOllamaConnectionTest } from "./hooks/useOllamaConnectionTest";

export function OllamaConnectionTest() {
  const { text, error, isPending, handleTest } = useOllamaConnectionTest();

  return (
    <>
      {isPending && <Loader />}
      <div className="bg-neutral-900 rounded-lg p-6 max-w-xl mx-auto mt-8 border border-neutral-800">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🦙</span>
            <span className="font-semibold text-lg">Ollama Connection Test</span>
          </div>
          <div className="text-neutral-400 text-sm">
            Test your Ollama server connection and verify the AI SDK integration.
          </div>
        </div>
        <Button
          className="w-full flex items-center justify-center gap-2"
          onClick={handleTest}
          disabled={isPending}
          type="button"
        >
          <span>🤖</span> Test Ollama Connection
        </Button>
        <div className="mt-6">
          <div className="font-semibold mb-2">Test Result:</div>
          {error ? (
            <div className="text-red-400">{error}</div>
          ) : (
            <pre className="whitespace-pre-wrap text-green-400">{text}</pre>
          )}
        </div>
      </div>
    </>
  );
}
