import { test, expect, devices, type Page } from "@playwright/test";

// Deliberately restated rather than imported from the targets module: the test
// is the independent oracle for what the page should say.
const MACROS = [
  { label: "Calories", target: "2400" },
  { label: "Protein", target: "180" },
  { label: "Carbs", target: "240" },
  { label: "Fat", target: "80" },
];

test("an empty log reads zero against every target", async ({ page }) => {
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

/** The one thing a layout must never do, asserted at whatever width is in use. */
async function expectNoHorizontalScroll(page: Page) {
  const overflows = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
}

test("the page does not scroll horizontally", async ({ page }) => {
  await page.goto("/");

  await expectNoHorizontalScroll(page);
});

/**
 * Where the day list is, not what is in it — its contents are the read seam's
 * to get right, and its tests already do.
 */
const dayList = (page: Page) => page.locator('[data-slot="sidebar"]');

test("the day list sits beside the conversation on a desktop", async ({
  page,
}) => {
  await page.goto("/");

  // No trigger to find it behind: it is simply there.
  await expect(dayList(page)).toBeVisible();
});

test.describe("on a phone", () => {
  test.use({ viewport: devices["Pixel 7"].viewport });

  test("the day list is off-canvas until it is asked for", async ({ page }) => {
    await page.goto("/");

    await expect(dayList(page)).toBeHidden();

    await page.getByRole("button", { name: "Toggle Sidebar" }).click();

    await expect(dayList(page)).toBeVisible();
  });

  test("the page does not scroll horizontally", async ({ page }) => {
    await page.goto("/");

    await expectNoHorizontalScroll(page);
  });
});

test("the chat is ready to take a message", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("textbox")).toBeVisible();
  // Nothing is in flight, so nothing claims to be working.
  await expect(page.getByText("Working on it")).toBeHidden();
});
