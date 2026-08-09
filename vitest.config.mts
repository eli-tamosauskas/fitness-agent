import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  // Resolves the `@/*` -> `./src/*` alias from tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    // A day boundary that behaves differently either side of Greenwich is the
    // whole point of this app's date handling, so the tests are run somewhere
    // that is not UTC — under UTC a date parsed as an instant and a date read
    // as a local day agree, and the tests that exist to tell them apart pass
    // either way.
    env: { TZ: "America/Los_Angeles" },
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
  },
});
