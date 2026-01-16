"use client";

import * as React from "react";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  confirmDisabled,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        aria-label="Close dialog"
      />

      <div className="relative w-[520px] max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-800 bg-neutral-950 shadow-xl p-6">
        <div className="text-lg font-semibold text-neutral-100">{title}</div>
        {description ? (
          <div className="mt-2 text-sm text-neutral-300">{description}</div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            className="px-4 py-2 rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-100"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={`px-4 py-2 rounded-md font-semibold text-white ${
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
            onClick={onConfirm}
            disabled={!!confirmDisabled}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
