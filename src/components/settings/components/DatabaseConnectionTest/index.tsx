"use client";
import { CHECKS } from "./constants";
import { useDatabaseConnectionTest } from "./hooks/useDatabaseConnectionTest";

import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";

export function DatabaseConnectionTest() {
  const { results, isPending, handleTest } = useDatabaseConnectionTest();

  return (
    <>
      {isPending && <Loader />}
      <div className="bg-neutral-900 rounded-lg p-6 max-w-xl mx-auto mt-8 border border-neutral-800">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🗄️</span>
            <span className="font-semibold text-lg">Supabase Database Connection Test</span>
          </div>
          <div className="text-neutral-400 text-sm">
            Test your Supabase database connection and verify all components are working properly
          </div>
        </div>
        <Button
          className="w-full flex items-center justify-center gap-2"
          onClick={handleTest}
          disabled={isPending}
          type="button"
        >
          <span>🌐</span> Test Database Connection
        </Button>
        <div className="font-semibold mb-2 mt-6">Test Results:</div>
        {results && (
          <div className="mt-6">
            <ul className="space-y-2">
              {CHECKS.map((check) => (
                <li key={check.key} className="flex items-center gap-2">
                  <span className="text-xl">
                    {results[check.key as keyof typeof results] ? "✅" : "❌"}
                  </span>
                  <span className="font-medium">{check.label}</span>
                  <span className="text-xs text-neutral-400 ml-auto">
                    {results.timings[check.key]}ms
                  </span>
                  <span className="text-neutral-400 text-xs">{check.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
