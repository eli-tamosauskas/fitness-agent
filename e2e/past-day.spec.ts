import { test, expect } from "@playwright/test";

/** Long past, whenever this runs, and nothing was ever logged on it. */
const PAST_DAY = "2020-01-01";

/**
 * The thin half of the feature: a past day is a real URL, and it cannot be
 * written to. The composer's absence is the whole assertion — what is on the
 * day is the seam's test, not this one's.
 */
test("a past day offers nothing to write with", async ({ page }) => {
  await page.goto(`/${PAST_DAY}`);

  await expect(page.getByText(`${PAST_DAY} log`)).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
});

test("a day that has not happened sends you back to today", async ({
  page,
}) => {
  await page.goto("/2999-12-31");

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("textbox")).toBeVisible();
});

test("a segment that is not a date is not a day", async ({ page }) => {
  const response = await page.goto("/not-a-date");

  expect(response?.status()).toBe(404);
});

test("the back button returns to the day it came from", async ({ page }) => {
  await page.goto("/");
  await page.goto(`/${PAST_DAY}`);

  await page.goBack();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("textbox")).toBeVisible();
});
