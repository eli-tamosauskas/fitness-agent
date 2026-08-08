# Nutrition Tracker

Status: ready-for-agent

## Problem Statement

I want to hit daily calorie and macro targets, but logging food is the part that makes me stop. Existing trackers make me search a database, scroll a list of near-identical entries, tap through a serving-size picker, and repeat that for every item. The friction is high enough that I abandon it within a week.

Most of what I eat has a nutrition label printed on the packet — the data is right there in my hand, and I am retyping it. The rest is whole food with no label at all ("a kiwi"), where I don't know the numbers and don't want to go find them. And I have no fast way to answer "how did I actually do on the 13th?"

## Solution

A single-page personal tracker. Four hardcoded daily targets — calories, protein, carbs, fat — sit across the top as progress rings showing consumed against target. Everything else is a chat.

To log a packaged food, I photograph its nutrition label and say how much I ate. To log a whole food, I just say "I ate a kiwi" and it is looked up against USDA FoodData Central. Either way the entry is committed to today's log immediately, appears as a card in the chat, and the rings move. If it's wrong, I dismiss the card or say "delete that."

I can also ask about any past day and get its totals and items back in conversation.

Single user, local, no accounts.

## User Stories

1. As the user, I want four daily targets displayed across the top of the page, so that I always know what I'm aiming at without navigating anywhere.
2. As the user, I want each target rendered as a progress ring with the raw numbers beside it, so that I can read my position at a glance and still see the exact figures.
3. As the user, I want all four stats visible side by side without wrapping or horizontal scrolling, so that one look tells me the whole picture.
4. As the user, I want the rings to reflect only today's consumption, so that the top of the page always answers "where am I right now."
5. As the user, I want to photograph a product's nutrition label, so that I don't have to retype numbers that are already printed in front of me.
6. As the user, I want to state the serving I consumed in plain language alongside the photo, so that I don't have to operate a serving-size picker.
7. As the user, I want to express the amount as a count of servings ("1.5 servings"), so that I can use the label's own unit.
8. As the user, I want to express the amount as a weight in grams ("200g"), so that I can log foods I weighed rather than counted.
9. As the user, I want the arithmetic from label-per-serving to actual-consumed done for me, so that I never make a multiplication error at the point of logging.
10. As the user, I want to name an unlabeled whole food ("I ate a kiwi"), so that I can log fruit and vegetables that have no packet.
11. As the user, I want unlabeled foods looked up against USDA FoodData Central, so that the numbers come from a real reference rather than a guess.
12. As the user, I want to be told which USDA food was matched, so that I can spot when it matched the wrong thing.
13. As the user, I want to state macros directly ("that was 400 cal, 30g protein, 40g carbs, 12g fat"), so that I can log a restaurant meal or a recipe I already calculated.
14. As the user, I want the entry committed immediately without a confirmation step, so that logging a food is one message and not two.
15. As the user, I want each committed entry shown as a card in the chat with its resolved macros, so that I can verify what was recorded without asking.
16. As the user, I want the rings to update as soon as an entry is committed, so that I see the effect of what I just ate.
17. As the user, I want to dismiss an entry directly from its card, so that correcting an obvious misread takes one click.
18. As the user, I want to delete an entry by describing it in chat ("delete the yogurt"), so that I can correct a mistake I notice later in the session.
19. As the user, I want to correct a wrong amount by deleting and re-logging, so that I have a working path to fix an entry without a dedicated edit flow.
20. As the user, I want my food log to survive a page reload and a browser restart, so that the day's record is not lost to a stray refresh.
21. As the user, I want the day boundary to follow my own local time, so that a 9pm snack lands on today and not tomorrow.
22. As the user, I want to ask what a past date's totals were ("show me data from the 13th of May"), so that I can review a day I've forgotten.
23. As the user, I want to refer to past dates in natural language ("yesterday", "last Tuesday"), so that I don't have to work out a calendar date.
24. As the user, I want the resolved date echoed back in the answer, so that I can catch a misinterpreted relative date.
25. As the user, I want to ask what I actually ate on a past date and get the itemized list, so that I can see which foods drove the numbers.
26. As the user, I want a sensible answer for a date with no entries, so that asking about an untracked day doesn't look like a failure.
27. As the user, I want to see clearly when I have gone over a target, so that an overage is not disguised as a completed ring.
28. As the user, I want the ring to stop at full rather than wrap around when I exceed a target, so that the visualization stays readable.
29. As the user, I want the raw consumed-over-target figure shown even when over, so that I know by how much.
30. As the user, I want to see that the assistant is working while it reads a label or performs a lookup, so that I don't send the message twice.
31. As the user, I want a failed USDA lookup reported in chat rather than silently dropped, so that I know to log the item another way.
32. As the user, I want an unreadable label photo reported back to me, so that I can retake it instead of assuming it was logged.
33. As the user, I want to log several foods across a session and see the rings accumulate, so that the tracker reflects a whole day and not just the last thing.
34. As the user, I want the log to be the durable artifact rather than the conversation, so that clearing the chat costs me nothing.
35. As the user, I want the app to run locally against my own API keys with no account or login, so that my food data stays on my machine.

## Implementation Decisions

### Architecture

- **Next.js App Router, single page.** The page is a server component that reads today's entries, aggregates them, and renders the macro header plus the chat client component. There is one source of truth for the totals: the server. After a stream finishes in which a write tool ran, the client triggers a router refresh and the server re-derives the totals. No optimistic client-side total state.
- **AI SDK v7** drives the chat via a streaming route handler. The user's stated requirement for "a skill" is realized as **AI SDK tools**, not as Claude Agent SDK skill files.
- **Model:** `anthropic/claude-sonnet-5` through the Vercel AI Gateway, one model for every call including vision. Confirmed present in the live Gateway model list.
- The label image is attached to the user's message and is therefore **already in the model's context**. There is no separate vision-extraction tool; a second vision call to re-read the same image would be pure latency. Schema discipline lives in the logging tool's input validation, which applies regardless of how the numbers were derived.

### Environment

- The Gateway key must be exposed as `AI_GATEWAY_API_KEY`. The repo currently has it under `VERCEL_GATEWAY_API`, which the SDK will not read — this needs renaming.
- A FoodData Central API key is required as `FDC_API_KEY`, obtained from the free instant-issue `api.data.gov` signup.

### Persistence

- **SQLite**, one file, gitignored. Preference is Node's built-in `node:sqlite` — zero dependencies, available on the installed Node 22.14, emits an experimental warning. If the Next bundler cannot resolve it inside a route handler, fall back to `better-sqlite3` registered as an external server package.
- One table of food entries. Each row carries: the local date it belongs to as a `YYYY-MM-DD` string, a human description, the input path it came from (`label` / `usda` / `stated`), the quantity consumed, the unit of that quantity (`serving` or `g`), and the four **base** nutrients.
- **Base nutrients are stored, never pre-multiplied totals.** For a labelled product the base is per one serving; for a USDA food the base is per 100g. Totals are derived on read. This keeps the arithmetic in TypeScript where it is deterministic and testable, and preserves the source data so a wrong quantity can be reasoned about after the fact.
- Indexed on the date column.

### Date handling

- The browser computes the local `YYYY-MM-DD` and sends it with each chat request. The server **never** calls the system clock to decide what day it is. This is what makes the day boundary follow the user's timezone rather than the host's.
- Writes are **today-only**. There is no back-dating and no editing of past data.
- Past dates are **read-only**, single days only, no ranges. The model resolves relative expressions to an ISO date before calling the summary tool, and the resolved date is echoed in its answer.

### Tools exposed to the agent

- **Log food entry** — takes description, source, quantity, unit, and the four base nutrients. Zod-validated input. Writes to today. Returns the created entry including its id.
- **Look up USDA food** — takes a free-text query, searches FoodData Central restricted to the Foundation and SR Legacy data types, takes the top hit, maps the standard nutrient identifiers to per-100g calories/protein/carbs/fat, and returns those along with the matched food's name so a bad match is visible to the user.
- **Get daily summary** — takes an ISO date, returns the four totals **and** the itemized entries with their ids. Returning ids is what makes chat-driven deletion work.
- **Delete food entry** — takes an id.

The agent's system prompt supplies today's date, the four targets, the instruction to resolve relative dates before querying, and the instruction to read per-serving figures directly off an attached label image.

Because chat history is ephemeral, "delete the yogurt" after a reload resolves as summary-then-delete: the agent reads today's entries to obtain ids, then deletes. This is why no persistent entry-list UI is needed for the MVP.

### Targets

Four hardcoded constants in a single exported module. Changing them is a code edit. They are not per-day and not user-editable.

### Display

- Four rings in a fixed four-column grid, non-wrapping, non-scrolling.
- No progress-ring primitive exists in the installed component libraries, so the ring is a custom inline SVG: a track circle and an arc circle driven by dash-array/dash-offset.
- The arc is **capped at 100%**. Exceeding a target switches the ring to an "over" color token; the raw consumed-over-target text is shown unchanged.
- UI sourcing order is the project default: reuse existing components, then the shadcn / bundled `ai-elements` registry, then custom.

### Scope of nutrients

Calories, protein, carbs, fat only. Fiber, sugar, sodium and the rest of what labels and FDC provide are discarded on ingest.

## Testing Decisions

**What makes a good test here:** it exercises externally observable behavior — "an entry logged as 1.5 servings contributes 180 calories to today's totals" — and says nothing about how that number was computed or stored. A test that imports a multiplication helper and asserts on it is testing implementation; it will need rewriting the first time the math module is reshaped, and it proves nothing about whether the entry actually reached the right day.

**The seam is the tool layer.** Tests call the agent's tools directly — log, summarize, delete — against a real throwaway SQLite file per test. This is a single seam and the highest one reachable without stubbing a language model. Everything beneath it (the serving arithmetic, the aggregation, the row mapping, the query) is an implementation detail free to change.

Explicitly **not** separate seams: the macro arithmetic module and the database access module are never imported directly by a test.

Coverage at that seam:

- Logging in `serving` units with a fractional quantity produces the expected totals.
- Logging in `g` units correctly scales a per-100g base.
- Multiple entries from different sources aggregate into correct totals.
- A day with no entries summarizes as zeros rather than erroring.
- An entry logged for one date does not appear in another date's summary — the date-filtering guarantee.
- A summary returns entry ids, and deleting by one of those ids removes it from subsequent totals.
- Deleting an id that does not exist behaves predictably.
- Invalid tool input (negative quantity, unknown unit, missing nutrient) is rejected by validation rather than written.

**Prior art:** the repo has one existing Vitest example at the component level (`button`) and one Playwright e2e smoke test. There is no prior art for a data-layer test, so this establishes the pattern: a helper that provisions and tears down a temporary database file per test.

**No automated end-to-end test of the chat flow.** Constructing a fake AI SDK v7 message stream is disproportionate scaffolding for an MVP whose UI is four numbers and a textarea. Instead, a **live manual smoke test** is part of the definition of done, run and reported on:

1. Upload a real nutrition label, state a fractional serving → card appears, rings move, numbers match the label times the quantity.
2. "I ate a kiwi" → USDA lookup, matched food name shown, rings move.
3. Reload → rings still correct, chat cleared.
4. "What did I eat today?" → itemized answer. "Delete the kiwi" → removed, rings drop.
5. Ask about a date with no data → zero report, no error.

The existing home-page e2e test will break when the placeholder page is replaced, and must be updated or removed as part of this work.

## Out of Scope

- Editing or back-dating past entries. Writes are today-only, permanently, by decision.
- Date ranges, weekly trends, charts over time.
- A persistent list of today's entries rendered beneath the rings. Deletion is chat-driven for the MVP.
- User-editable targets, and per-day targets (training vs rest day).
- An update-entry tool. Delete-and-re-log covers the case.
- Persisted chat history. The conversation is disposable; the log is the artifact.
- Fiber, sugar, sodium, micronutrients.
- Mobile layout. Desktop only for the MVP, though the photo input will use a capture-capable file input so a phone offers the camera anyway.
- Authentication, accounts, multi-user, sync, deployment.
- Barcode scanning, recipe building, meal templates, repeat-yesterday.
- Exercise, weight tracking, or anything else the "fitness" in the repo name might imply.

## Further Notes

- The repo has no `CONTEXT.md` and no ADRs, so this PRD introduces no glossary conflicts and contradicts no recorded decision. If the domain terms here settle (_entry_, _base nutrients_, _daily summary_, _target_), they are candidates for a glossary later.
- **Scraping the FoodData Central website was considered and rejected.** The site is a client-rendered SPA, so fetching it returns an empty shell and "browsing" it would mean driving a headless browser per lookup — slower, fragile to markup changes, and returning worse-structured data than the free JSON API of the same dataset. The only real cost of the API is one instant-issue key.
- USDA "top pick" hides genuine ambiguity: a query like "kiwi" returns raw, frozen, Foundation, SR Legacy and branded variants. Restricting to Foundation and SR Legacy and surfacing the matched name is the mitigation; if it proves insufficient in practice, presenting the top few candidates for the user to choose is the natural next step.
- Auto-commit is a deliberate bet that vision reads and USDA matches are right most of the time, and that a visible card plus one-click dismissal is cheaper than confirming every entry. If accuracy turns out worse than expected, adding a confirmation step is a contained change.
- A persistent entry list under the rings is the most likely first addition once this is in daily use.
