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

- [x] An image can be attached to a chat message from a capture-capable file input
- [x] A label photo plus "1.5 servings" commits an entry whose contribution to today's totals is the label's per-serving figures times 1.5
- [x] A quantity given in grams correctly scales a per-100g base
- [x] Entries from the label path are stored with source `label` and base nutrients, not pre-multiplied totals
- [x] Both unit paths are covered by tests at the tool seam
- [x] An unreadable label photo produces a message in chat rather than a silent drop or a fabricated entry
- [x] `npm run check` passes

## Blocked by

- `02-log-stated-macros.md`

## Comments

**Implemented.** The composer takes a photo, the photo rides along on the user's
message, and the tool layer was already able to store what the model reads off it —
slice 02's `logFoodEntry` needed no change at all for this slice, which is the payoff
of storing base nutrients rather than totals.

Three notes:

- **No vision tool, as decided.** The image is a file part on the user's message, so
  the model already has it. The system prompt gains the instruction to read the panel
  and the rule for picking a column: per-serving for a serving count, per-100g for
  grams. Where the label prints only one of the two, it converts using the serving
  weight the label itself states, and if that is not printed either it asks rather
  than estimating — an estimated serving weight would be an invented base nutrient
  that nothing downstream could detect.
- **Unreadable photos** are handled by instruction only ("never log an entry from a
  label you could not read"); there is no seam below the model at which to test it.
  It remains part of the live smoke test in `07-live-smoke-test.md`.
- **Two vendored-component changes** were needed: a `capture` prop passthrough on
  `PromptInput`'s hidden file input, and a fix to `PromptInputButton`'s tooltip, which
  nested a button inside Base UI's trigger button and threw a hydration error the
  moment a tooltip was used. The latter is committed separately.

Not verified here: the end-to-end read of a real label, which needs a Gateway key and
belongs to the smoke test.
