import { expect, test } from "@playwright/test";
import { skipUnlessDb } from "./helpers";

test.describe("Knowledge Base", () => {
  test.beforeEach(async ({ request }, testInfo) => {
    await skipUnlessDb(request, testInfo);
  });

  test("search loads facts or empty state from database", async ({ page }) => {
    await page.goto("/kb");
    await expect(page.getByRole("heading", { name: "Knowledge Base" })).toBeVisible();

    await page.getByTestId("kb-search").click();
    await expect(page.getByTestId("kb-search")).toBeVisible();

    const factCard = page.locator("li").filter({ has: page.getByRole("link", { name: "Source" }) });
    const empty = page.getByText("No facts match");

    await expect(factCard.or(empty)).toBeVisible({ timeout: 20_000 });
  });
});
