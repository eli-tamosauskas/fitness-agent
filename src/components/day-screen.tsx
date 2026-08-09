import { Chat } from "@/components/chat";
import { DayNavigation } from "@/components/day-navigation";
import { MacroHeader } from "@/components/macro-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { DayView } from "@/lib/day-view";

/**
 * One day on screen: the days there are to go to beside its rings and its
 * conversation. Both routes render this — today and a past day differ only in
 * what the read seam returned, not in how they are composed.
 *
 * Read-only is derived here, once, from the day the server named, and threaded
 * down. Nothing below this asks what day it is or decides for itself whether it
 * may be written to.
 */
export function DayScreen({ day }: { day: DayView }) {
  const readOnly = !day.isToday;

  return (
    // Height-bounded rather than the provider's own min-height: the page does
    // not grow past the viewport, the conversation scrolls inside it.
    <SidebarProvider className="h-full min-h-0">
      <DayNavigation dates={day.dates} viewing={day.date} today={day.today} />
      <SidebarInset className="min-h-0 overflow-hidden">
        <h1 className="sr-only">Nutrition tracker</h1>
        {/* Today's rings are the default reading and need no label; a past
            day's numbers would otherwise pass for current progress. */}
        <MacroHeader
          totals={day.totals}
          date={readOnly ? day.date : undefined}
        />
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-6 py-8">
          {/* Keyed by the day, because a different day is a different
              conversation. Moving between two past days stays inside the same
              route segment, so without this the chat would be reconciled in
              place and keep the messages it was first given — rings from the
              day chosen, transcript from the day left. The remount is also
              what aborts a reply still streaming. */}
          <Chat
            key={day.date}
            initialMessages={day.messages}
            readOnly={readOnly}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
