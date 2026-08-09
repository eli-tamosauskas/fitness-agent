import type { IsoDate } from "./food-entry";

/**
 * The browser writes its own calendar day here so the server can render the
 * right day's totals without consulting its own clock.
 */
export const LOCAL_DATE_COOKIE = "local-date";

/** A `Date` rendered as `YYYY-MM-DD` in whatever timezone that `Date` is in. */
export function toIsoDate(moment: Date): IsoDate {
  const year = String(moment.getFullYear()).padStart(4, "0");
  const month = String(moment.getMonth() + 1).padStart(2, "0");
  const day = String(moment.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * `YYYY-MM-DD` as a moment on that calendar day locally. Built from the parts
 * rather than parsed, because `new Date("2026-05-13")` is UTC midnight — which
 * is the day before, anywhere west of Greenwich.
 *
 * Out-of-range parts roll over rather than fail, so a caller checking whether a
 * date is real has to compare the parts back.
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
 * Today, in the local timezone of whoever calls it. On the client that is the
 * user's own day, which is the only definition of "today" this app honours for
 * writes.
 */
export function localToday(): IsoDate {
  return toIsoDate(new Date());
}
