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

- [ ] Naming an unlabeled whole food in chat commits an entry with macros sourced from FoodData Central
- [ ] The search is restricted to the Foundation and SR Legacy data types
- [ ] The matched food's name is shown to the user in the conversation
- [ ] Entries from this path are stored with source `usda` and a per-100g base
- [ ] Totals from a USDA entry and a label entry aggregate correctly together, covered by a test at the tool seam
- [ ] A lookup that finds nothing, or fails, produces a message in chat rather than a silent drop
- [ ] Nutrients beyond the four are discarded rather than stored
- [ ] `npm run check` passes

## Blocked by

- `02-log-stated-macros.md`
