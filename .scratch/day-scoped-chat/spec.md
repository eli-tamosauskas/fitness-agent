# Day-scoped chat history

Status: ready-for-agent

## Problem Statement

The food log survives everything. The conversation survives nothing.

A user logs a burrito at noon, closes the tab, and comes back at six. The rings still show the burrito — the entries are in SQLite and the totals are derived on the server on every render. But the chat is empty, as though the day never happened. The messages only ever lived in React state, so a reload, a phone lock, a browser tab eviction, or an accidental back-navigation throws away the record of what was said.

That costs the user three things:

- **The record.** What did I tell it this morning? Which entries came from a photo and which I typed? Whether the model matched "kiwi" to the right USDA food is stated in its reply, and that reply is gone.
- **The controls.** Every logged entry comes back as a card with a one-click delete. Those cards vanish with the conversation, so the only way to remove something after a reload is to describe it in words and hope the model finds it.
- **The thread.** Mid-conversation context — "make that two servings", "the one I just logged" — resets to nothing, silently, at a moment the user didn't choose.

Meanwhile the reset the user *does* want has never existed. Yesterday's conversation has no business being on screen this morning; a day is the unit this whole app is built around, and the chat is the only thing that doesn't know it.

## Solution

The conversation becomes a day-scoped record, governed by exactly the rule the food log already obeys: **the browser's stated day is the only day authority.**

Today's messages persist server-side and are read back on first paint. Reload, close the laptop, come back on the phone — the day's conversation is there, entry cards and all. When the day turns, the slate is clean: a new day opens on an empty conversation, and a tab left open past midnight resets itself when the user returns to it.

Past days accumulate in the database and are simply never loaded. Nothing reads them yet — but nothing throws them away either.

## User Stories

1. As a user who reloads the page, I want today's conversation still on screen, so that I don't lose the record of what I logged.
2. As a user returning hours later, I want the whole of today's conversation, not just the last exchange, so that the transcript is the day's record rather than the session's.
3. As a user who logs food from my phone and reviews it on my laptop, I want the same conversation in both places, so that the record follows me rather than the device.
4. As a user whose phone evicted the browser tab, I want nothing lost, so that I don't have to think about how browsers manage memory.
5. As a user opening the app in the morning, I want yesterday's conversation gone, so that today starts clean and I'm not scrolling past food I ate a day ago.
6. As a user who left a tab open overnight, I want it to reset when I come back to it, so that I don't accidentally read yesterday's chat as today's.
7. As a user who left a tab open overnight, I want the rings and the conversation to reset together, so that the screen is internally consistent rather than showing today's totals under yesterday's messages.
8. As a user, I want a message sent at 23:59 to stay attached to the reply that came back at 00:00, so that I never see half a conversation stranded at the top of a new day.
9. As a user in a timezone far from the server's, I want my day to be my day, so that my conversation turns over at my midnight and not someone else's.
10. As a user on my very first visit, I want an empty conversation with the prompt to log something, so that nothing looks broken before I've said anything.
11. As a user with a day's conversation already stored, I want it rendered on first paint, so that I don't see an empty chat flash and then fill in.
12. As a user reviewing today's conversation after a reload, I want the entry cards still there, so that I can delete something with one click instead of describing it in words.
13. As a user, I want a card for an entry I already deleted to stay in the transcript, so that the conversation remains an accurate record of what I said at the time.
14. As a user, I want the rings to remain the single source of truth for what I've actually eaten, so that a stale card in the transcript never misleads me about my totals.
15. As a user who attached a nutrition label photo, I want to see that photo in the conversation after a reload, so that I can tell which packet an entry came from.
16. As a user who photographs several labels a day, I want those photos not to slow the page down, so that a heavy logging day is as fast as a light one.
17. As a user, I want the model to keep answering quickly and cheaply as the day's conversation grows, so that logging dinner isn't slower than logging breakfast.
18. As a user, I want the numbers read off a label to be captured in the food log at log time, so that the photo never needs re-reading and my later questions stay fast.
19. As a user whose reply failed halfway, I want to see my own message still in the transcript, so that I know what I asked and can ask again.
20. As a user whose connection dropped mid-reply, I want anything already logged to still be in the food log, so that a broken stream never silently loses an entry.
21. As a user who closes the tab while a reply is streaming, I want the finished reply saved anyway, so that the record doesn't depend on my keeping the page open.
22. As a user, I want a retried or duplicated request not to double up messages in my transcript, so that the record reads the way the conversation actually went.
23. As a user asking about a past day, I want the answer to still come from the food log's daily summary, so that the read-only history behaves exactly as it does today.
24. As a user, I want past days' conversations kept rather than deleted, so that a future feature can show me what I said on a day I'm looking back at.
25. As a user, I want clearing or losing chat history to never touch my food entries, so that the two records stay independent.
26. As a user, I want my label photos stored alongside my food log and out of source control, so that private photos of my kitchen aren't one `git add` from being committed.
27. As a developer, I want the day rule stated once and obeyed by both entries and transcripts, so that a future change can't quietly desynchronise them.
28. As a developer, I want shared database infrastructure not to live inside the nutrition module, so that a second domain doesn't import the food log to get a connection.
29. As a developer, I want the chat turn testable without the network, so that persistence behaviour is covered by fast tests rather than by hand.
30. As a developer, I want e2e runs to write to a throwaway database, so that a test run never lands in the real food log or the real transcript.

## Implementation Decisions

### Day authority

The browser's stated day decides which day a message belongs to — the same premise `browserDate` is built on, extended to transcripts. The chat request already carries `today`; both the user message and the assistant reply of a turn are filed under it.

This means a turn straddling midnight is filed whole, on the day it was asked. The alternative — filing the reply on the clock's day — was rejected because the server cannot know the user's day without consulting its own clock, which is wrong for any user not in the server's timezone, and because it would strand an orphan reply at the top of an otherwise-empty new day.

### Persistence: one row per message

A new transcript store, one row per message, mirroring the shape of the food log:

- Autoincrement integer primary key, used for ordering on read (the same trick the entries query uses).
- `date` — the local day, indexed, the only thing the read path filters on.
- `message_id` — the client-generated message id, with a unique index on `(date, message_id)`.
- `role`.
- `parts` — the UI message's parts, serialised as JSON. The part shape is the AI SDK's business, not the schema's; the store does not model it.

The unique index on `(date, message_id)` is what makes writes idempotent. It matters because the client re-sends the entire day's messages on every turn and the route writes on arrival — a retry or a duplicated request would otherwise double the transcript.

Reads are `WHERE date = ?`, ordered by primary key. Past days are never read.

### Write path: the chat turn owns it

The chat route persists, not the client. The route is the only place that sees both the authoritative `today` and the completed assistant message, and it writes even if the user closes the tab mid-reply. A client-side write after `onFinish` would be a network round trip that can fail silently and leave the record behind the screen.

Within a turn:

- The incoming user message is persisted **on arrival**, before the model is called.
- The assistant message is persisted **on finish**.

A stream that dies leaves an unanswered question in the transcript. That is deliberate: it is an honest record, it matches whatever the food log shows for the same moment, and the user can simply ask again.

### The persisted user message is a transform, not a copy

A label photo arrives as a data URL inside a file part. The route:

1. Writes the bytes to the attachments directory under the data directory.
2. Persists a user message whose file part references the stored attachment by URL.
3. Sends the model the message as it arrived, data URL intact.

So the persisted message is deliberately not byte-identical to the one received. This is the only arrangement in which the database stays small and the model still sees the photo on the turn where it matters.

Attachments are served by a route handler reading from the data directory. They are not placed under the statically-served public directory: that is source-controlled space, and user photos must not end up there.

Orphaned attachment files — written by a turn that then failed — are left in place. A sweeper is more code than the problem for a single-user app.

### Restored photos are not re-sent to the model

After a reload, a restored file part references a URL the model provider cannot fetch. That is accepted rather than fixed. The numbers were extracted at log time and live in the food entry; the model has no reason to re-read the label, and re-sending full-size photos on every subsequent turn of the day would be the single most expensive thing the app does.

The consequence is stated plainly: within one sitting the model sees the image on later turns, and after a reload it does not. This is the one deliberate carve-out from "send the whole day's messages to the model."

### Hydration and rollover

The page reads today's transcript on the server and seeds the chat with it, so the day's conversation is present on first paint with no empty flash.

The existing effect that compares the browser's day against the rendered day already detects rollover and refreshes to fix the rings. It gains one more responsibility: clearing the conversation. One rule — whenever the day is noticed to have changed, everything on screen re-derives.

No midnight timer. A tab nobody is looking at does not need to reset while nobody is looking at it.

The chat's initial messages are read once at construction, so a refresh updates the rings but not the conversation. That is correct for the sending tab and accepted for a second tab, which will not see messages sent elsewhere until a full reload. Reconciling a server transcript against a mid-stream client one is exactly the merge that produces duplicated or vanishing messages, and it would fight the streaming state on every logged entry.

### Restored entry cards are transcript, not live state

A card restored from earlier today may reference an entry since deleted. The card stays, and its delete button no-ops (the delete already tolerates a missing row). The conversation is a record of what was said — it is *true* that the entry was logged at the time. The rings remain the only live truth, and they are server-derived on every render.

### Module boundaries

- Database infrastructure — open, close, default path — lifts out of the nutrition module to a shared location. Nothing in it knows about food, and the moment a second domain imports it from `nutrition/`, the dependency reads backwards.
- A new chat module owns the transcript store and the chat turn.
- The chat route's work is extracted into a callable turn function taking the messages, the day, the model, and the data paths. The route handler becomes a thin adapter that parses the request and calls it. This is what makes the behaviour testable.

### Renaming

The database path environment variable is renamed from its nutrition-specific name, since the file now holds transcripts too. The default database filename is renamed to match. The existing local database file is moved to the new name as part of the change — it holds real logged entries and must not be orphaned into a silently-recreated empty database.

Touched: the database module, the Playwright config that points the e2e server at a throwaway file, and the e2e global setup that names it.

## Testing Decisions

A good test here asserts on what the user or the next request can observe — what is in the database, what is on disk, what the page shows — and never on how the code got there. It does not reach into the store's internals, does not assert on function call counts, and does not restate the implementation's structure. Tests drive production code through its real entry points, including real schema validation, so that invalid input is rejected in a test exactly as it would be in production.

### One new seam: the chat turn

The seam is the extracted turn function, bound by a harness to a throwaway directory and a mock language model (`MockLanguageModelV4` from the AI SDK's test module). Prior art: the existing tool harness, which wires the real tools to a temporary SQLite file, drives them through their own input schemas, and disposes of the directory afterwards. The transcript harness follows that shape — one database and attachments directory per harness, removed on dispose, so tests never see each other's messages.

This seam was chosen over a store-level harness because every decision worth defending lives in the turn, not in the store: a store-level test would cover insert and select — the parts that were never in doubt — and leave the day filing, the arrival/finish split, the attachment rewrite, and the idempotency untested. The store is covered transitively.

Behaviour to cover at this seam:

- A completed turn persists both messages, under the day the request stated.
- A turn whose stream dies leaves the user message and no assistant message.
- A turn straddling midnight files both messages on the requested day.
- Re-sending a day's messages does not duplicate rows; a repeated message id is a no-op.
- A turn carrying a photo writes the bytes to the attachments directory and persists a part referencing the stored attachment rather than the data URL.
- The model receives the message as it arrived, photo included.
- Reading a day returns its messages in the order they were sent, and returns nothing for a day with no messages.
- Messages are scoped to their day: a day's read never returns another day's messages.
- An assistant message carrying tool output round-trips, so a restored transcript can render its entry cards.

### Existing seams, reused

- **Playwright** — one spec: send a message, reload, the conversation is still there. Prior art: the existing home and label-photo specs. The e2e server continues to write to a throwaway database, removed before each run by global setup.
- **Local-date units** — the same-day comparison behind the midnight clear is logic, and belongs with the existing date tests. Faking the clock in Playwright to watch a two-line effect fire is not worth its cost.

## Out of Scope

- **A manual "clear today's chat" control.** New control, new server action, and an unresolved question about what "clear" means for a day we have decided to keep forever.
- **Reading past days' conversations.** The rows accumulate; nothing loads them. A later feature will.
- **Multi-tab synchronisation.** One user, one tab, is the app's premise — the food log already makes the same bet.
- **A live midnight timer.** Rollover is detected when the user returns, not while they are away.
- **Trimming or windowing what is sent to the model.** The whole day's messages go, with the single carve-out for restored photos.
- **Cleaning up orphaned attachment files.**
- **Editing or deleting individual messages.**
- **Any change to how food entries, daily summaries, USDA lookup, or past-day read-only behaviour work.**

## Further Notes

The durable decision in here — the one a future change is most likely to break without realising — is that **the browser's stated day is the only day authority, for transcripts as for entries.** Everything else is implementation. If a later change starts deriving a day from the server's clock, this feature and the food log both quietly break for anyone outside the server's timezone.

Two smaller notes:

- The "persisted user message is a transform, not a copy" decision is the least obvious thing in this spec. It is what lets the database stay small while the model still sees the photo. Anyone simplifying it towards "just store what arrived" should know they are choosing a database that grows by a full-size phone photo per label, read on every render of that day.
- The carve-out for restored photos means the model's view of a conversation differs before and after a reload. That is intentional and load-bearing, not an inconsistency to iron out.
