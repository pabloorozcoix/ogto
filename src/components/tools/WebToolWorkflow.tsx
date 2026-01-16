"use client";
import { useWebSearch } from "./hooks/useWebSearch";
import { useState, useEffect } from "react";
import { useMultiTextSummary } from "./hooks/useMultiTextSummary";

export function WebToolWorkflow() {
  const [query, setQuery] = useState("");
  const { results, isPending: searching, handleSearch } = useWebSearch();
  const [fetchedContents, setFetchedContents] = useState<{ url: string; content: string }[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const { summaries, pending, error, handleSummarize } = useMultiTextSummary();

  
  useEffect(() => {
    fetchedContents.forEach(({ url, content }) => {
      if (!pending[url] && !summaries[url] && !error[url]) {
        handleSummarize(url, content);
      }
    });
  }, [fetchedContents, pending, summaries, error, handleSummarize]);

  async function fetchAllUrls(urls: string[]) {
    setIsFetching(true);
    const contents: { url: string; content: string }[] = [];
    for (const url of urls) {
      try {
        const res = await fetch("/api/tools/fetch_url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        contents.push({ url, content: data.content || data.message || "Unknown error" });
      } catch {
        contents.push({ url, content: "Unknown error" });
      }
    }
    setFetchedContents(contents);
    setIsFetching(false);
  }

  function summarizeAllContents(contents: { url: string; content: string }[]) {
    contents.forEach(({ url, content }) => {
      handleSummarize(url, content);
    });
  }

  return (
    <div className="p-6 border rounded bg-white shadow text-gray-900">
      <h2 className="font-bold mb-4 text-gray-800 text-lg">Web Search & Summarize Workflow</h2>
      <form
        onSubmit={async e => {
          e.preventDefault();
          await handleSearch(query);
          setFetchedContents([]);
          
        }}
        className="flex gap-2 mb-4"
      >
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Enter search query"
          className="border px-2 py-2 rounded w-full text-gray-900 font-medium bg-gray-50 placeholder-gray-400"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold"
          disabled={searching}
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>
      <ul className="space-y-2 mb-4">
        {results.length === 0 && !searching && (
          <li className="text-gray-500">No results yet. Try searching for something!</li>
        )}
        {results.map((r, i) => (
          <li key={i} className="border-b pb-2">
            <div className="font-semibold text-blue-700">{r.title}</div>
            <div className="text-sm text-gray-700">{r.snippet}</div>
            <div className="text-xs text-gray-500">Source: {r.source || "google"}</div>
          </li>
        ))}
      </ul>
      {results.length > 0 && (
        <button
          className="bg-green-600 text-white px-4 py-2 rounded font-semibold mb-4"
          onClick={() => fetchAllUrls(results.map(r => r.url))}
          disabled={isFetching}
        >
          {isFetching ? "Fetching all URLs..." : "Fetch Content from URLs"}
        </button>
      )}
      {fetchedContents.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold">Fetched Content from URLs:</h3>
          {fetchedContents.map(({ url, content }, i) => (
            <div key={i} className="mb-2">
              <div className="text-xs text-gray-500 mb-1">{url}</div>
              <pre className="bg-gray-100 p-2 rounded max-h-40 overflow-auto text-xs">{content}</pre>
            </div>
          ))}
          <button
            className="bg-yellow-600 text-white px-4 py-2 rounded font-semibold mt-2"
            onClick={() => summarizeAllContents(fetchedContents)}
          >
            Summarize All Contents
          </button>
        </div>
      )}
      {fetchedContents.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold">Summaries:</h3>
          {fetchedContents.map(({ url, content }, i) => (
            <div key={i} className="mb-2">
              <div className="text-xs text-gray-500 mb-1">{content}</div>
              <div className="bg-yellow-50 p-2 rounded text-sm">
                {pending[url] ? <span className="text-yellow-700">Streaming...</span> : null}
                {error[url] ? <span className="text-red-600">{error[url]}</span> : null}
                <span>{summaries[url]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
