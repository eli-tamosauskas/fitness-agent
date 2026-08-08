# Log a packaged food from its nutrition label photo

Status: ready-for-agent

## Parent

`.scratch/nutrition-tracker/spec.md`

## What to build

The user photographs a product's nutrition label, states in plain language how much they ate, and the entry is committed — no retyping numbers that are already printed on the packet, and no serving-size picker.

The chat input gains an image attachment. Use a capture-capable file input so a phone offers the camera directly; desktop is the target for the MVP but this costs nothing. The image is attached to the user's message and is therefore **already in the model's context** — there is no separate vision-extraction tool. A second vision call to re-read the same image would be pure latency. Schema discipline lives in the logging tool's input validation, which applies regardless of how the numbers were derived.

The system prompt gains the instruction to read per-serving figures directly off an attached label image.

The stated amount can be either a count of servings ("1.5 servings") or a weight in grams ("200g"), and the arithmetic from label-per-serving to actual-consumed is done for the user — they never make a multiplication error at the point of logging. For a labelled product the stored base is per one serving; the `g` unit scales a per-100g base. The entry is stored with source `label` and its base nutrients, exactly as slice 02 established — the multiplication happens on read.

If the label photo is unreadable, that is reported back in chat so the user retakes it instead of assuming it was logged.

## Acceptance criteria

- [ ] An image can be attached to a chat message from a capture-capable file input
- [ ] A label photo plus "1.5 servings" commits an entry whose contribution to today's totals is the label's per-serving figures times 1.5
- [ ] A quantity given in grams correctly scales a per-100g base
- [ ] Entries from the label path are stored with source `label` and base nutrients, not pre-multiplied totals
- [ ] Both unit paths are covered by tests at the tool seam
- [ ] An unreadable label photo produces a message in chat rather than a silent drop or a fabricated entry
- [ ] `npm run check` passes

## Blocked by

- `02-log-stated-macros.md`
