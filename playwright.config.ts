import { defineConfig, devices } from "@playwright/test";

import { E2E_DATABASE_PATH } from "./e2e/global-setup";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.CI ? "npm run build && npm run start" : "npm run dev",
    url: baseURL,
    // Keeps e2e runs out of the real log. Emptied before each run by
    // globalSetup, so the rings start at zero.
    env: { NUTRITION_DB_PATH: E2E_DATABASE_PATH },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
