import type { IsoDate } from "./food-entry";

/**
 * The timezone the app's calendar day is measured in. Supplied to `today` at
 * the call site rather than read from module scope inside it, so making this a
 * per-user setting later is a change to where the value comes from, not a
 * change to how the day is derived.
 */
export const APP_TIME_ZONE = "Europe/Vilnius";

/**
 * `YYYY-MM-DD` as a moment on that calendar day locally. Built from the parts
 * rather than parsed, because `new Date("2026-05-13")` is UTC midnight — which
 * is the day before, anywhere west of Greenwich.
 *
 * Out-of-range parts roll over rather than fail, so a caller checking whether a
 * date is real has to compare the parts back.
 *
 * The host timezone this lands in does not matter and is not `APP_TIME_ZONE`:
 * the parts go in and come back out unchanged, which is all its two callers —
 * the validity check and the weekday — read off it.
 */
export function parseLocalDate(date: IsoDate): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * A date with its weekday spelled out, as the agent is told it. "Last Tuesday"
 * cannot be resolved from `2026-05-13` alone, and a model counting back to a
 * weekday it had to infer is a date the user would have to check.
 */
export function describeIsoDate(date: IsoDate): string {
  return `${date} (${WEEKDAYS[parseLocalDate(date).getDay()]})`;
}

/**
 * Today in the supplied timezone — the app's only answer to "what day is it",
 * decided by the server and never asked of the browser.
 *
 * `en-CA` formats a date as `YYYY-MM-DD` already, so there is nothing to
 * reassemble. The timezone is named rather than expressed as an offset because
 * the zone carries its own daylight-saving rules: a fixed offset would put the
 * app a day out for an hour, twice a year.
 *
 * The instant defaults to now; tests supply one so they can hold time still and
 * vary the timezone instead.
 */
export function today(timeZone: string, moment: Date = new Date()): IsoDate {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(moment);
}
