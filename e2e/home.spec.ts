import { test, expect } from "@playwright/test";

// Deliberately restated rather than imported from the targets module: the test
// is the independent oracle for what the page should say.
const MACROS = [
  { label: "Calories", target: "2400" },
  { label: "Protein", target: "180" },
  { label: "Carbs", target: "240" },
  { label: "Fat", target: "80" },
];

test("the macro header reads zero against every target", async ({ page }) => {
  await page.goto("/");

  for (const { label, target } of MACROS) {
    const ring = page.getByRole("progressbar", { name: label });
    await expect(ring).toContainText(`0 / ${target}`);
    await expect(ring).toHaveAttribute("aria-valuenow", "0");
  }
});

test("the four stats sit side by side without wrapping", async ({ page }) => {
  await page.goto("/");

  const rings = page.getByRole("progressbar");
  await expect(rings).toHaveCount(4);

  const boxes = await Promise.all(
    (await rings.all()).map(async (ring) => {
      const box = await ring.boundingBox();
      expect(box).not.toBeNull();
      return box!;
    }),
  );

  // Same row: every ring shares a top edge, and each starts right of the last.
  for (const box of boxes.slice(1)) {
    expect(box.y).toBeCloseTo(boxes[0].y, 0);
  }
  for (const [index, box] of boxes.slice(1).entries()) {
    const previous = boxes[index];
    expect(box.x).toBeGreaterThanOrEqual(previous.x + previous.width);
  }
});

test("the page does not scroll horizontally", async ({ page }) => {
  await page.goto("/");

  const overflows = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});
