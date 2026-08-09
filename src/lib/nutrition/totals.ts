import type { FoodEntry, LoggedEntry, MacroTotals } from "./food-entry";

const ZERO: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/** Floating point noise is not interesting; a tenth of a gram is. */
function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function rounded(totals: MacroTotals): MacroTotals {
  return {
    calories: roundToTenth(totals.calories),
    protein: roundToTenth(totals.protein),
    carbs: roundToTenth(totals.carbs),
    fat: roundToTenth(totals.fat),
  };
}

function added(left: MacroTotals, right: MacroTotals): MacroTotals {
  return {
    calories: left.calories + right.calories,
    protein: left.protein + right.protein,
    carbs: left.carbs + right.carbs,
    fat: left.fat + right.fat,
  };
}

/**
 * How far the base nutrients have to be scaled to reach what was actually
 * eaten. A serving count multiplies the per-serving base directly; grams scale
 * a per-100g base.
 */
function multiplierFor(entry: FoodEntry): number {
  return entry.unit === "g" ? entry.quantity / 100 : entry.quantity;
}

/**
 * The one place a base nutrient is ever multiplied. Left unrounded so a day's
 * total is rounded once, at the end, rather than once per entry.
 */
function scaled(entry: FoodEntry): MacroTotals {
  const multiplier = multiplierFor(entry);
  return {
    calories: entry.calories * multiplier,
    protein: entry.protein * multiplier,
    carbs: entry.carbs * multiplier,
    fat: entry.fat * multiplier,
  };
}

/**
 * What one entry actually contributed: its base nutrients scaled by the amount
 * eaten. This is what a card shows and what the itemised summary reports.
 */
export function consumedFor(entry: FoodEntry): MacroTotals {
  return rounded(scaled(entry));
}

/** An entry paired with what it contributed, which is how it is shown back. */
export function asLoggedEntry(entry: FoodEntry): LoggedEntry {
  return { ...entry, consumed: consumedFor(entry) };
}

/** The four totals for a set of entries. An empty set totals zero. */
export function totalsFor(entries: readonly FoodEntry[]): MacroTotals {
  return rounded(
    entries.reduce<MacroTotals>(
      (running, entry) => added(running, scaled(entry)),
      ZERO,
    ),
  );
}
