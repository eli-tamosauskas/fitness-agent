# Live manual smoke test

Status: ready-for-human

## Parent

`.scratch/nutrition-tracker/spec.md`

## What to build

There is deliberately **no automated end-to-end test of the chat flow** — constructing a fake AI SDK v7 message stream is disproportionate scaffolding for an MVP whose UI is four numbers and a textarea. Instead this live manual smoke test is part of the definition of done for the feature. Run it against real API keys, a real nutrition label photograph and a real USDA lookup, and report the results in the comments of this issue.

Requires a human: it needs a physical product with a nutrition label and a judgement call on whether the vision read and USDA match were actually right.

Steps:

1. Upload a real nutrition label, state a fractional serving → card appears, rings move, numbers match the label times the quantity.
2. "I ate a kiwi" → USDA lookup, matched food name shown, rings move.
3. Reload → rings still correct, chat cleared.
4. "What did I eat today?" → itemized answer. "Delete the kiwi" → removed, rings drop.
5. Ask about a date with no data → zero report, no error.
6. Ask about a day that does have entries, by explicit date ("how did I do on the 13th of May") → that day's four totals, and the itemized entries when asked what was eaten.
7. Ask the same thing relatively ("what did I eat yesterday", "how did I do last Tuesday") → the right day, with the resolved `YYYY-MM-DD` written out in the reply so a misread date is catchable.

Steps 6 and 7 are the only check there is on relative-date resolution and the echoed date: both are model behavior, and there is nothing below the tool seam to test them with. Step 7 needs a day with data behind it — either run it a day after step 1, or log something and come back.

Note anything where the vision read or the USDA top pick was wrong. Auto-commit is a deliberate bet that both are right most of the time and that a visible card plus one-click dismissal is cheaper than confirming every entry — if accuracy turns out worse than expected, adding a confirmation step is a contained change and this is where that evidence gets recorded.

## Acceptance criteria

- [ ] All seven steps run against live keys and real inputs
- [ ] Results reported in this issue's comments, step by step, including anything that misread or mismatched
- [ ] Any defect found is filed as its own issue rather than fixed silently here

## Blocked by

- `01-macro-header-rings.md`
- `02-log-stated-macros.md`
- `03-label-photo-logging.md`
- `04-usda-lookup.md`
- `05-entry-cards-and-deletion.md`
- `06-past-day-queries.md`
