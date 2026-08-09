import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { asSchema } from "ai";

import type { DailySummary } from "./daily-summary";
import { closeDatabase } from "./database";
import type { IsoDate, LoggedEntry } from "./food-entry";
import {
  createNutritionTools,
  type DeletionResult,
  type NutritionTools,
} from "./tools";
import type { UsdaLookupResult } from "./usda";

type NutritionTool = NutritionTools[keyof NutritionTools];

/**
 * Runs a tool the way the AI SDK's tool loop does: validate the input against
 * the tool's own schema, then execute. Executing directly would skip the
 * validation, and invalid input would then reach the database in a test while
 * being rejected in production.
 */
async function callTool<Output>(
  tool: NutritionTool,
  input: unknown,
): Promise<Output> {
  // Widened because the two tools take different inputs; the harness only ever
  // hands them `unknown` and lets their own schemas decide.
  const { inputSchema, execute } = tool as {
    inputSchema: Parameters<typeof asSchema>[0];
    execute: (input: unknown, options: unknown) => Promise<Output> | Output;
  };

  const validated = await asSchema(inputSchema).validate!(input);
  if (!validated.success) throw validated.error;

  return await execute(validated.value, {
    toolCallId: "test-tool-call",
    messages: [],
  });
}

export type ToolHarness = {
  /** The local day the harness's writes land on. */
  today: IsoDate;
  logFoodEntry(input: unknown): Promise<LoggedEntry>;
  lookUpUsdaFood(input: unknown): Promise<UsdaLookupResult>;
  getDailySummary(input: unknown): Promise<DailySummary>;
  deleteFoodEntry(input: unknown): Promise<DeletionResult>;
  dispose(): void;
};

export type ToolHarnessOptions = {
  today: IsoDate;
  /** Stands in for FoodData Central, so no test touches the network. */
  fetch?: typeof fetch;
};

/**
 * The agent's tools wired to a throwaway SQLite file. One database per
 * harness, removed on `dispose`, so tests never see each other's entries.
 */
export function createToolHarness({
  today,
  fetch: fetchImpl,
}: ToolHarnessOptions): ToolHarness {
  const directory = mkdtempSync(join(tmpdir(), "nutrition-"));
  const databasePath = join(directory, "nutrition.db");
  const tools = createNutritionTools({
    today,
    databasePath,
    usda: {
      // Supplied because a lookup with no key short-circuits before it asks
      // the fake anything.
      apiKey: "test-api-key",
      fetch: fetchImpl,
    },
  });

  return {
    today,
    logFoodEntry: (input) => callTool<LoggedEntry>(tools.logFoodEntry, input),
    lookUpUsdaFood: (input) =>
      callTool<UsdaLookupResult>(tools.lookUpUsdaFood, input),
    getDailySummary: (input) =>
      callTool<DailySummary>(tools.getDailySummary, input),
    deleteFoodEntry: (input) =>
      callTool<DeletionResult>(tools.deleteFoodEntry, input),
    dispose: () => {
      closeDatabase(databasePath);
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
