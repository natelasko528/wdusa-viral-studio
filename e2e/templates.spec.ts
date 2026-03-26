import { expect, test } from "@playwright/test";
import { skipUnlessDb } from "./helpers";

test.describe("Templates page", () => {
  test.beforeEach(async ({ request }, testInfo) => {
    await skipUnlessDb(request, testInfo);
  });

  test("lists templates from API or empty state", async ({ page }) => {
    await page.goto("/templates");
    await expect(page.getByRole("heading", { name: "Templates" })).toBeVisible();

    const listHeading = page.locator("h3").first();
    const empty = page.getByText("No templates yet");

    await expect(listHeading.or(empty)).toBeVisible({ timeout: 20_000 });
  });

  test("Run create flow POSTs to browser agent route", async ({ page }) => {
    await page.goto("/templates");

    const responses: number[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/api/browser/create-template")) responses.push(res.status());
    });

    await page.getByTestId("templates-browser-create").click();
    await expect.poll(() => responses.length).toBeGreaterThan(0);
    const status = responses[responses.length - 1]!;
    expect([200, 400, 401, 403, 500, 503]).toContain(status);
  });
});
