import { NextResponse } from "next/server";
import { MAX_WEB_SEARCH_RESULTS } from "@/lib/constants";

import type { TGoogleSearchItem } from "./types";

function isGoogleSearchError(value: unknown): value is { error: { message?: string } } {
  if (!value || typeof value !== "object") return false;
  const maybeError = (value as { error?: unknown }).error;
  if (!maybeError || typeof maybeError !== "object") return false;
  return "message" in (maybeError as object);
}

export async function GET(request: Request) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "AI tools";

  if (!apiKey || !engineId) {
    return NextResponse.json({ success: false, message: "Missing Google Search API Key or Engine ID." });
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${engineId}&num=${MAX_WEB_SEARCH_RESULTS}`
    );
    const json: unknown = await res.json();
    const items = (json as { items?: unknown }).items;
    if (Array.isArray(items) && items.length > 0) {
      const results = items.map((raw): { title: string; url: string; snippet: string; source: string } => {
        const item = raw as TGoogleSearchItem;
        return {
          title: typeof item.title === "string" ? item.title : "",
          url: typeof item.link === "string" ? item.link : "",
          snippet: typeof item.snippet === "string" ? item.snippet : "",
          source: typeof item.displayLink === "string" ? item.displayLink : "",
        };
      });
      return NextResponse.json({ success: true, results });
    } else if (isGoogleSearchError(json)) {
      return NextResponse.json({ success: false, message: json.error.message });
    } else {
      return NextResponse.json({ success: false, message: "Google Search API returned no results." });
    }
  } catch (err) {
    return NextResponse.json({ success: false, message: (err as Error).message || "Unknown error" });
  }
}
