import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * jsdom has no layout, and so no `ResizeObserver`. The conversation's
 * stick-to-bottom scrolling observes its own height on mount and throws
 * without one. Nothing here lays anything out, so an observer that never
 * reports is the honest stand-in.
 */
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

/**
 * jsdom has no media queries either. The sidebar asks whether it is on a phone
 * before deciding to be a sheet or a fixed column. Nothing here has a viewport,
 * so a query that matches nothing is the honest answer: the tests render the
 * desktop sidebar, and it is the DOM they assert on.
 */
if (typeof globalThis.matchMedia !== "function") {
  globalThis.matchMedia = (media: string) =>
    ({
      media,
      matches: false,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

afterEach(() => {
  cleanup();
});
