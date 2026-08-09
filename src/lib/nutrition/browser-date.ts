import { cookies } from "next/headers";

import { isoDateSchema, type IsoDate } from "./food-entry";
import { LOCAL_DATE_COOKIE, toIsoDate } from "./local-date";

/**
 * The browser's own calendar day, as it told us on first paint.
 *
 * Until it has — the very first visit, when there is nothing logged anyway —
 * the host's day is the best available guess. Chat writes never take this path:
 * they use the date sent with the request.
 */
export async function browserDate(): Promise<IsoDate> {
  const cookie = (await cookies()).get(LOCAL_DATE_COOKIE)?.value;
  const parsed = isoDateSchema.safeParse(cookie);
  return parsed.success ? parsed.data : toIsoDate(new Date());
}
