# Log an entry from stated macros

Status: ready-for-agent

## Parent

`.scratch/nutrition-tracker/spec.md`

## What to build

The tracer bullet through every layer: the user types "that was 400 cal, 30g protein, 40g carbs, 12g fat" into the chat, the entry is committed to today's log with no confirmation step, and the rings move.

This slice establishes:

- **Persistence.** SQLite, one gitignored file. Prefer Node's built-in `node:sqlite` — zero dependencies, available on the installed Node 22.14, emits an experimental warning. If the Next bundler cannot resolve it inside a route handler, fall back to `better-sqlite3` registered as an external server package. One table of food entries, indexed on the date column. Each row carries the local date it belongs to as a `YYYY-MM-DD` string, a human description, the input path it came from (`label` / `usda` / `stated`), the quantity consumed, the unit of that quantity (`serving` or `g`), and the four base nutrients. Only the `stated` path is exercised here; the other two arrive in later slices.
- **Base nutrients are stored, never pre-multiplied totals.** Totals are derived on read. This keeps the arithmetic in TypeScript where it is deterministic and testable and preserves the source data, so a wrong quantity can be reasoned about after the fact.
- **The chat.** An AI SDK v7 streaming route handler, model `anthropic/claude-sonnet-5` through the Vercel AI Gateway (one model for every call, including vision later). `AI_GATEWAY_API_KEY` is already set in `.env.local`. `@ai-sdk/react` is not yet a dependency — add it. The chat client shows a working indicator while the assistant is responding, so the user does not send the message twice.
- **One source of truth for the totals: the server.** The page server component reads today's entries, aggregates them, and renders the macro header plus the chat client. After a stream finishes in which a write tool ran, the client triggers a router refresh and the server re-derives the totals. No optimistic client-side total state.
- **The day boundary follows the user's local time.** The browser computes the local `YYYY-MM-DD` and sends it with each chat request. The server never calls the system clock to decide what day it is. Writes are today-only: no back-dating, ever.
- **Two tools.** *Log food entry* takes description, source, quantity, unit and the four base nutrients, Zod-validated, writes to today, and returns the created entry including its id. *Get daily summary* takes an ISO date and returns the four totals; entry ids and itemization land in slice 05 and 06.

The system prompt supplies today's date and the four targets.

Establish the data-layer test pattern here: there is no prior art for one in this repo. **The seam is the tool layer** — tests call the tools directly against a real throwaway SQLite file provisioned and torn down per test. The macro arithmetic module and the database access module are never imported directly by a test; they are implementation details free to change. A test that imports a multiplication helper and asserts on it proves nothing about whether the entry reached the right day.

## Acceptance criteria

- [ ] A helper provisions and tears down a temporary SQLite database file per test
- [ ] Logging a stated-macro entry via the tool makes it appear in the same day's summary totals
- [ ] A day with no entries summarizes as zeros rather than erroring
- [ ] An entry logged for one date does not appear in another date's summary
- [ ] Invalid tool input — negative quantity, unknown unit, missing nutrient — is rejected by validation rather than written
- [ ] Stating macros in chat commits the entry in one message, with no confirmation step
- [ ] The rings reflect the new totals once the stream completes, without a manual page reload
- [ ] Totals survive a page reload and a browser restart
- [ ] An entry logged at 9pm local time lands on today, not tomorrow
- [ ] A working indicator is visible while the assistant is responding
- [ ] The SQLite file is gitignored
- [ ] `npm run check` passes

## Blocked by

- `01-macro-header-rings.md`
