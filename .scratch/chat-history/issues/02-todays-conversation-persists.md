# Today's conversation survives a reload

Status: ready-for-agent

## Parent

`.scratch/chat-history/spec.md`

## What to build

The conversation stops evaporating. Each calendar day gets one conversation, stored on the
server and keyed by the date, so a reload — or a second device — picks up where the last
one left off.

Storage is a new table in the existing database file: `chat_days(date TEXT PRIMARY KEY,
messages_json TEXT NOT NULL)`, upserted whole. **One row per day, not one row per
message** — a day's conversation is always read whole and written whole, and per-message
rows would buy ordering columns and pagination that nothing would use. **Same database
file, separate module**: the domain separation is real and is achieved by a distinct
module with its own functions, not by a second file, which would mean duplicating the path
helper, the connection cache, the environment variable and the reset story. There are no
foreign keys between this table and the food log table; they are neighbours, not entangled.
The database path environment variable keeps its current name — the file holds a food log
and conversations about that food log, and a vaguer name would not be a truer one.

The API route owns persistence. The incoming user message is appended on arrival; the
assistant message is appended when the stream finishes. **A partial assistant message is
persisted when a stream errors or aborts** — the log-food tool commits to the food log
mid-stream, so without this a failure after the tool call but before the stream completes
leaves the rings showing a meal that no message in history explains. The two writes are
deliberately **not** wrapped in a shared transaction: the tool call and the stream's
completion can be a long way apart in wall-clock time, and that is not a transaction
boundary, it is a lock. The day a message belongs to is decided at write time from the
server's current day, so an entry logged at 00:05 lands on the new day.

The page reads the day's conversation and hands it to the chat as its initial messages.
**The full persisted day is sent to the model**, not just displayed — display-only
persistence would leave the user reading a coherent thread while the model had amnesia
about it, and "delete the yogurt I mentioned earlier" would fail against messages plainly
on screen.

This makes an existing comment in the daily-summary module false: it currently justifies
the summary-then-delete flow on the grounds that the conversation is disposable. The flow
is still correct — the agent still needs the summary to learn entry ids — but the stated
reason has changed, and **the comment must be updated in this change**.

File parts are out of scope here; they are handled in `03-label-photo-markers.md`.

## Acceptance criteria

- [x] A conversation-store module, separate from the food log module, exposes a function that upserts a day's conversation and a function that reads one back
- [x] Tests cover: round-tripping a day; upserting the same day twice replacing rather than duplicating; and a day with no conversation reading back as empty rather than erroring
- [x] The user's message is persisted on arrival at the chat route, before the model is called
- [x] The assistant's message is persisted when the stream finishes
- [x] A stream that errors or aborts persists the partial assistant message, so a mid-stream `logFoodEntry` is never left with rings that no message explains
- [x] The two writes are not wrapped in a shared transaction
- [x] The day a message is written to comes from the server's current day at write time
- [x] The page renders the day's persisted conversation as the chat's initial messages
- [x] The persisted conversation is sent to the model, so the agent can act on something the user said earlier the same day
- [x] The daily-summary function keeps its current shape and does **not** gain messages
- [x] The false "the conversation is disposable" comment in the daily-summary module is corrected
- [x] A Playwright spec against the existing temporary-database global setup sends a message, reloads, and asserts it is still there

## Blocked by

- `01-server-derived-date.md`
