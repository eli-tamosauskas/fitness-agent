import { test, expect } from "@playwright/test";

test("home page renders its heading and docs link", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "To get started, edit the",
  );
  await expect(
    page.getByRole("link", { name: "Documentation" }),
  ).toHaveAttribute("href", /nextjs\.org\/docs/);
});
