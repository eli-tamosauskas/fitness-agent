# Persisted per-day chat history

Status: ready-for-agent

## Problem Statement

The conversation is the app. Everything the user does — logging a meal, correcting an
amount, asking how a day went — happens by talking to the agent. But the conversation
does not survive anything. Reload the page and it is gone. Open the app on a phone after
logging lunch on a laptop and it is gone. Close the tab and it is gone.

This costs the user three things:

- **The record of why.** The rings say 1,840 calories. The conversation said which meals
  those were, which USDA match the agent picked, and which label photo an entry came
  from. Only the rings survive a reload, so the reasoning behind the numbers evaporates
  while the numbers remain.
- **Continuity within a day.** Logging happens across a whole day, in short bursts, on
  whichever device is to hand. Every burst currently starts from an empty chat with an
  agent that has no memory of the morning. "Delete the yogurt I mentioned earlier" cannot
  work, because there is no earlier.
- **Any way to look back.** The agent can answer "how did I do on the 13th" from the food
  log, but there is no way to re-read what was actually said on a past day, and no way to
  see at a glance which days were tracked at all.

## Solution

Each calendar day gets one conversation, stored on the server, keyed by the date. It
persists across reloads and across devices.

A sidebar to the left of the chat lists the days that have been tracked, newest first.
Today's row reads "Today"; every other row reads its date as `YYYY-MM-DD`. Selecting a
row opens that day: its macro rings, and the conversation exactly as it happened.

Past days are **read-only**. The composer is hidden, and the delete controls on logged
entries are not rendered. You can read a past day; you cannot change it. This mirrors a
rule the app already enforces at the database layer — writes are confined to the current
day — and makes it visible rather than merely enforced.

Alongside this, the app stops asking the browser what day it is. Today is derived on the
server from a fixed timezone constant. This removes an entire class of first-paint
guessing, and is a precondition for the feature rather than an aside: a server-rendered
day page cannot render at all without knowing, at request time, which day it is.

## User Stories

1. As a user, I want my conversation to still be there after I reload the page, so that I
   do not lose the record of what I logged.
2. As a user, I want my conversation to still be there after I close and reopen the app,
   so that logging across a whole day feels like one session.
3. As a user, I want the conversation I started on my laptop to appear on my phone, so
   that I can keep logging wherever I am.
4. As a user, I want each calendar day to have exactly one conversation, so that there is
   never a question of which thread a meal belongs to.
5. As a user, I want a sidebar listing the days I have tracked, so that I can find a past
   day without remembering its date.
6. As a user, I want the day list ordered newest first, so that recent days — the ones I
   actually revisit — are at the top.
7. As a user, I want today's row in the list to read "Today", so that I can find where I
   am without doing date arithmetic.
8. As a user, I want past rows to read `YYYY-MM-DD`, so that the list scans as a column of
   dates.
9. As a user, I want today to appear in the list even before I have logged anything, so
   that the day I am on is never missing from the list I am navigating.
10. As a user, I want to click a past day and see that day's conversation, so that I can
    re-read what I said and what the agent replied.
11. As a user, I want a past day's macro rings to show that day's totals, so that the
    numbers above the conversation describe the conversation I am reading.
12. As a user, I want the header to name the date when I am not on today, so that I never
    mistake a past day's rings for my current progress.
13. As a user, I want no date label cluttering the header when I am on today, so that the
    default screen stays as clean as it is now.
14. As a user, I want the composer hidden on a past day, so that I am not invited to write
    into a day that cannot accept writes.
15. As a user, I want the delete controls on a past day's logged entries to be absent, so
    that I am not offered a button that would do nothing.
16. As a user, I want past days to stay genuinely unwritable, so that history is something
    I can trust rather than something I might have edited by accident.
17. As a user, I want a past day I tracked but never chatted on to open cleanly and say so,
    so that an empty conversation reads as a fact rather than a failure.
18. As a user, I want a date with nothing behind it to show an empty read-only day, so that
    a URL I typed or a bookmark I kept does not error.
19. As a user, I want a future date to send me back to today, so that I cannot end up
    looking at a day that has not happened.
20. As a user, I want a past day to be a real URL, so that I can bookmark it, share it with
    myself, and use the back button.
21. As a user, I want the back button to return me to the day I came from, so that browsing
    history behaves like browsing anything else.
22. As a user, I want the agent to remember what I said earlier today, so that "delete the
    yogurt I mentioned" works against the conversation I can plainly see on screen.
23. As a user, I want a label photo I sent to still be marked in the conversation after a
    reload, so that I can see that an entry came from a photo.
24. As a user, I want the agent's written summary of a label to survive, so that the useful
    content of the photo outlasts the photo itself.
25. As a user, I want opening a past day to be fast, so that browsing history does not
    become the slowest part of the app.
26. As a user, I want the sidebar to slide away on my phone, so that the conversation gets
    the full width on the device I mostly use.
27. As a user, I want the sidebar always visible on a desktop, so that I can move between
    days without an extra tap.
28. As a user, I want a meal logged just before I lost connection to still appear in my
    history, so that the rings never show food that no message explains.
29. As a user, I want an entry logged at 00:05 to land on the new day, so that late-night
    meals are counted where I would expect them.
30. As a user, I want to keep asking the agent "how did I do last Tuesday", so that I can
    reach a day by describing it rather than finding it in a list.
31. As a user, I want the app to know what day it is without asking my browser, so that the
    page never renders the wrong day and then corrects itself.
32. As a user, I want the date to stay correct across daylight saving changes, so that the
    day never shifts by an hour twice a year.
33. As a developer, I want one function to serve everything a day's page needs, so that
    the read path has a single place to test and a single place to change.
34. As a developer, I want the conversation store separated from the food log module, so
    that two unrelated concerns do not grow into each other.
35. As a developer, I want the browser-date machinery deleted rather than left dormant, so
    that there is exactly one answer to "what day is it".

## Implementation Decisions

### Server-derived date (a precondition, in the same change)

Today is derived on the server from a timezone constant, not reported by the browser.

- A `today(timeZone)` function returns the ISO date, computed with
  `Intl.DateTimeFormat("en-CA", { timeZone })`, which emits `YYYY-MM-DD` directly. **Never
  a fixed UTC offset** — Vilnius observes daylight saving, and an offset constant would
  place the app on the wrong day for an hour twice a year.
- The timezone is a constant (`Europe/Vilnius`) living beside that function, and is
  **passed as an argument** rather than read from module scope. A future per-user timezone
  setting then becomes "change where the constant is supplied", and tests can assert
  behaviour across timezones without mocking the system clock.
- **Deleted in this change**, not left dormant: the local-date cookie and its constant, the
  server-side function that read it, the client-side "today" helper, the `today` field on
  the chat request schema, the `body: { today }` passed to `sendMessage`, and the
  client-side midnight-rollover effect. Two competing sources of truth for the current day
  — one of them dead — is worse than either alone.
- **Consequence accepted:** a tab left open across midnight shows the previous day's header
  until the user navigates or reloads. Nothing is mis-recorded — the server stamps each
  message and each food entry with its own current day — only the display lags. Judged not
  worth a client-side clock, which is the complexity this change exists to remove.
- **Consequence gained:** the client can no longer name the day, so a crafted request can
  no longer write into a past day. The previous design trusted a client-supplied date.

### Conversation storage

- A new table in the existing database file: `chat_days(date TEXT PRIMARY KEY,
  messages_json TEXT NOT NULL)`. Upserted whole.
- **One row per day, not one row per message.** A day's conversation is always read whole
  and written whole; per-message rows would buy ordering columns and pagination that
  nothing would use.
- **Same database file, separate module.** The domain separation is real and is achieved
  by a distinct module with its own functions — not by a second file, which would require
  duplicating the path helper, the connection cache, the environment variable, and the
  reset story. There are no foreign keys between the conversation table and the food log
  table; they are neighbours, not entangled.
- The database path environment variable keeps its current name. The file holds a food log
  and conversations about that food log; a vaguer name would not be a truer one.

### Write path

- The API route owns persistence. The incoming user message is appended on arrival; the
  assistant message is appended when the stream finishes.
- **A partial assistant message is persisted when a stream errors or aborts.** The log-food
  tool commits to the food log mid-stream. Without this, a failure after the tool call but
  before the stream completes leaves the rings showing a meal that no message in history
  explains.
- The two writes are deliberately **not** wrapped in a shared transaction. The tool call
  and the stream's completion can be a long way apart in wall-clock time; that is not a
  transaction boundary, it is a lock.
- The day a message belongs to is decided at write time from the server's current day.

### Label photos

Attachments arrive as base64 data URLs — a phone photo is roughly four megabytes of string
inside the message. Storing that would bloat every rewrite of the day's row and, worse,
ship megabytes of base64 to the browser every time the day is opened.

- **Image bytes are not persisted.** The file part is stored as a marker carrying its media
  type and a sentinel URL that the renderer recognises, so a replayed conversation shows a
  placeholder tile where a photo was.
- **File parts are dropped entirely before conversion to model messages.** A marker with a
  non-resolvable URL would either break conversion or have the model reasoning about an
  image it cannot see.
- **Consequence accepted:** after a reload, the contents of a label survive only in the
  agent's written summary of it. The agent already replies with that summary today, and the
  committed entry carries the numbers, so the durable record is intact.

### Routing and page composition

- The root route is today. A dated route segment serves a past day. Both are
  server-rendered; there is no client fetch layer and no loading state, because the server
  knows the date at request time.
- A malformed date is a 404. A future date redirects to today. A valid past date with
  nothing behind it renders an empty read-only day — the daily summary already reports a
  day as untracked, which is exactly this case.
- The route component calls a single read function (see Testing Decisions) and passes what
  it returns down. No component computes the current day, and no component decides on its
  own whether it is read-only.

### Read-only past days

- Read-only is derived once, on the server, from the viewed date against the server's
  current day, and threaded down as a flag.
- The composer is not rendered. The delete control on logged-entry cards is not rendered.
- The conversation's empty state changes copy by read-only state: today keeps its current
  invitation to log something; a past day reads as a statement that there was no
  conversation, with no call to action.
- **The date-scoped delete in the food log module remains the actual enforcement.** The
  hidden UI is a courtesy, not a security boundary, and the existing constraint is not
  relaxed.

### Header

- The macro header shows the **viewed** day's totals, not today's. Showing current progress
  above a past conversation would be actively misleading.
- The header names the date (`YYYY-MM-DD log`) **only when the viewed day is not today**.
  Today needs no label; the rings are the default reading.
- This label is not redundant with the sidebar. The sidebar is off-canvas on mobile, which
  is the app's primary device — without the header label, a phone showing a past day would
  present unfamiliar numbers and a missing composer with nothing on screen explaining
  either.

### Sidebar

- Built from the shadcn sidebar component — off-canvas with a trigger on mobile, fixed on
  desktop. It is not currently installed and must be added. Per the project's component
  sourcing order, this is preferred to hand-rolling a drawer.
- **Lists days that have food entries**, with today always pinned regardless of whether
  anything has been logged yet.
- **Known consequence, accepted:** a past day with a conversation but no logged entries is
  not reachable from the sidebar. A day where nothing was logged is not a day worth
  listing, and there is no existing data in that state.
- No pagination, virtualisation, or cap. A single user accrues on the order of 365 rows a
  year; a virtualised list is not worth building.
- Navigating away mid-stream aborts the stream. There is no stream resumption.

### Model context

- The full persisted day is sent to the model. Display-only persistence would leave the
  user reading a coherent thread while the model had amnesia about it — "delete the yogurt
  I mentioned earlier" would fail against messages plainly on screen.
- **This makes an existing comment in the daily-summary module false.** It currently
  justifies the summary-then-delete flow on the grounds that the conversation is
  disposable. The flow is still correct — the agent still needs the summary to learn entry
  ids — but the stated reason has changed, and the comment must be updated in this change.
- The agent's existing ability to answer about past days from the food log is **retained
  unchanged**. Navigation and asking are different affordances: a user knows "last
  Tuesday" long before they know which date that was.

## Testing Decisions

A good test here drives external behaviour and asserts on what a user or a caller would
observe. It does not assert on table layouts, JSON shapes at rest, or which internal
function was called. The existing suite already works this way — the food-log tests drive
the agent's tools against a temporary database and assert on returned summaries, and the
component tests drive rendered output rather than props.

**Prefer the fewest seams.** The read path gets exactly one.

### Seam 1 — the day read (new)

A single function taking a date, a timezone and a database path, returning everything a
day's page needs: the date, whether it is today, whether it was tracked, the totals, the
logged entries, the conversation's messages, and the list of dates for the sidebar.

This is the sole read seam for the feature. Tests drive it against a temporary database and
cover: a day with entries and a conversation; a day with entries and no conversation; a
date with nothing behind it; today appearing in the date list before anything is logged;
the date list ordered newest first; and the today/past determination against a supplied
timezone.

It composes the existing daily-summary function rather than replacing it. **The daily
summary keeps its current shape and must not gain messages** — the agent's summary tool
reads through it, and the agent has no business receiving raw conversation state through
that path.

### Seam 2 — the conversation write (new)

A function that upserts a day's conversation. Tests cover: round-tripping a day; upserting
the same day twice, replacing rather than duplicating; image parts reduced to markers with
their media type preserved; and a day with no conversation reading back as empty rather
than erroring.

### Existing seams, reused

- **The date function.** Unit tests in the existing local-date test file, asserting the
  same instant resolves to different dates under different supplied timezones, and that a
  daylight-saving boundary does not shift the day. This is what makes passing the timezone
  as an argument pay for itself.
- **Component tests.** Following the existing entry-card and macro-ring pattern: a
  read-only day renders no composer and no delete controls; a past day's empty state shows
  the statement rather than the invitation; the header shows a date label on a past day and
  none on today.
- **End-to-end.** One Playwright spec against the temporary database the existing global
  setup already provisions: send a message, reload, assert it is still there. That single
  assertion is the whole feature. A second, thinner spec covers navigating to a past day
  and finding no composer.

Deliberately **not** covered end-to-end: the sidebar's contents, which the seam-1 tests
already establish, and the model-context change, which no assertion can pin down cheaply.

## Out of Scope

- **Authentication and multi-user support.** Single user, one database.
- **Real-time sync.** No polling, no server-sent events, no websockets. A reload is the
  sync mechanism. Two devices are reconciled when the second one loads.
- **A user-configurable timezone.** The constant is threaded as an argument so this becomes
  easy later, but no setting, no UI, and no persistence for it is built now.
- **Storing or serving label photos.** Deliberately excluded; see the decision above. If
  photos in history are wanted later, the marker is where a real URL would go.
- **Editing, renaming, deleting, or exporting a conversation.**
- **Search across conversations.**
- **Writing to a past day by any means.**
- **Stream resumption** after navigation, reload, or connection loss.
- **Sidebar pagination or virtualisation.**
- **Client-side midnight rollover.** A tab open across midnight shows a stale header until
  it is touched.
- **Transactional coupling** between the food log write and the conversation write.

## Further Notes

**This is not a small diff, and the reason is worth stating.** The feature as literally
described — persist messages, list them in a sidebar — is additive. But server-rendering a
dated page requires knowing the date at request time, which the app previously learned from
a cookie the browser wrote after first paint. Every attempt to keep that mechanism produced
a worse design: a skeleton state on first visit, or a wrong day rendered and then swapped.
Replacing it with a server-derived date is what keeps the rest coherent, and it deletes
more code than it adds.

**Staging.** Two commits are recommended purely for reviewability — first the date change
and the deletions it enables, then the conversation persistence built on top. The end state
is identical either way.

**A pre-existing weakness this change happens to close.** The chat route previously trusted
a client-supplied date, so a crafted request could write a food entry into a past day. It
was tolerable in a single-user local app and was never in scope to fix. Removing the field
closes it as a side effect.

**Vocabulary.** This repo has no domain glossary file, so the terms used here follow the
existing code and comments: *food log*, *entry*, *daily summary*, *totals*, *rings*,
*conversation*, *tracked* / *untracked day*. If a glossary is written later, "conversation"
for a day's chat and "tracked day" for a day with entries are the two terms this feature
adds weight to.
