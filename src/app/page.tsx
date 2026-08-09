import { connection } from "next/server";

import { Chat } from "@/components/chat";
import { MacroHeader } from "@/components/macro-header";
import { conversationFor } from "@/lib/chat/conversation-store";
import { dailySummary } from "@/lib/nutrition/daily-summary";
import { APP_TIME_ZONE, today } from "@/lib/nutrition/local-date";

/**
 * The single page: the server reads today's entries and today's conversation,
 * derives the totals, and renders them above the chat. There is no client-side
 * total state, and no first-paint guess at the day — the server names it.
 */
export default async function Page() {
  // The clock and the database are both synchronous, and neither looks like a
  // reason to re-render to Next, which would otherwise answer every request
  // with the day and the conversation it first saw. This is what makes the
  // page request-time work: without it a reload shows yesterday's rings and a
  // conversation missing everything said since the server started.
  await connection();

  const date = today(APP_TIME_ZONE);
  const { totals } = dailySummary(date);
  const messages = conversationFor(date);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="sr-only">Nutrition tracker</h1>
      <MacroHeader totals={totals} />
      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-6 py-8">
        <Chat initialMessages={messages} />
      </main>
    </div>
  );
}
