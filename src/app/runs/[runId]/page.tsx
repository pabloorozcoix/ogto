
"use client";
import RunDetail from "@/components/runs/components/RunDetail";

export default function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  return <RunDetail params={params} />;
}
