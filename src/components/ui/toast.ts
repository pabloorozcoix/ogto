export type ToastVariant = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  createdAt: number;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function uuid() {
  // Good enough for UI IDs
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function subscribeToToasts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToastsSnapshot() {
  return toasts;
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function toast(input: ToastInput) {
  const id = uuid();
  const item: ToastItem = {
    id,
    title: input.title,
    description: input.description,
    variant: input.variant ?? "info",
    createdAt: Date.now(),
  };

  toasts = [item, ...toasts].slice(0, 5);
  emit();

  const duration = input.durationMs ?? 3500;
  if (duration > 0) {
    window.setTimeout(() => dismissToast(id), duration);
  }

  return id;
}
