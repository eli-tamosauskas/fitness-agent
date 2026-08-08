# Macro header: four target rings

Status: ready-for-agent

## Parent

`.scratch/nutrition-tracker/spec.md`

## What to build

The macro header that sits across the top of the single page, plus the page shell it lives in. This slice deliberately stops short of any logged data — consumption is zero, so every ring reads `0 / target`. It exists to nail the visual contract and the targets module before anything writes to it.

Four daily targets — calories, protein, carbs, fat — are hardcoded constants in one exported module. Changing a target is a code edit; they are not per-day and not user-editable. Each target renders as a progress ring with its raw consumed-over-target numbers beside it. All four sit in a fixed four-column grid that neither wraps nor scrolls horizontally at desktop widths.

No progress-ring primitive exists in the installed component libraries, so the ring is a custom inline SVG — a track circle plus an arc circle driven by dash-array/dash-offset. The ring component takes consumed and target as props and must already handle the over-target case: the arc caps at 100% rather than wrapping, the ring switches to an "over" color token, and the raw consumed-over-target text is shown unchanged so the overage is visible by how much. Unit-test the over-target and capping behavior through the component.

The page becomes a server component. It replaces the create-next-app placeholder in `src/app/page.tsx` entirely, and the existing home-page Playwright test asserts on that placeholder's heading and docs link — update it to assert on the macro header instead.

Follow the project's UI sourcing order: reuse existing components, then the shadcn / bundled `ai-elements` registry, then custom.

## Acceptance criteria

- [ ] The four targets are hardcoded constants exported from a single module
- [ ] Each of calories, protein, carbs and fat renders as a ring with its raw numbers beside it
- [ ] The four stats sit side by side at desktop width with no wrapping and no horizontal scrolling
- [ ] With no consumption, every ring reads zero against its target
- [ ] Given consumed above target, the arc caps at full instead of wrapping, the ring uses the "over" color token, and the raw figure still shows the true amount
- [ ] The create-next-app placeholder page is gone
- [ ] The home-page e2e test asserts on the macro header and passes
- [ ] `npm run check` passes

## Blocked by

None - can start immediately
