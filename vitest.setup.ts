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

afterEach(() => {
  cleanup();
});
