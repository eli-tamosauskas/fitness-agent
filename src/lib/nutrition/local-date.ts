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
 * Today, in the local timezone of whoever calls it. On the client that is the
 * user's own day, which is the only definition of "today" this app honours for
 * writes.
 */
export function localToday(): IsoDate {
  return toIsoDate(new Date());
}
