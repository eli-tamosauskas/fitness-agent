# Log an unlabeled whole food via USDA FoodData Central

Status: ready-for-agent

## Parent

`.scratch/nutrition-tracker/spec.md`

## What to build

The user says "I ate a kiwi" and it is logged — no packet, no label, no going off to find the numbers. The macros come from a real reference rather than a guess.

A *look up USDA food* tool takes a free-text query, searches FoodData Central restricted to the **Foundation and SR Legacy** data types, takes the top hit, maps the standard nutrient identifiers to per-100g calories/protein/carbs/fat, and returns those along with **the matched food's name**. Surfacing the matched name is the point: USDA's top pick hides genuine ambiguity — a query like "kiwi" returns raw, frozen, Foundation, SR Legacy and branded variants — and restricting the data types plus showing what matched is the mitigation. The user must be able to spot a wrong match.

The agent then logs the entry with source `usda` and a per-100g base, reusing the existing log tool and its gram scaling.

`FDC_API_KEY` is already set in `.env.local`.

A failed lookup — no results, or the API erroring — is reported in chat rather than silently dropped, so the user knows to log the item another way.

Scraping the FoodData Central website was considered and rejected: the site is a client-rendered SPA, so "browsing" it would mean driving a headless browser per lookup — slower, fragile, and worse-structured than the free JSON API over the same dataset. Do not revisit this.

Only calories, protein, carbs and fat are kept. Fiber, sugar, sodium and the rest of what FDC provides are discarded on ingest.

## Acceptance criteria

- [x] Naming an unlabeled whole food in chat commits an entry with macros sourced from FoodData Central
- [x] The search is restricted to the Foundation and SR Legacy data types
- [x] The matched food's name is shown to the user in the conversation
- [x] Entries from this path are stored with source `usda` and a per-100g base
- [x] Totals from a USDA entry and a label entry aggregate correctly together, covered by a test at the tool seam
- [x] A lookup that finds nothing, or fails, produces a message in chat rather than a silent drop
- [x] Nutrients beyond the four are discarded rather than stored
- [x] `npm run check` passes

## Blocked by

- `02-log-stated-macros.md`

## Comments

**Implemented.** A `lookUpUsdaFood` tool sits beside `logFoodEntry`; the FoodData
Central client lives in `src/lib/nutrition/usda.ts` and the tests in
`src/lib/nutrition/usda.test.ts` drive it through the tool seam with a stand-in for
the API, so the nutrient mapping and the data-type restriction are asserted without
touching the network. The logging tool needed no change — a USDA food is an ordinary
`g`-unit entry over a per-100g base.

Four things worth knowing:

- **Energy needs three nutrient ids, not one.** SR Legacy foods carry `1008` (`Energy`,
  kcal); Foundation foods often carry only the Atwater-derived figures, so the client
  falls back `1008` → `2048` (specific factors) → `2047` (general). A kiwi in the
  Foundation set has no `1008` at all, so mapping only the obvious id would have failed
  the headline case.
- **The top hit really is wrong for bare queries**, verified live: `kiwi` returns
  *Beverages, Kiwi Strawberry Juice Drink* and `apple` returns *Rose-apples, raw*, both
  inside Foundation/SR Legacy. `kiwifruit raw` and `apples raw` return the right foods,
  so the system prompt tells the model to search with the food's name and state. The
  tool still takes the single top hit and still surfaces the matched name, per the spec
  — but if this proves insufficient in use, the spec's own next step (offer the top few
  candidates) is the fix, and this is the evidence for taking it.
- **A weight has to be assumed** when the user just says "a kiwi": the lookup answers
  per 100g and the log needs a quantity. The prompt has the model use a typical weight
  for one of the item and say which weight it assumed. That is a guess about portion
  size, never about the nutrients.
- **A failed lookup is a return value, not a throw.** No results, a non-200, a dead
  network and a missing `FDC_API_KEY` all come back as `found: false` with a message
  the model relays, which is what keeps a failure out of the silent-drop category.

Not verified here: the chat flow end to end, which needs a Gateway key and belongs to
`07-live-smoke-test.md`.
