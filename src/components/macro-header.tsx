import { MacroRing } from "@/components/macro-ring";
import type { MacroTotals } from "@/lib/nutrition/food-entry";
import { DAILY_TARGETS, MACRO_DISPLAY } from "@/lib/nutrition/targets";

export type MacroHeaderProps = {
  /** Today's consumption, as derived on the server. */
  totals: MacroTotals;
};

/**
 * The four daily targets across the top of the page. A fixed four-column grid,
 * so the stats never wrap and never scroll horizontally.
 */
export function MacroHeader({ totals }: MacroHeaderProps) {
  return (
    <header className="bg-card w-full border-b">
      <div className="mx-auto grid max-w-4xl grid-cols-4 gap-4 px-6 py-5">
        {MACRO_DISPLAY.map(({ key, label, unit }) => (
          <MacroRing
            key={key}
            label={label}
            // Tenths are recorded but not worth reading at a glance.
            consumed={Math.round(totals[key])}
            target={DAILY_TARGETS[key]}
            unit={unit}
          />
        ))}
      </div>
    </header>
  );
}
