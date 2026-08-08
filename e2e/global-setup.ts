import { rmSync } from "node:fs";

/** The log the e2e server writes to. Never the real one. */
export const E2E_DATABASE_PATH = ".playwright/nutrition.db";

/**
 * Starts every run from an empty log, so the rings read zero against their
 * targets no matter what a previous run wrote.
 */
export default function globalSetup() {
  rmSync(E2E_DATABASE_PATH, { force: true });
}
