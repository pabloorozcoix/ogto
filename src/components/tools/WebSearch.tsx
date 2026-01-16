import { useWebSearch } from "./hooks/useWebSearch";
import { useState } from "react";

export function WebSearch() {
  const [query, setQuery] = useState("");
  const { results, isPending, error, message, handleSearch } = useWebSearch();

  return (
    <div className="p-4 border rounded bg-white shadow">
      <h2 className="font-bold mb-2">Web Search</h2>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSearch(query);
        }}
        className="flex gap-2 mb-4"
      >
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Enter search query"
          className="border px-2 py-1 rounded w-full"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-1 rounded"
          disabled={isPending}
        >
          {isPending ? "Searching..." : "Search"}
        </button>
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {message && <div className="text-gray-600 mb-2">{message}</div>}
      <ul className="space-y-2">
        {results.map((r, i) => (
          <li key={i} className="border-b pb-2">
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700">{r.title}</a>
            <div className="text-sm text-gray-700">{r.snippet}</div>
            <div className="text-xs text-gray-500">Source: {r.source}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
