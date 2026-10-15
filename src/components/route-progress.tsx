"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [complete, setComplete] = useState(false);
  const previousPathname = useRef(pathname);
  const timeoutRef = useRef<number | null>(null);
  const finishRef = useRef<number | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      if (finishRef.current !== null) window.clearTimeout(finishRef.current);
      timeoutRef.current = null;
      finishRef.current = null;
    };

    const handleClick = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;

      startProgress();
    };

    const startProgress = () => {
      clearTimers();
      setComplete(false);
      setVisible(true);
      timeoutRef.current = window.setTimeout(() => {
        setComplete(true);
        finishRef.current = window.setTimeout(() => setVisible(false), 300);
      }, 15000);
    };

    const handleNavigationStart = () => startProgress();

    document.addEventListener("click", handleClick, true);
    window.addEventListener("simonev:navigation-start", handleNavigationStart);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("simonev:navigation-start", handleNavigationStart);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (pathname === previousPathname.current) return;
    previousPathname.current = pathname;
    if (!visible) return;
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setComplete(true);
    finishRef.current = window.setTimeout(() => {
      setVisible(false);
      setComplete(false);
      finishRef.current = null;
    }, 300);
  }, [pathname, visible]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-label="Memuat halaman"
      className={`route-progress-bar fixed left-0 right-0 top-0 z-[120] h-[3px] origin-left bg-primary dark:bg-primary-dark transition-transform duration-200 ease-out ${
        complete ? "scale-x-100 opacity-100" : "scale-x-[0.72] animate-route-progress"
      }`}
    />
  );
}
