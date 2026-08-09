# Server-derived date replaces the browser-date cookie

Status: ready-for-agent

## Parent

`.scratch/chat-history/spec.md`

## What to build

Today stops being something the browser reports and becomes something the server
derives. A `today(timeZone)` function returns the ISO date for a supplied timezone; the
timezone lives beside it as a constant (`Europe/Vilnius`) and is **passed as an argument**
rather than read from module scope, so a per-user setting later becomes "change where the
constant is supplied" and tests can assert across timezones without mocking the clock.

Compute it with `Intl.DateTimeFormat("en-CA", { timeZone })`, which emits `YYYY-MM-DD`
directly. **Never a fixed UTC offset** — Vilnius observes daylight saving, and an offset
constant would place the app on the wrong day for an hour twice a year.

Everything that made the browser the authority is **deleted in this change, not left
dormant**: the local-date cookie and its constant, the server-side function that read it,
the client-side "today" helper, the `today` field on the chat request schema, the
`body: { today }` passed to `sendMessage`, and the client-side midnight-rollover effect.
Two competing sources of truth for the current day — one of them dead — is worse than
either alone. The page, the delete server function, and the chat route all read the
server's day instead.

Nothing changes for the user. The app renders the same day it rendered before, without
the first-paint guess.

**Consequence accepted:** a tab left open across midnight shows the previous day's header
until the user navigates or reloads. Nothing is mis-recorded — the server stamps each
message and each food entry with its own current day — only the display lags. A
client-side clock is exactly the complexity this change exists to remove.

**Consequence gained:** the client can no longer name the day, so a crafted request can no
longer write a food entry into a past day. The previous design trusted a client-supplied
date. This was tolerable in a single-user local app and was never in scope to fix; it
closes as a side effect.

## Acceptance criteria

- [x] A `today(timeZone)` function returns the ISO date for the supplied timezone, and the timezone constant is passed to it rather than read from module scope
- [x] Unit tests in the existing local-date test file assert that the same instant resolves to different dates under different supplied timezones, and that a daylight-saving boundary does not shift the day
- [x] The local-date cookie, its constant, the server-side reader, and the client-side "today" helper no longer exist anywhere in the codebase
- [x] The chat request schema has no `today` field, and the client sends no date with a message
- [x] The client-side midnight-rollover effect no longer exists
- [x] The page's rings, the delete server function, and the chat route's system prompt and tools all take the day from the server-derived date
- [x] A request crafted to name a past day cannot write a food entry into it
- [x] The existing test suite and Playwright specs pass unchanged

## Blocked by

None - can start immediately
