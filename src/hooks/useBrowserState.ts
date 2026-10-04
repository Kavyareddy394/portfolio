"use client";

import { useEffect, useSyncExternalStore } from "react";

export type BrowserState = {
  /** document.hidden, read during render. */
  hidden: boolean;
  /** window.location.search, read during render. */
  search: string;
};

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function subscribeLocation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener("hashchange", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("hashchange", onChange);
  };
}

/**
 * Browser-only values read during render.
 *
 * The server snapshots return harmless defaults, so the first client render
 * matches the server markup and hydration never warns. This replaces the
 * usual setState-in-effect pattern, which cascades an extra render.
 */
export function useBrowserState(): BrowserState {
  const hidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.hidden,
    () => false,
  );

  const search = useSyncExternalStore(
    subscribeLocation,
    () => window.location.search,
    () => "",
  );

  return { hidden, search };
}

/**
 * Reports whether the element is on screen. The simulation pauses when it is
 * not, so a scrolled-away scene costs nothing.
 */
export function useInView(
  ref: React.RefObject<HTMLElement | null>,
  onChange: (visible: boolean) => void,
) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => onChange(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [ref, onChange]);
}