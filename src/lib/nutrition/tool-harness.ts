import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { asSchema } from "ai";

import type { DailySummary } from "./daily-summary";
import { closeDatabase } from "./database";
import type { FoodEntry, IsoDate } from "./food-entry";
import { createNutritionTools, type NutritionTools } from "./tools";

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
  logFoodEntry(input: unknown): Promise<FoodEntry>;
  getDailySummary(input: unknown): Promise<DailySummary>;
  dispose(): void;
};

/**
 * The agent's tools wired to a throwaway SQLite file. One database per
 * harness, removed on `dispose`, so tests never see each other's entries.
 */
export function createToolHarness({ today }: { today: IsoDate }): ToolHarness {
  const directory = mkdtempSync(join(tmpdir(), "nutrition-"));
  const databasePath = join(directory, "nutrition.db");
  const tools = createNutritionTools({ today, databasePath });

  return {
    today,
    logFoodEntry: (input) => callTool<FoodEntry>(tools.logFoodEntry, input),
    getDailySummary: (input) =>
      callTool<DailySummary>(tools.getDailySummary, input),
    dispose: () => {
      closeDatabase(databasePath);
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
