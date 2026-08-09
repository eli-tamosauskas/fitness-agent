# A past day is a read-only URL

Status: ready-for-agent

## Parent

`.scratch/chat-history/spec.md`

## What to build

A past day becomes somewhere you can go: a real URL, server-rendered, showing that day's
rings and that day's conversation exactly as it happened — and refusing to be written to.

**One read seam.** A single function takes a date, a timezone and a database path and
returns everything a day's page needs: the date, whether it is today, whether it was
tracked, the totals, the logged entries, the conversation's messages, and the list of
dates for the sidebar. This is the sole read seam for the feature — the route component
calls it and passes what it returns down. No component computes the current day, and no
component decides on its own whether it is read-only.

It **composes** the existing daily-summary function rather than replacing it. The daily
summary keeps its current shape and **must not gain messages**: the agent's summary tool
reads through it, and the agent has no business receiving raw conversation state through
that path.

**Routing.** The root route is today. A dated route segment serves a past day. Both are
server-rendered; there is no client fetch layer and no loading state, because the server
knows the date at request time. A malformed date is a 404. A future date redirects to
today. A valid past date with nothing behind it renders an empty read-only day — the daily
summary already reports a day as untracked, which is exactly this case.

**Read-only.** Derived once, on the server, from the viewed date against the server's
current day, and threaded down as a flag. The composer is not rendered. The delete control
on logged-entry cards is not rendered. The conversation's empty state changes copy by
read-only state: today keeps its current invitation to log something; a past day reads as
a statement that there was no conversation, with no call to action. **The date-scoped
delete in the food log module remains the actual enforcement** — the hidden UI is a
courtesy, not a security boundary, and the existing constraint is not relaxed.

**Header.** The macro header shows the **viewed** day's totals, not today's; showing
current progress above a past conversation would be actively misleading. It names the date
(`YYYY-MM-DD log`) **only when the viewed day is not today** — today needs no label, the
rings are the default reading. This is not redundant with the sidebar, which is off-canvas
on mobile, the app's primary device: without the header label a phone showing a past day
would present unfamiliar numbers and a missing composer with nothing on screen explaining
either.

The agent's existing ability to answer about past days from the food log is **retained
unchanged**. Navigation and asking are different affordances: a user knows "last Tuesday"
long before they know which date that was.

## Acceptance criteria

- [x] One function takes a date, a timezone and a database path and returns the date, whether it is today, whether it was tracked, the totals, the logged entries, the conversation's messages, and the date list for the sidebar
- [x] It composes the existing daily-summary function; the daily summary keeps its current shape and does not gain messages
- [x] Tests drive that function against a temporary database and cover: a day with entries and a conversation; a day with entries and no conversation; a date with nothing behind it; today appearing in the date list before anything is logged; the date list ordered newest first; and the today/past determination against a supplied timezone
- [x] A dated route segment renders that day's rings and conversation, server-rendered with no loading state
- [x] A malformed date returns a 404
- [x] A future date redirects to today
- [x] A valid past date with nothing behind it renders an empty read-only day rather than erroring
- [x] A day tracked but never chatted on opens cleanly and states that there was no conversation
- [x] Read-only is derived once on the server and threaded down; no component computes the current day or decides read-only for itself
- [x] Component tests: a read-only day renders no composer and no delete controls; a past day's empty state shows the statement rather than the invitation; the header shows a date label on a past day and none on today
- [x] The header's rings show the viewed day's totals
- [x] The date-scoped delete in the food log module is unchanged and still refuses a past day
- [x] The back button returns to the day navigated from
- [x] A Playwright spec navigates to a past day and asserts there is no composer
- [x] The agent still answers questions about past days from the food log, unchanged

## Blocked by

- `02-todays-conversation-persists.md`
