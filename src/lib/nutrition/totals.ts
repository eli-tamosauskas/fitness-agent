import type { FoodEntry, MacroTotals } from "./food-entry";

const ZERO: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/** Floating point noise is not interesting; a tenth of a gram is. */
function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * How far the base nutrients have to be scaled to reach what was actually
 * eaten. A serving count multiplies the per-serving base directly; grams scale
 * a per-100g base.
 */
function multiplierFor(entry: FoodEntry): number {
  return entry.unit === "g" ? entry.quantity / 100 : entry.quantity;
}

/** The four totals for a set of entries. An empty set totals zero. */
export function totalsFor(entries: readonly FoodEntry[]): MacroTotals {
  const summed = entries.reduce<MacroTotals>((running, entry) => {
    const multiplier = multiplierFor(entry);
    return {
      calories: running.calories + entry.calories * multiplier,
      protein: running.protein + entry.protein * multiplier,
      carbs: running.carbs + entry.carbs * multiplier,
      fat: running.fat + entry.fat * multiplier,
    };
  }, ZERO);

  return {
    calories: roundToTenth(summed.calories),
    protein: roundToTenth(summed.protein),
    carbs: roundToTenth(summed.carbs),
    fat: roundToTenth(summed.fat),
  };
}
