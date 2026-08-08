# Entry cards and deletion

Status: ready-for-agent

## Parent

`.scratch/nutrition-tracker/spec.md`

## What to build

Each committed entry appears as a card in the chat showing its resolved macros, so the user can verify what was recorded without asking. The card is the rendered output of the log tool's result, for every source path — `stated`, `label` and `usda`.

The card carries a dismiss control: correcting an obvious misread is one click. Dismissing deletes the entry and the rings drop accordingly.

Deletion is also available in conversation — "delete the yogurt" — for a mistake noticed later in the session. Because chat history is ephemeral, this resolves as **summary-then-delete**: the agent reads today's entries to obtain their ids, then deletes by id. This is what makes chat-driven deletion work without a persistent entry-list UI, and it is why the *get daily summary* tool must return **the itemized entries with their ids**, not just the four totals.

A *delete food entry* tool takes an id.

Correcting a wrong amount is delete-and-re-log. There is deliberately no update-entry tool.

## Acceptance criteria

- [ ] Every committed entry renders as a card in the chat with its resolved macros
- [ ] The daily summary tool returns itemized entries with their ids alongside the totals
- [ ] Dismissing a card deletes that entry, and the rings drop to match
- [ ] Describing an entry in chat deletes it, resolved via summary-then-delete
- [ ] A test at the tool seam confirms a summary returns ids and that deleting by one of those ids removes it from subsequent totals
- [ ] Deleting an id that does not exist behaves predictably rather than crashing
- [ ] Deleting then re-logging produces the corrected totals
- [ ] `npm run check` passes

## Blocked by

- `02-log-stated-macros.md`
