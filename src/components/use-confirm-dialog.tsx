"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning";
};

export function useConfirmDialog() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback((nextOptions: ConfirmOptions) => new Promise<boolean>((resolve) => {
    resolveRef.current = resolve;
    setOptions(nextOptions);
  }), []);

  const resolve = useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setOptions(null);
  }, []);

  useEffect(() => {
    if (!options) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") resolve(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [options, resolve]);

  const dialog = options ? (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/55 p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) resolve(false); }}
      onKeyDown={(event) => { if (event.key === "Escape") resolve(false); }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-2xl"
      >
        <div className={`h-1 ${options.tone === "warning" ? "bg-amber-500" : "bg-error"}`} />
        <div className="p-5 sm:p-6">
          <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
            options.tone === "warning"
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              : "bg-error-container text-error"
          }`}>
            {options.tone === "warning" ? <AlertTriangle size={22} /> : <ShieldAlert size={22} />}
          </div>
          <h2 id="confirm-dialog-title" className="font-display text-lg font-bold text-on-surface">
            {options.title}
          </h2>
          <p id="confirm-dialog-message" className="mt-2 whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">
            {options.message}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              autoFocus
              onClick={() => resolve(false)}
              className="rounded-lg border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-high"
            >
              {options.cancelLabel ?? "Batal"}
            </button>
            <button
              type="button"
              onClick={() => resolve(true)}
              className={`rounded-lg px-4 py-2.5 text-sm font-bold text-white transition ${
                options.tone === "warning"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {options.confirmLabel ?? "Ya, lanjutkan"}
            </button>
          </div>
        </div>
      </section>
    </div>
  ) : null;

  return { confirm, dialog };
}
