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

- [x] A helper provisions and tears down a temporary SQLite database file per test
- [x] Logging a stated-macro entry via the tool makes it appear in the same day's summary totals
- [x] A day with no entries summarizes as zeros rather than erroring
- [x] An entry logged for one date does not appear in another date's summary
- [x] Invalid tool input — negative quantity, unknown unit, missing nutrient — is rejected by validation rather than written
- [x] Stating macros in chat commits the entry in one message, with no confirmation step
- [x] The rings reflect the new totals once the stream completes, without a manual page reload
- [x] Totals survive a page reload and a browser restart
- [x] An entry logged at 9pm local time lands on today, not tomorrow
- [x] A working indicator is visible while the assistant is responding
- [x] The SQLite file is gitignored
- [x] `npm run check` passes

## Blocked by

- `01-macro-header-rings.md`

## Comments

**Implemented.** The tracer bullet runs end to end: a stated-macro message commits an
entry and the rings move without a reload, verified live against the Gateway.

Two decisions worth recording:

- **Reading a day vs. writing one.** Writes never touch a clock: the day comes only from
  the `today` field on the chat request, which the browser computes. The *read* path
  needs a day before any request has been made, so the browser also parks its local date
  in a `local-date` cookie and the page reads that. On the very first visit, before the
  cookie exists, the page falls back to the host's date — the log is empty then anyway,
  and the client refreshes the moment it finds a mismatch.
- **`node:sqlite` works.** No `better-sqlite3` fallback was needed; it resolves inside
  both the route handler and the server component under Turbopack, in dev and in a
  production build. It emits an experimental warning on every process start.

The chat UI came from the `ai-elements` registry (conversation, message, prompt-input),
which pulled in ten shadcn primitives and `streamdown`. Heavier than this slice needs,
but it is the project's stated sourcing order and slice 03 wants the attachment support.
Four type errors in the vendored `prompt-input.tsx` were fixed against the installed
`@base-ui/react`.
