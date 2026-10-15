"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type DataLoadingContextValue = {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
};

const DataLoadingContext = createContext<DataLoadingContextValue | null>(null);

export function DataLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const startLoading = useCallback(() => {
    setIsLoading(true);
    window.dispatchEvent(new Event("simonev:navigation-start"));
  }, []);
  const stopLoading = useCallback(() => setIsLoading(false), []);
  const value = useMemo(() => ({ isLoading, startLoading, stopLoading }), [isLoading, startLoading, stopLoading]);

  useEffect(() => stopLoading(), [pathname, stopLoading]);

  return <DataLoadingContext.Provider value={value}>{children}</DataLoadingContext.Provider>;
}

export function useDataLoading() {
  const context = useContext(DataLoadingContext);
  if (!context) throw new Error("useDataLoading must be used within DataLoadingProvider.");
  return context;
}

export function DataLoadingLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { startLoading } = useDataLoading();
  return (
    <Link
      href={href}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.currentTarget.target === "_blank"
        ) return;
        const destination = new URL(event.currentTarget.href, window.location.href);
        if (
          destination.origin === window.location.origin &&
          `${destination.pathname}${destination.search}${destination.hash}` !==
            `${window.location.pathname}${window.location.search}${window.location.hash}`
        ) {
          startLoading();
        }
      }}
      className={className}
    >
      {children}
    </Link>
  );
}

export function TableLoadingRegion({
  loadingKey,
  columns,
  children,
}: {
  loadingKey: string;
  columns: number;
  children: React.ReactNode;
}) {
  const { isLoading, stopLoading } = useDataLoading();
  const previousLoadingKey = useRef(loadingKey);

  useEffect(() => {
    if (loadingKey === previousLoadingKey.current) return;
    previousLoadingKey.current = loadingKey;
    stopLoading();
  }, [loadingKey, stopLoading]);

  if (!isLoading) return <>{children}</>;

  return (
    <div
      aria-label="Memuat data tabel"
      aria-live="polite"
      aria-busy="true"
      data-loading-key={loadingKey}
      className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container"
    >
      <div className="animate-pulse overflow-x-auto p-4">
        <div className="grid gap-4 border-b border-outline-variant/30 px-2 py-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(6rem, 1fr))` }}>
          {Array.from({ length: columns }, (_, index) => (
            <div key={index} className="h-3 rounded bg-surface-container-high" />
          ))}
        </div>
        <div className="space-y-1">
          {Array.from({ length: 6 }, (_, row) => (
            <div key={row} className="grid gap-4 border-b border-outline-variant/20 px-2 py-3 last:border-0" style={{ gridTemplateColumns: `repeat(${columns}, minmax(6rem, 1fr))` }}>
              {Array.from({ length: columns }, (_, column) => (
                <div key={column} className={`h-4 rounded bg-surface-container-high ${column === 0 ? "w-4/5" : "w-full"}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="h-12 animate-pulse border-t border-outline-variant/30 bg-surface-container-low" />
    </div>
  );
}
