import { Chat } from "@/components/chat";
import { MacroHeader } from "@/components/macro-header";
import { dailySummary } from "@/lib/nutrition/daily-summary";
import { APP_TIME_ZONE, today } from "@/lib/nutrition/local-date";

/**
 * The single page: the server reads today's entries, derives the totals, and
 * renders them above the chat. There is no client-side total state, and no
 * first-paint guess at the day — the server names it.
 */
export default async function Page() {
  const { totals } = dailySummary(today(APP_TIME_ZONE));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="sr-only">Nutrition tracker</h1>
      <MacroHeader totals={totals} />
      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-6 py-8">
        <Chat />
      </main>
    </div>
  );
}
