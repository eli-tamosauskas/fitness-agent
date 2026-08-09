import * as React from "react";

/** Tailwind's `md`, so a `md:` class and this hook agree on where a phone ends. */
const MOBILE_BREAKPOINT = 768;

const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/**
 * Whether the viewport is phone-sized, which is what decides whether the day
 * list is a sheet or a fixed column.
 *
 * Subscribed rather than stored in state — the upstream shadcn version sets
 * state from an effect, which this repo's lint rules reject, and a media query
 * is an external store anyway. The server, having no viewport, says desktop;
 * the first client render agrees, so hydration matches.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(MOBILE_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}
