import { MacroRing } from "@/components/macro-ring";
import { DAILY_TARGETS, MACRO_DISPLAY } from "@/lib/nutrition/targets";

/**
 * The four daily targets across the top of the page. A fixed four-column grid,
 * so the stats never wrap and never scroll horizontally.
 *
 * Nothing is logged yet, so consumption is zero for every target.
 */
export function MacroHeader() {
  return (
    <header className="bg-card w-full border-b">
      <div className="mx-auto grid max-w-4xl grid-cols-4 gap-4 px-6 py-5">
        {MACRO_DISPLAY.map(({ key, label, unit }) => (
          <MacroRing
            key={key}
            label={label}
            consumed={0}
            target={DAILY_TARGETS[key]}
            unit={unit}
          />
        ))}
      </div>
    </header>
  );
}
