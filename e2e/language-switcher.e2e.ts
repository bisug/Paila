import { test, expect } from "@playwright/test";

// The language picker is a hand-rolled menu (no dropdown primitive is
// installed), so its keyboard contract is worth pinning down.
test.describe("language switcher menu", () => {
  test("opens, moves with arrow keys, and closes on Escape with focus returned", async ({
    page,
  }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    const trigger = page.getByRole("button", { name: "Change language" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.focus();
    await page.keyboard.press("ArrowDown");

    const menu = page.getByRole("menu", { name: "Change language" });
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const options = menu.getByRole("menuitemradio");
    await expect(options.first()).toBeFocused();
    await expect(options.first()).toHaveAttribute("aria-checked", "true");

    await page.keyboard.press("ArrowDown");
    await expect(options.nth(1)).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("selecting an option applies the language and closes the menu", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Change language" }).click();
    const menu = page.getByRole("menu", { name: "Change language" });
    await menu.getByRole("menuitemradio").filter({ hasText: "नेपाली" }).click();

    await expect(menu).toBeHidden();
    await expect(page.locator("html")).toHaveAttribute("lang", "ne");

    // Reset so the choice does not leak into a shared browser profile.
    await page.evaluate(() => window.localStorage.removeItem("paila.lang"));
  });
});
