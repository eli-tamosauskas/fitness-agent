import { connection } from "next/server";

import { DayScreen } from "@/components/day-screen";
import { dayView } from "@/lib/day-view";
import { APP_TIME_ZONE, today } from "@/lib/nutrition/local-date";

/**
 * The root route is today. It names the day itself rather than redirecting to
 * a dated URL, so the address a user keeps open stays the day they are on
 * rather than the day they opened it.
 */
export default async function Page() {
  // The clock and the database are both synchronous, and neither looks like a
  // reason to re-render to Next, which would otherwise answer every request
  // with the day and the conversation it first saw. This is what makes the
  // page request-time work: without it a reload shows yesterday's rings and a
  // conversation missing everything said since the server started.
  await connection();

  return <DayScreen day={dayView(today(APP_TIME_ZONE), APP_TIME_ZONE)} />;
}
