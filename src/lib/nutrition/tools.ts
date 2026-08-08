import { tool } from "ai";
import { z } from "zod";

import { dailySummary } from "./daily-summary";
import { defaultDatabasePath, insertEntry } from "./database";
import {
  foodEntryInputSchema,
  isoDateSchema,
  type FoodEntry,
  type IsoDate,
} from "./food-entry";
import { lookUpUsdaFood, type UsdaLookupOptions } from "./usda";

export type NutritionToolsOptions = {
  /**
   * The user's local day, as computed by their browser. Every write lands
   * here: there is no back-dating, so the tools take no date to write to.
   */
  today: IsoDate;
  databasePath?: string;
  /** How FoodData Central is reached. Overridden by tests. */
  usda?: UsdaLookupOptions;
};

/**
 * The tools the agent is given, and the seam the tests work against. Everything
 * below this — the arithmetic, the rows, the queries — is free to change.
 */
export function createNutritionTools({
  today,
  databasePath = defaultDatabasePath(),
  usda,
}: NutritionToolsOptions) {
  return {
    logFoodEntry: tool({
      description:
        "Record something the user ate in today's log. Give the nutrients for one serving, " +
        "or per 100g when the quantity is in grams — never multiplied out. Commit the entry " +
        "immediately; do not ask the user to confirm first.",
      inputSchema: foodEntryInputSchema,
      execute: (input): FoodEntry => insertEntry(databasePath, today, input),
    }),

    lookUpUsdaFood: tool({
      description:
        "Look up an unlabelled whole food — fruit, vegetables, meat, anything with no packet — " +
        "in USDA FoodData Central. Returns the matched food's name and its nutrients per 100g. " +
        "Always tell the user which food matched, so they can spot a wrong match. " +
        "If found is false, tell the user the lookup failed and do not log anything for it.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe("The food to search for, e.g. 'kiwi' or 'chicken breast'"),
      }),
      execute: ({ query }) => lookUpUsdaFood(query, usda),
    }),

    getDailySummary: tool({
      description:
        "Get the calorie and macro totals for a single day. Resolve any relative date " +
        "the user gives to a YYYY-MM-DD date first.",
      inputSchema: z.object({
        date: isoDateSchema.describe("The day to summarise, as YYYY-MM-DD"),
      }),
      execute: ({ date }) => dailySummary(date, databasePath),
    }),
  };
}

export type NutritionTools = ReturnType<typeof createNutritionTools>;
