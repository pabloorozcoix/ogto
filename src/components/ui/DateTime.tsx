"use client";

import React from "react";
import { dayjs } from "@/lib/dayjs";

export type TDateTimeValue = string | number | Date | null | undefined;

function normalizeIsoTimestamp(value: string): string {
  return value.replace(/\.(\d{3})\d+(?=Z|[+-]\d{2}:\d{2}$)/, ".$1");
}

export function DateTime({
  value,
  format = "lll",
  titleFormat = "YYYY-MM-DD HH:mm:ss Z",
  fallback = "—",
  relative = false,
  className,
}: {
  value: TDateTimeValue;
  format?: string;
  titleFormat?: string;
  fallback?: string;
  relative?: boolean;
  className?: string;
}) {
  if (!value) {
    return <span className={className}>{fallback}</span>;
  }

  const normalized = typeof value === "string" ? normalizeIsoTimestamp(value) : value;
  const dt = dayjs(normalized);
  if (!dt.isValid()) {
    return <span className={className}>{fallback}</span>;
  }

  const text = relative ? dt.fromNow() : dt.format(format);

  return (
    <time
      className={className}
      dateTime={dt.toISOString()}
      title={dt.format(titleFormat)}
      suppressHydrationWarning
    >
      {text}
    </time>
  );
}
