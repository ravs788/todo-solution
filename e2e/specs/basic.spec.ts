import { test, expect } from "@playwright/test";

test.describe("Smoke-test UI", () => {
  test("Home page renders", async ({ page }) => {
    // Navigate to the baseUrl defined in playwright.config.ts
    await page.goto("/");

    // Check if login page is displayed and perform login
    const loginHeading = page.getByRole("heading", { name: "Login" });
    if (await loginHeading.isVisible()) {
      // Use getByLabel if labels are associated with inputs, otherwise use a more general selector
      const usernameField = page.locator('input[type="text"]');
      const passwordField = page.locator('input[type="password"]');
      await usernameField.fill("testuser");
      await passwordField.fill("testpass");
      await page.getByRole("button", { name: "Login" }).click();
    }

    // Expect the app title (in the browser tab) to contain "Todo"
    // await expect(page).toHaveTitle(/todo/i);

    // Expect the main heading (h1/h2) to be visible on the page
    const heading = page
      .getByRole("heading", { level: 1 })
      .or(page.getByRole("heading", { level: 2 }));
    await expect(heading).toBeVisible();
  });
});
