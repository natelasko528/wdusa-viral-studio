import { expect, test } from "@playwright/test";
import { skipUnlessOpenAI } from "./helpers";

test.describe("Chat", () => {
  test("full-page chat send returns assistant content when OpenAI is configured", async ({
    page,
    request,
  }, testInfo) => {
    await skipUnlessOpenAI(request, testInfo);

    await page.goto("/chat");
    await page.getByTestId("chat-page-input").fill("Say exactly: E2E_OK");
    await page.getByTestId("chat-page-send").click();

    await expect(page.getByText("E2E_OK", { exact: true })).toBeVisible({ timeout: 90_000 });
  });

  test("slide-out panel opens from FAB and accepts input", async ({ page }) => {
    await page.goto("/studio");
    await page.getByTestId("chat-fab").click();
    await expect(page.getByRole("heading", { name: "WDUSA assistant" })).toBeVisible();
    await page.getByTestId("chat-panel-input").fill("hello");
    await expect(page.getByTestId("chat-panel-send")).toBeEnabled();
  });
});
