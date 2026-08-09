import { MacroRing } from "@/components/macro-ring";
import type { IsoDate, MacroTotals } from "@/lib/nutrition/food-entry";
import { DAILY_TARGETS, MACRO_DISPLAY } from "@/lib/nutrition/targets";

export type MacroHeaderProps = {
  /** The viewed day's consumption, as derived on the server. */
  totals: MacroTotals;
  /**
   * The day these figures belong to, named above them. Supplied only when that
   * day is not today: today's rings are the default reading and need no label,
   * whereas a past day's do — the sidebar is off-canvas on a phone, so without
   * this the screen would show unfamiliar numbers and a missing composer with
   * nothing on it explaining either.
   */
  date?: IsoDate;
};

/**
 * The four daily targets across the top of the page. A fixed four-column grid,
 * so the stats never wrap and never scroll horizontally.
 */
export function MacroHeader({ totals, date }: MacroHeaderProps) {
  return (
    <header className="bg-card w-full border-b">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-5">
        {date && (
          <p className="text-muted-foreground text-sm font-medium tabular-nums">
            {date} log
          </p>
        )}
        <div className="grid grid-cols-4 gap-4">
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
      </div>
    </header>
  );
}
