import { defaultDatabasePath, entriesForDate } from "./database";
import type { IsoDate, MacroTotals } from "./food-entry";
import { totalsFor } from "./totals";

export type DailySummary = {
  date: IsoDate;
  totals: MacroTotals;
};

/**
 * One day's consumption. The single way anything reads the log — the agent's
 * summary tool and the server component behind the rings both come through
 * here, so there is only ever one set of totals for a day.
 */
export function dailySummary(
  date: IsoDate,
  databasePath: string = defaultDatabasePath(),
): DailySummary {
  return { date, totals: totalsFor(entriesForDate(databasePath, date)) };
}
