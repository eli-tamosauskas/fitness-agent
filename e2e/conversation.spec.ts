import { test, expect } from "@playwright/test";

/**
 * The whole feature in one assertion. The message is persisted when it arrives,
 * before the model is asked anything, so this holds whether or not the reply
 * lands — which keeps the test off the network's critical path.
 */
test("today's conversation is still there after a reload", async ({ page }) => {
  await page.goto("/");

  // Nothing that could be logged: the other specs share this day's log and
  // read the rings as zero.
  const said = "hello, nothing to log yet";
  await page.getByRole("textbox").fill(said);

  // The message appears on screen before it has been sent, so waiting for the
  // response headers is what makes the reload below a reload rather than a
  // cancellation of the request that was meant to persist it.
  const sent = page.waitForResponse((response) =>
    response.url().includes("/api/chat"),
  );
  await page.getByRole("button", { name: /send|submit/i }).click();
  await expect(page.getByText(said)).toBeVisible();
  await sent;

  await page.reload();

  await expect(page.getByText(said)).toBeVisible();
});
