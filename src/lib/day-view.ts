import { conversationFor } from "@/lib/chat/conversation-store";
import type { NutritionUIMessage } from "@/lib/chat/message";
import { defaultDatabasePath, trackedDates } from "@/lib/nutrition/database";
import { dailySummary } from "@/lib/nutrition/daily-summary";
import type {
  IsoDate,
  LoggedEntry,
  MacroTotals,
} from "@/lib/nutrition/food-entry";
import { today } from "@/lib/nutrition/local-date";

/** Everything a day's page shows, and nothing it has to work out for itself. */
export type DayView = {
  date: IsoDate;
  /**
   * Whether this is the day the server is on. Every other difference between a
   * live day and a past one — the composer, the delete controls, the header's
   * date label — is derived from this once and threaded down, so no component
   * consults a clock of its own.
   */
  isToday: boolean;
  /**
   * Whether the day has not happened yet, which the route turns into a
   * redirect. It is reported here rather than worked out at the route so that
   * one read of the clock decides both this and `isToday`: two reads either
   * side of midnight could call a date future and then render it as a past day.
   */
  isFuture: boolean;
  /** Whether anything was ever logged. An untracked day is not a day of zero. */
  tracked: boolean;
  totals: MacroTotals;
  entries: LoggedEntry[];
  /** The day's conversation as it happened. Empty on a day nobody spoke on. */
  messages: NutritionUIMessage[];
  /** The days that can be navigated to, newest first, today always among them. */
  dates: IsoDate[];
};

/**
 * The days worth listing: every day something was logged on, plus today, which
 * belongs in the list whether or not anything has been logged on it yet — the
 * day you are on is never missing from the list you are navigating.
 *
 * A past day with a conversation but no entries is therefore not listed. A day
 * where nothing was logged is not a day worth listing.
 */
function datesToNavigate(now: IsoDate, databasePath: string): IsoDate[] {
  const tracked = trackedDates(databasePath);
  return tracked.includes(now) ? tracked : [now, ...tracked];
}

/**
 * One day's page, whole: what was eaten, what was said, and which other days
 * there are to go to. The sole read seam for a day — the route component calls
 * this and passes down what it returns, so there is one place to test the read
 * path and one place to change it.
 *
 * It composes the daily summary rather than replacing it. The summary keeps its
 * own shape and gains no messages: the agent's summary tool reads through it,
 * and the agent has no business receiving raw conversation state that way.
 *
 * The timezone is an argument rather than a constant read here, so a per-user
 * timezone later is a change to the call site, and tests can vary it.
 */
export function dayView(
  date: IsoDate,
  timeZone: string,
  databasePath: string = defaultDatabasePath(),
): DayView {
  const { tracked, totals, entries } = dailySummary(date, databasePath);
  const now = today(timeZone);

  return {
    date,
    isToday: date === now,
    // ISO dates compare as strings, which is the whole point of the format.
    isFuture: date > now,
    tracked,
    totals,
    entries,
    messages: conversationFor(date, databasePath),
    dates: datesToNavigate(now, databasePath),
  };
}
