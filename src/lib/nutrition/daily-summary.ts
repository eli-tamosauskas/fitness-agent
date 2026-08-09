import { defaultDatabasePath, entriesForDate } from "./database";
import type { IsoDate, LoggedEntry, MacroTotals } from "./food-entry";
import { asLoggedEntry, totalsFor } from "./totals";

export type DailySummary = {
  date: IsoDate;
  totals: MacroTotals;
  /**
   * The day itemised, each entry carrying its id. Deleting from chat is
   * summary-then-delete — the conversation is disposable, so this is the only
   * place the agent can learn which id "the yogurt" is.
   */
  entries: LoggedEntry[];
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
  const entries = entriesForDate(databasePath, date);

  return {
    date,
    totals: totalsFor(entries),
    entries: entries.map(asLoggedEntry),
  };
}
