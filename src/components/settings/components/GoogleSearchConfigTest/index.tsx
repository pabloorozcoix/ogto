import { useGoogleSearchConfigTest } from "./hooks/useGoogleSearchConfigTest";
import { Loader } from "@/components/ui/Loader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GOOGLE_SEARCH_RESULT_JSON_SPACES } from "./constants";

export function GoogleSearchConfigTest() {
  const { result, error, isPending, handleTest, query, setQuery } = useGoogleSearchConfigTest();

  return (
    <>
      {isPending && <Loader />}
      <div className="bg-neutral-900 rounded-lg p-6 max-w-xl mx-auto mt-8 border border-neutral-800">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔎</span>
            <span className="font-semibold text-lg">Google Search API Test</span>
          </div>
          <div className="text-neutral-400 text-sm">
            Enter a search query to test your Google Custom Search API and Engine ID configuration. Results will be shown as a JSON object.
          </div>
        </div>
        <div className="mb-4">
          <Input
            type="text"
            className="w-full"
            placeholder="Enter search query..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={isPending}
          />
        </div>
        <Button
          className="w-full flex items-center justify-center gap-2"
          onClick={handleTest}
          disabled={isPending}
          type="button"
        >
          <span>🔎</span> Search Google
        </Button>
        <div className="mt-6">
          <div className="font-semibold mb-2">Search Result:</div>
          {isPending && <Loader />}
          {error ? (
            <div className="text-red-400">{error}</div>
          ) : result ? (
            <pre className="whitespace-pre-wrap text-green-400 text-xs max-h-96 overflow-auto">{JSON.stringify(result, null, GOOGLE_SEARCH_RESULT_JSON_SPACES)}</pre>
          ) : null}
        </div>
      </div>
    </>
  );
}
