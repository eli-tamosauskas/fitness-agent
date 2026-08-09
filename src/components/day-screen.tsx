import { Chat } from "@/components/chat";
import { MacroHeader } from "@/components/macro-header";
import type { DayView } from "@/lib/day-view";

/**
 * One day on screen: its rings above its conversation. Both routes render this
 * — today and a past day differ only in what the read seam returned, not in how
 * they are composed.
 *
 * Read-only is derived here, once, from the day the server named, and threaded
 * down. Nothing below this asks what day it is or decides for itself whether it
 * may be written to.
 */
export function DayScreen({ day }: { day: DayView }) {
  const readOnly = !day.isToday;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="sr-only">Nutrition tracker</h1>
      {/* Today's rings are the default reading and need no label; a past day's
          numbers would otherwise pass for current progress. */}
      <MacroHeader totals={day.totals} date={readOnly ? day.date : undefined} />
      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-6 py-8">
        <Chat initialMessages={day.messages} readOnly={readOnly} />
      </main>
    </div>
  );
}
