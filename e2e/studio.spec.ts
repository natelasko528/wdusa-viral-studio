import { expect, test } from "@playwright/test";
import { skipUnlessCreatomate, skipUnlessDb } from "./helpers";

test.describe("Studio", () => {
  test.beforeEach(async ({ request }, testInfo) => {
    await skipUnlessDb(request, testInfo);
  });

  test("template mode shows template select or empty state; RenderScript toggles", async ({ page }) => {
    await page.goto("/studio");
    await expect(page.getByRole("heading", { name: "Studio" })).toBeVisible();

    const empty = page.getByTestId("template-form-empty");
    const select = page.getByTestId("studio-template-select");

    await expect(empty.or(select)).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("studio-mode-renderscript").click();
    await expect(page.getByLabel(/phone/i)).toBeVisible();

    await page.getByTestId("studio-mode-template").click();
    await expect(empty.or(select)).toBeVisible();
  });

  test("Start render hits real API (skipped without Creatomate + template in env)", async ({
    page,
    request,
  }, testInfo) => {
    await skipUnlessCreatomate(request, testInfo);

    await page.goto("/studio");
    await page.getByTestId("studio-mode-template").click();

    const empty = page.getByTestId("template-form-empty");
    const hasTemplate = await page.getByTestId("studio-template-select").isVisible().catch(() => false);
    testInfo.skip(!hasTemplate && (await empty.isVisible()), "No VideoTemplate rows — run db:seed or e2e-prep");

    await page.getByLabel("Hook").fill("E2E hook line");
    await page.getByRole("button", { name: "Start render" }).click();

    await expect(page.getByTestId("studio-render-status")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("studio-render-status")).toContainText(/queued|rendering|succeeded|failed/i);
  });
});
