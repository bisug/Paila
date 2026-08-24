import { test, expect } from "@playwright/test";

const routes = [
  "/",
  "/guides",
  "/hotels",
  "/impact",
  "/login",
  "/map",
  "/notifications",
  "/onboarding/account-type",
  "/onboarding/interests",
  "/preferences",
  "/profile",
  "/profile/account",
  "/profile/bookings",
  "/profile/settings",
  "/scan",
  "/talk",
  "/transport",
];

test.describe("route smoke coverage", () => {
  for (const route of routes) {
    test(`${route} renders without a server error`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });

      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).not.toBeEmpty();
      await expect(page.locator("body")).not.toContainText("Application error");
    });
  }
});

test("mobile layout does not overflow horizontally", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});

test("keyboard focus reaches an interactive control", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.keyboard.press("Tab");

  await expect(page.locator(":focus")).toBeVisible();
});
