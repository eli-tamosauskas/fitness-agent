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

Note anything where the vision read or the USDA top pick was wrong. Auto-commit is a deliberate bet that both are right most of the time and that a visible card plus one-click dismissal is cheaper than confirming every entry — if accuracy turns out worse than expected, adding a confirmation step is a contained change and this is where that evidence gets recorded.

## Acceptance criteria

- [ ] All five steps run against live keys and real inputs
- [ ] Results reported in this issue's comments, step by step, including anything that misread or mismatched
- [ ] Any defect found is filed as its own issue rather than fixed silently here

## Blocked by

- `01-macro-header-rings.md`
- `02-log-stated-macros.md`
- `03-label-photo-logging.md`
- `04-usda-lookup.md`
- `05-entry-cards-and-deletion.md`
- `06-past-day-queries.md`
