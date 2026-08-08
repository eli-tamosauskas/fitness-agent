import { test, expect } from "@playwright/test";

/** A one-pixel PNG. The point is the attaching, not what is in the picture. */
const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

test("a nutrition label photo can be attached to a message", async ({
  page,
}) => {
  await page.goto("/");

  const fileInput = page.locator('input[type="file"]');
  // A phone should offer its camera rather than a file browser.
  await expect(fileInput).toHaveAttribute("capture", "environment");
  await expect(fileInput).toHaveAttribute("accept", "image/*");

  await fileInput.setInputFiles({
    name: "label.png",
    mimeType: "image/png",
    buffer: PIXEL_PNG,
  });

  // The pending photo is visible before sending, and can be taken back off.
  await expect(page.getByRole("img", { name: "label.png" })).toBeVisible();
  await expect(page.getByRole("button", { name: /remove/i })).toBeVisible();
});

test("a photo on its own is enough to send a message", async ({ page }) => {
  await page.goto("/");

  const send = page.getByRole("button", { name: /send|submit/i });
  await expect(send).toBeDisabled();

  await page.locator('input[type="file"]').setInputFiles({
    name: "label.png",
    mimeType: "image/png",
    buffer: PIXEL_PNG,
  });

  await expect(send).toBeEnabled();
});
