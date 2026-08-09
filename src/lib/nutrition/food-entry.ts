import { z } from "zod";

import { parseLocalDate } from "./local-date";
import type { MacroKey } from "./targets";

/**
 * A local calendar day as `YYYY-MM-DD`.
 *
 * Which day it is is always decided by the browser and carried inwards; the
 * server never asks its own clock.
 */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected a date of the form YYYY-MM-DD")
  // The shape alone would let `2026-13-45` through and put entries on a day
  // that does not exist.
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const moment = parseLocalDate(value);
    return (
      moment.getFullYear() === year &&
      moment.getMonth() === month - 1 &&
      moment.getDate() === day
    );
  }, "expected a real calendar date");

export type IsoDate = string;

/** The input path an entry came from. */
export const FOOD_SOURCES = ["label", "usda", "stated"] as const;
export type FoodSource = (typeof FOOD_SOURCES)[number];

/** The unit the consumed quantity is expressed in. */
export const QUANTITY_UNITS = ["serving", "g"] as const;
export type QuantityUnit = (typeof QUANTITY_UNITS)[number];

/** The four nutrients, in the four fixed keys the targets and rings use. */
export type MacroTotals = Record<MacroKey, number>;

/**
 * The four nutrients as they are recorded against an entry: per one serving
 * when the quantity is in servings, per 100g when it is in grams. Never
 * pre-multiplied by the quantity — totals are derived on read.
 */
export const baseNutrientsSchema = z.object({
  calories: z
    .number()
    .min(0)
    .describe("Calories per one serving, or per 100g when the unit is g"),
  protein: z
    .number()
    .min(0)
    .describe("Grams of protein per one serving, or per 100g"),
  carbs: z
    .number()
    .min(0)
    .describe("Grams of carbohydrate per one serving, or per 100g"),
  fat: z.number().min(0).describe("Grams of fat per one serving, or per 100g"),
});

export type BaseNutrients = z.infer<typeof baseNutrientsSchema>;

/** Everything needed to record one entry, minus the day and the id. */
export const foodEntryInputSchema = baseNutrientsSchema.extend({
  description: z
    .string()
    .min(1)
    .describe("What was eaten, in the user's own words"),
  source: z
    .enum(FOOD_SOURCES)
    .describe(
      "Where the numbers came from: a nutrition label, a USDA lookup, or stated directly by the user",
    ),
  quantity: z
    .number()
    .positive()
    .describe("How much was consumed, in the given unit"),
  unit: z
    .enum(QUANTITY_UNITS)
    .describe(
      "'serving' when the base nutrients are per serving, 'g' when they are per 100g",
    ),
});

export type FoodEntryInput = z.infer<typeof foodEntryInputSchema>;

/** An entry as it exists in the log. */
export type FoodEntry = FoodEntryInput & {
  id: number;
  date: IsoDate;
};

/**
 * An entry as it is shown back — to the user on a card, and to the agent in a
 * summary. The nutrients on the entry itself are the base figures; `consumed`
 * is what they came to once the amount was applied.
 */
export type LoggedEntry = FoodEntry & {
  consumed: MacroTotals;
};
