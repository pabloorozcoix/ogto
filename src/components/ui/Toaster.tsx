"use client";

import * as React from "react";
import {
  dismissToast,
  getToastsSnapshot,
  subscribeToToasts,
  type ToastItem,
} from "./toast";

function ToastCard({ t }: { t: ToastItem }) {
  const variantClasses =
    t.variant === "success"
      ? "border-emerald-800 bg-emerald-950 text-emerald-100"
      : t.variant === "error"
        ? "border-red-800 bg-red-950 text-red-100"
        : "border-neutral-700 bg-neutral-900 text-neutral-100";

  return (
    <div
      className={`w-[360px] max-w-[calc(100vw-2rem)] rounded-lg border shadow-lg p-4 ${variantClasses}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{t.title}</div>
          {t.description ? (
            <div className="mt-1 text-xs opacity-90 whitespace-pre-wrap">
              {t.description}
            </div>
          ) : null}
        </div>
        <button
          className="text-xs opacity-70 hover:opacity-100 border border-white/10 rounded px-2 py-1"
          onClick={() => dismissToast(t.id)}
          aria-label="Dismiss notification"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function Toaster() {
  const toasts = React.useSyncExternalStore(
    subscribeToToasts,
    getToastsSnapshot,
    getToastsSnapshot
  );

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} t={t} />
      ))}
    </div>
  );
}
