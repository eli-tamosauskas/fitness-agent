# Ask about a past day

Status: resolved

## Parent

`.scratch/nutrition-tracker/spec.md`

## What to build

The user asks "show me data from the 13th of May" and gets that day's totals back in conversation, along with the itemized list of what they ate so they can see which foods drove the numbers.

Past dates are **read-only**, **single days only**, no ranges. Writes remain today-only.

Relative expressions — "yesterday", "last Tuesday" — must work, so the user never has to work out a calendar date. The model resolves the relative expression to an ISO date before calling the summary tool, using today's date from the system prompt, and **echoes the resolved date in its answer** so a misinterpretation is catchable.

A date with no entries gets a sensible answer — zeros, reported as an untracked day — not an error and not something that reads like a failure.

## Acceptance criteria

- [x] Asking about an explicit past date returns that day's four totals in conversation
- [x] Asking what was eaten on a past date returns the itemized entries
- [x] Relative expressions like "yesterday" and "last Tuesday" resolve to the right date
- [x] The resolved ISO date is echoed in the answer
- [x] A date with no entries answers as zeros for an untracked day, with no error
- [x] Asking about a past date does not write anything and cannot back-date an entry
- [x] `npm run check` passes

## Blocked by

- `02-log-stated-macros.md`

## Comments

Relative-date resolution and echoing the resolved date are model behaviour, so
they are prompt-level rather than test-verified: the system prompt now carries
today's weekday as well as its date ("2026-05-13 (Wednesday)"), without which
"last Tuesday" is a guess. Confirming both is part of the live smoke test
(`07-live-smoke-test.md`).

Everything mechanical is covered at the tool seam: a past day's totals and
items, an untracked day reporting `tracked: false` with zeros, and the fact that
a `date` on a log call is ignored rather than honoured.

Past-day read-only turned out to have a hole beyond back-dating: `deleteFoodEntry`
took an id and would happily remove a row from an earlier day, which an id read
out of a past day's summary made reachable. Deletion is now confined to one day
on every path: the tool deletes only on the day the request carries, and the
card's server action — reachable by POST with any id — only on the day the
browser reported. The cost is a card left open past midnight whose entry now
belongs to yesterday and so no longer deletes, which is the same rule the chat
obeys rather than an exception to it.
