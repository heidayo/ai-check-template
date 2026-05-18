import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("@smoke primary page is reachable", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("@smoke primary navigation exposes a user-facing control", async ({ page }) => {
    await page.goto("/");

    // Replace this with the first critical user-facing action in your app.
    await expect(page.getByRole("link").first()).toBeVisible();
  });
});
