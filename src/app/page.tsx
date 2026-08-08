import { cookies } from "next/headers";

import { Chat } from "@/components/chat";
import { MacroHeader } from "@/components/macro-header";
import { isoDateSchema } from "@/lib/nutrition/food-entry";
import { LOCAL_DATE_COOKIE, toIsoDate } from "@/lib/nutrition/local-date";
import { dailySummary } from "@/lib/nutrition/daily-summary";

/**
 * Which day to render the rings for. The browser puts its own calendar day in a
 * cookie on first paint; until then — the very first visit, when there is
 * nothing logged anyway — the host's day is the best available guess. Writes
 * never take this path: they only ever use the date sent with the request.
 */
async function renderedDate(): Promise<string> {
  const cookie = (await cookies()).get(LOCAL_DATE_COOKIE)?.value;
  const parsed = isoDateSchema.safeParse(cookie);
  return parsed.success ? parsed.data : toIsoDate(new Date());
}

/**
 * The single page: the server reads today's entries, derives the totals, and
 * renders them above the chat. There is no client-side total state.
 */
export default async function Page() {
  const date = await renderedDate();
  const { totals } = dailySummary(date);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="sr-only">Nutrition tracker</h1>
      <MacroHeader totals={totals} />
      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-6 py-8">
        <Chat renderedDate={date} />
      </main>
    </div>
  );
}
