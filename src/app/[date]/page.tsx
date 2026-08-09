import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { DayScreen } from "@/components/day-screen";
import { dayView } from "@/lib/day-view";
import { isoDateSchema } from "@/lib/nutrition/food-entry";
import { APP_TIME_ZONE } from "@/lib/nutrition/local-date";

/**
 * A day at its own address, server-rendered. The server knows the date at
 * request time, so there is no client fetch and no loading state — the page
 * arrives whole or not at all.
 *
 * A segment that is not a real date is a 404: it is a URL that was typed or
 * mistyped, not a day with nothing on it. A date that has not happened yet
 * redirects to today rather than rendering an empty day, which would read as a
 * record of a day nobody has lived.
 *
 * A real past date with nothing behind it renders an empty read-only day. The
 * daily summary already reports a day as untracked, which is exactly this case,
 * so a bookmark kept from before anything was logged still opens.
 */
export default async function Page({ params }: PageProps<"/[date]">) {
  // The same reason as the root route: the day and the conversation are read
  // per request, not once per server.
  await connection();

  const { date } = await params;

  const parsed = isoDateSchema.safeParse(date);
  if (!parsed.success) notFound();

  // Which day it is, is the seam's to say — including whether this one has
  // happened. Asking the clock here as well would let a request that arrives
  // either side of midnight be called future and then rendered as a past day.
  const day = dayView(parsed.data, APP_TIME_ZONE);
  if (day.isFuture) redirect("/");

  return <DayScreen day={day} />;
}
