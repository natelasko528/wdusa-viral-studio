import { expect, test } from "@playwright/test";

test.describe("Navigation", () => {
  test("home redirects to studio", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/studio$/);
    await expect(page.getByRole("heading", { name: "Studio" })).toBeVisible();
  });

  test("sidebar reaches every main route", async ({ page }) => {
    await page.goto("/studio");
    await page.setViewportSize({ width: 1280, height: 800 });

    const routes = [
      { path: "/kb", link: "Knowledge Base", heading: "Knowledge Base" },
      { path: "/templates", link: "Templates", heading: "Templates" },
      { path: "/chat", link: "Chat", heading: "AI chat" },
      { path: "/settings", link: "Settings", heading: "Settings" },
      { path: "/studio", link: "Studio", heading: "Studio" },
    ] as const;

    for (const { path, link, heading } of routes) {
      await page.locator("aside").getByRole("link", { name: link }).click();
      await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("theme toggle flips data-theme on document", async ({ page }) => {
    await page.goto("/settings");
    const before = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    await page.getByRole("banner").getByTestId("theme-toggle").click();
    const after = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(after).not.toBe(before);
    expect(["light", "dark"]).toContain(after);
  });
});
