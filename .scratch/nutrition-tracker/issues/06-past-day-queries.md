# Ask about a past day

Status: ready-for-agent

## Parent

`.scratch/nutrition-tracker/spec.md`

## What to build

The user asks "show me data from the 13th of May" and gets that day's totals back in conversation, along with the itemized list of what they ate so they can see which foods drove the numbers.

Past dates are **read-only**, **single days only**, no ranges. Writes remain today-only.

Relative expressions — "yesterday", "last Tuesday" — must work, so the user never has to work out a calendar date. The model resolves the relative expression to an ISO date before calling the summary tool, using today's date from the system prompt, and **echoes the resolved date in its answer** so a misinterpretation is catchable.

A date with no entries gets a sensible answer — zeros, reported as an untracked day — not an error and not something that reads like a failure.

## Acceptance criteria

- [ ] Asking about an explicit past date returns that day's four totals in conversation
- [ ] Asking what was eaten on a past date returns the itemized entries
- [ ] Relative expressions like "yesterday" and "last Tuesday" resolve to the right date
- [ ] The resolved ISO date is echoed in the answer
- [ ] A date with no entries answers as zeros for an untracked day, with no error
- [ ] Asking about a past date does not write anything and cannot back-date an entry
- [ ] `npm run check` passes

## Blocked by

- `02-log-stated-macros.md`
