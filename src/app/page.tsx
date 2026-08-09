import { Chat } from "@/components/chat";
import { MacroHeader } from "@/components/macro-header";
import { browserDate } from "@/lib/nutrition/browser-date";
import { dailySummary } from "@/lib/nutrition/daily-summary";

/**
 * The single page: the server reads today's entries, derives the totals, and
 * renders them above the chat. There is no client-side total state.
 */
export default async function Page() {
  const date = await browserDate();
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
