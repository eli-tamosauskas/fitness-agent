/**
 * The four daily nutrition targets.
 *
 * These are hardcoded by design: they are not per-day and not user-editable.
 * Changing a target is a code edit here and nowhere else.
 */
export const DAILY_TARGETS = {
  calories: 2400,
  protein: 180,
  carbs: 240,
  fat: 80,
} as const;

export type MacroKey = keyof typeof DAILY_TARGETS;

export type MacroUnit = "cal" | "g";

/** How one target is named and unit-suffixed in the UI. */
export type MacroDisplay = {
  key: MacroKey;
  label: string;
  unit: MacroUnit;
};

/** The four targets in the order they are displayed. */
export const MACRO_DISPLAY: readonly MacroDisplay[] = [
  { key: "calories", label: "Calories", unit: "cal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
];
